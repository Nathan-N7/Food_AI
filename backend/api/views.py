
import pyotp
import qrcode
import base64
from io import BytesIO
from django.core import signing
from uuid import uuid4

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from pydantic import ValidationError

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .graph import food_graph
from .models import Generation
from .scheemas import (
    DetectionResult,
    GeminiAnalysis,
    FluxPrompt,
    PipelineResponse,
)
from .services.flux_image_generate import flux_image_generate
from .services.images_utils import file_to_data_url
from .services.rtdetr import RtFilter
from .services.save_image import save_image_from_url


User = get_user_model()


class RegenerateImageView(APIView):
    def post(self, request, *args, **kwargs):
        thread_id = request.data.get("thread_id")

        if not thread_id:
            return Response(
                {"error": "thread_id obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            config = {
                "configurable": {
                    "thread_id": thread_id,
                }
            }

            snapshot = food_graph.get_state(config)
            state = snapshot.values

            if not state:
                return Response(
                    {
                        "error": (
                            "Estado não encontrado para esse thread_id"
                        )
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            prompt = state.get("prompt")
            image_data = state.get("image_data")
            analysis = state.get("analysis")

            if not prompt or not image_data:
                return Response(
                    {
                        "error": (
                            "Estado incompleto: prompt "
                            "ou image_data ausente"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            prompt_model = FluxPrompt.model_validate(prompt)

            url_image = flux_image_generate(
                prompt_model.model_dump(),
                image_data,
            )

            url_image = str(url_image)

            save_image_from_url(url_image)

            return Response(
                {
                    "thread_id": thread_id,
                    "analysis": analysis,
                    "prompt": prompt_model.model_dump(),
                    "url_image": url_image,
                },
                status=status.HTTP_200_OK,
            )

        except ValidationError as e:
            return Response(
                {
                    "error": "Erro de validação no regenerate",
                    "details": e.errors(),
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        except Exception as e:
            return Response(
                {
                    "error": "Erro ao regenerar imagem",
                    "details": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class validationFoodView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        file_image = request.FILES.get("image")

        if not file_image:
            return Response(
                {"error": "Nenhuma imagem enviada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if file_image.content_type not in allowed_types:
            return Response(
                {
                    "error": "Formato de imagem não suportado",
                    "allowed_types": sorted(allowed_types),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_size = 10 * 1024 * 1024

        if file_image.size > max_size:
            return Response(
                {
                    "error": "A imagem deve ter no máximo 10 MB"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = RtFilter(file_image)

            result_model = DetectionResult.model_validate(
                result
            )

            if result_model.validate is not True:
                return Response(
                    {
                        "resultado": result_model.model_dump(),
                        "error": (
                            "Imagem rejeitada pelo "
                            "Real-Time Detection Transformer"
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            image_data = file_to_data_url(file_image)

            thread_id = str(uuid4())

            initial_state = {
                "image_data": image_data,
                "resultado": result_model.model_dump(),
                "analysis": None,
                "prompt": None,
                "url_image": None,
                "error": None,
            }

            config = {
                "configurable": {
                    "thread_id": thread_id,
                }
            }

            final_state = food_graph.invoke(
                initial_state,
                config=config,
            )

            if final_state.get("error"):
                return Response(
                    {
                        "error": (
                            "Erro durante o processamento da imagem"
                        ),
                        "details": final_state["error"],
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            analysis_model = GeminiAnalysis.model_validate(
                final_state["analysis"]
            )

            prompt_model = FluxPrompt.model_validate(
                final_state["prompt"]
            )

            url_image = str(
                final_state["url_image"]
            )

            save_image_from_url(url_image)

            file_image.seek(0)

            Generation.objects.create(
                user=request.user,
                original_image=file_image,
                generated_image=url_image,
                prompt=prompt_model.model_dump(),
                status="completed",
            )

            response_model = PipelineResponse(
                resultado=result_model,
                analysis=analysis_model,
                prompt=prompt_model,
                url_image=url_image,
            )

            return Response(
                {
                    "thread_id": thread_id,
                    **response_model.model_dump(),
                },
                status=status.HTTP_200_OK,
            )

        except ValidationError as e:
            return Response(
                {
                    "error": "Erro de validação entre etapas",
                    "details": e.errors(),
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        except Exception as e:
            return Response(
                {
                    "error": "Erro interno no pipeline",
                    "details": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = (
            request.data.get("username") or ""
        ).strip()

        email = (
            request.data.get("email") or ""
        ).strip()

        password = (
            request.data.get("password") or ""
        )

        if not username or not password:
            return Response(
                {
                    "error": (
                        "username e password são obrigatórios"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(
            username=username
        ).exists():
            return Response(
                {"error": "username já existe"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password)

        except DjangoValidationError as e:
            return Response(
                {
                    "error": "senha inválida",
                    "details": list(e.messages),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = (
            request.data.get("username") or ""
        ).strip()

        password = (
            request.data.get("password") or ""
        )

        if not username or not password:
            return Response(
                {
                    "error": (
                        "username e password são obrigatórios"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request=request,
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {"error": "credenciais inválidas"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        profile = user.profile
        if profile.two_factor_enabled:
            temp_token = signing.dumps({"user_id": user.id})
            return Response({"require_2fa": True, "temp_token": temp_token}, status=status.HTTP_200_OK)

        token, _ = Token.objects.get_or_create(
            user=user
        )

        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=status.HTTP_200_OK,
        )


class GenerationListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        generations = (
            Generation.objects
            .filter(user=request.user)
            .order_by("-created_at")
        )

        data = []

        for generation in generations:
            original_image_url = (
                request.build_absolute_uri(
                    generation.original_image.url
                )
                if generation.original_image
                else None
            )

            data.append(
                {
                    "id": generation.id,
                    "status": generation.status,
                    "prompt": generation.prompt,
                    "original_image": original_image_url,
                    "generated_image": (
                        generation.generated_image
                    ),
                    "created_at": (
                        generation.created_at.isoformat()
                    ),
                }
            )

        return Response(
            data,
            status=status.HTTP_200_OK,
        )


class GenerationDeleteView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            generation = Generation.objects.get(
                pk=pk,
                user=request.user,
            )
        except Generation.DoesNotExist:
            return Response(
                {"error": "Geração não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Deleta o arquivo físico do disco junto
        if generation.original_image:
            generation.original_image.delete(save=False)

        generation.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

from django.utils import timezone

class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        profile = request.user.profile
        profile.is_online = False
        profile.save(update_fields=['is_online'])
        return Response({"status": "logged out"}, status=status.HTTP_200_OK)

class PingView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        profile = request.user.profile
        profile.is_online = True
        profile.last_seen = timezone.now()
        profile.save(update_fields=['is_online', 'last_seen'])
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

class Login2FAView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        temp_token = request.data.get("temp_token")
        totp_code = request.data.get("totp_code")

        if not temp_token or not totp_code:
            return Response({"error": "temp_token e totp_code são obrigatórios"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = signing.loads(temp_token, max_age=300)
            user_id = data.get("user_id")
        except signing.BadSignature:
            return Response({"error": "Token expirado ou inválido"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
        profile = user.profile

        if not profile.two_factor_enabled or not profile.two_factor_secret:
            return Response({"error": "2FA não está habilitado para este usuário"}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(totp_code):
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user": {"id": user.id, "username": user.username, "email": user.email},
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Código TOTP inválido"}, status=status.HTTP_401_UNAUTHORIZED)

class Setup2FAView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if profile.two_factor_enabled:
            return Response({"error": "2FA já está habilitado"}, status=status.HTTP_400_BAD_REQUEST)

        secret = pyotp.random_base32()
        profile.two_factor_secret = secret
        profile.save()

        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=request.user.email, issuer_name="Transcendence")

        qr = qrcode.make(uri)
        buf = BytesIO()
        qr.save(buf, format="PNG")
        image_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return Response({
            "secret": secret,
            "qr_code": f"data:image/png;base64,{image_base64}"
        }, status=status.HTTP_200_OK)

class Verify2FAView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        if profile.two_factor_enabled:
            return Response({"error": "2FA já está habilitado"}, status=status.HTTP_400_BAD_REQUEST)

        totp_code = request.data.get("totp_code")
        if not totp_code or not profile.two_factor_secret:
            return Response({"error": "Código ausente ou setup não iniciado"}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(totp_code):
            profile.two_factor_enabled = True
            profile.save()
            return Response({"status": "2FA habilitado com sucesso"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST)

class Disable2FAView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password")
        totp_code = request.data.get("totp_code")

        if not password or not totp_code:
            return Response({"error": "Senha e código são obrigatórios"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=request.user.username, password=password)
        if not user:
            return Response({"error": "Senha incorreta"}, status=status.HTTP_401_UNAUTHORIZED)

        profile = user.profile
        if not profile.two_factor_enabled:
            return Response({"error": "2FA já está desabilitado"}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(totp_code):
            profile.two_factor_enabled = False
            profile.two_factor_secret = None
            profile.save()
            return Response({"status": "2FA desabilitado com sucesso"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Código inválido"}, status=status.HTTP_401_UNAUTHORIZED)
