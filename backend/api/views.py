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
