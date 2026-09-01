from uuid import uuid4

import logging

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q

from pydantic import ValidationError

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import (
    AnonRateThrottle,
    ScopedRateThrottle,
)

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .graph import food_graph
from .models import Friendship, Generation, Profile
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
logger = logging.getLogger(__name__)

# Shared auth/perm for authenticated views.
AUTH_AUTHENTICATION = [SessionAuthentication]
AUTH_PERMISSION = [IsAuthenticated]


class RegenerateImageView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = AUTH_PERMISSION
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_regenerate"

    def post(self, request, *args, **kwargs):
        thread_id = request.data.get("thread_id")

        if not thread_id:
            return Response(
                {"error": "thread_id obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ownership check: the thread must belong to the requesting user.
        owns_thread = Generation.objects.filter(
            user=request.user,
            thread_id=thread_id,
        ).exists()

        if not owns_thread:
            return Response(
                {"error": "thread_id não pertence ao usuário"},
                status=status.HTTP_404_NOT_FOUND,
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
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = AUTH_PERMISSION
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_generate"

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
                thread_id=thread_id,
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
    throttle_classes = [AnonRateThrottle]

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

        nickname = (
            request.data.get("nickname")
            or request.data.get("usernickname")
            or ""
        ).strip()

        if not email or not password or not username:
            return Response(
                {
                    "error": (
                        "email, username e password são obrigatórios"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "username já existe"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "email já existe"},
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

        # A Profile is auto-created by the post_save signal; apply the nickname.
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={"nickname": nickname},
        )
        if not created and nickname:
            profile.nickname = nickname
            profile.save()

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "nickname": nickname,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        identifier = (
            request.data.get("username")
            or request.data.get("useremail")
            or request.data.get("email")
            or ""
        ).strip()

        password = (
            request.data.get("password") or ""
        )

        if not identifier or not password:
            return Response(
                {
                    "error": (
                        "username/email e password são obrigatórios"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tenta autenticar pelo username
        user = authenticate(
            request=request,
            username=identifier,
            password=password,
        )

        # Se falhar, tenta buscar pelo email
        if user is None:
            user_by_email = User.objects.filter(email=identifier).first()
            if user_by_email:
                user = authenticate(
                    request=request,
                    username=user_by_email.username,
                    password=password,
                )

        if user is None:
            return Response(
                {"error": "credenciais inválidas"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Establish the server-side session (httpOnly cookie).
        login(request, user)

        profile = Profile.objects.get(user=user)

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "nickname": profile.nickname,
                },
            },
            status=status.HTTP_200_OK,
        )


class AuthMeView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = AUTH_PERMISSION
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def get(self, request):
        user = request.user
        profile = Profile.objects.get(user=user)
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "nickname": profile.nickname,
            },
            status=status.HTTP_200_OK,
        )


class AuthLogoutView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = AUTH_PERMISSION

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)


class GenerationListView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

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
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

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


def notify_user_channel(user_id, action, data):
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}",
                {
                    "type": "friend_request_notification",
                    "action": action,
                    "data": data,
                },
            )
    except Exception as e:
        logger.warning(
            "Falha ao notificar canal do usuário %s (action=%s): %s",
            user_id,
            action,
            e,
        )


class ProfileDetailView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def get(self, request):
        user = request.user
        profile = Profile.objects.get(user=user)

        generations_count = Generation.objects.filter(user=user).count()
        friends_count = Friendship.objects.filter(
            status="accepted"
        ).filter(
            Q(sender=user) | Q(receiver=user)
        ).count()

        avatar_url = profile.get_avatar_url(request)

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "nickname": profile.nickname,
                "bio": profile.bio,
                "avatar": avatar_url,
                "is_online": profile.is_online,
                "date_joined": user.date_joined.isoformat(),
                "generations_count": generations_count,
                "friends_count": friends_count,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        return self.patch(request)

    def patch(self, request):
        user = request.user
        # Profile auto-created by the post_save signal at user creation.
        profile = Profile.objects.get(user=user)

        # Validate everything BEFORE entering the atomic block so validation
        # errors never cause partial commits.
        nickname = request.data.get("nickname")
        bio = request.data.get("bio")

        email = request.data.get("email")
        if email is not None:
            email = email.strip()
            if email and email != user.email:
                if User.objects.filter(email=email).exclude(id=user.id).exists():
                    return Response(
                        {"error": "Este email já está em uso por outro usuário"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        avatar_file = request.FILES.get("avatar")
        if avatar_file:
            allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
            if avatar_file.content_type not in allowed_types:
                return Response(
                    {"error": "Formato de avatar não suportado (permitidos: JPG, PNG, WEBP, GIF)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if avatar_file.size > 5 * 1024 * 1024:
                return Response(
                    {"error": "O avatar deve ter no máximo 5 MB"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        if new_password:
            if not current_password or not user.check_password(current_password):
                return Response(
                    {"error": "Senha atual incorreta"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                validate_password(new_password, user=user)
            except DjangoValidationError as e:
                return Response(
                    {"error": "Nova senha inválida", "details": list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # All validation passed -> apply mutations atomically.
        with transaction.atomic():
            if nickname is not None:
                profile.nickname = nickname.strip()

            if bio is not None:
                profile.bio = bio.strip()

            if email is not None:
                email = email.strip()
                if email and email != user.email:
                    user.email = email
                    user.save(update_fields=["email"])

            # Handle avatar upload
            if avatar_file:
                # Delete old avatar file if present
                if profile.avatar:
                    profile.avatar.delete(save=False)
                profile.avatar = avatar_file

            # Handle avatar removal
            if request.data.get("remove_avatar") == "true" or request.data.get("remove_avatar") is True:
                if profile.avatar:
                    profile.avatar.delete(save=False)
                    profile.avatar = None

            profile.save()

            # Handle password change
            if new_password:
                user.set_password(new_password)
                user.save(update_fields=["password"])

        generations_count = Generation.objects.filter(user=user).count()
        friends_count = Friendship.objects.filter(
            status="accepted"
        ).filter(
            Q(sender=user) | Q(receiver=user)
        ).count()

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "nickname": profile.nickname,
                "bio": profile.bio,
                "avatar": profile.get_avatar_url(request),
                "is_online": profile.is_online,
                "date_joined": user.date_joined.isoformat(),
                "generations_count": generations_count,
                "friends_count": friends_count,
                "message": "Perfil atualizado com sucesso",
            },
            status=status.HTTP_200_OK,
        )


class UserProfileView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def get(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        target_profile = Profile.objects.get(user=target_user)
        generations_count = Generation.objects.filter(user=target_user).count()

        # Check friendship status
        friendship_status = "none"
        friendship_id = None
        if target_user == request.user:
            friendship_status = "self"
        else:
            friendship = Friendship.objects.filter(
                (Q(sender=request.user) & Q(receiver=target_user))
                | (Q(sender=target_user) & Q(receiver=request.user))
            ).first()

            if friendship:
                friendship_id = friendship.id
                if friendship.status == "accepted":
                    friendship_status = "accepted"
                elif friendship.sender == request.user:
                    friendship_status = "pending_sent"
                else:
                    friendship_status = "pending_received"

        return Response(
            {
                "id": target_user.id,
                "username": target_user.username,
                "nickname": target_profile.nickname,
                "bio": target_profile.bio,
                "avatar": target_profile.get_avatar_url(request),
                "is_online": target_profile.is_online,
                "date_joined": target_user.date_joined.isoformat(),
                "generations_count": generations_count,
                "friendship_status": friendship_status,
                "friendship_id": friendship_id,
            },
            status=status.HTTP_200_OK,
        )


class UserSearchView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        if not query:
            return Response([], status=status.HTTP_200_OK)

        users = User.objects.filter(
            Q(username__icontains=query)
            | Q(email__icontains=query)
            | Q(profile__nickname__icontains=query)
        ).exclude(id=request.user.id).select_related("profile")[:20]

        # Get all existing friendships for current user to label status
        user_friendships = Friendship.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )
        friendship_map = {}
        for f in user_friendships:
            other_id = f.receiver_id if f.sender_id == request.user.id else f.sender_id
            if f.status == "accepted":
                friendship_map[other_id] = ("accepted", f.id)
            elif f.sender_id == request.user.id:
                friendship_map[other_id] = ("pending_sent", f.id)
            else:
                friendship_map[other_id] = ("pending_received", f.id)

        results = []
        for u in users:
            prof = Profile.objects.get(user=u)
            f_status, f_id = friendship_map.get(u.id, ("none", None))
            results.append({
                "id": u.id,
                "username": u.username,
                "nickname": prof.nickname,
                "bio": prof.bio,
                "avatar": prof.get_avatar_url(request),
                "is_online": prof.is_online,
                "friendship_status": f_status,
                "friendship_id": f_id,
            })

        return Response(results, status=status.HTTP_200_OK)


class FriendListView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def get(self, request):
        user = request.user
        friendships = Friendship.objects.filter(
            status="accepted"
        ).filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related("sender", "receiver", "sender__profile", "receiver__profile")

        friends = []
        for f in friendships:
            friend_user = f.receiver if f.sender_id == user.id else f.sender
            prof = Profile.objects.get(user=friend_user)
            friends.append({
                "friendship_id": f.id,
                "id": friend_user.id,
                "username": friend_user.username,
                "nickname": prof.nickname,
                "bio": prof.bio,
                "avatar": prof.get_avatar_url(request),
                "is_online": prof.is_online,
                "last_seen": prof.last_seen.isoformat() if prof.last_seen else None,
                "since": f.updated_at.isoformat(),
            })

        return Response(friends, status=status.HTTP_200_OK)


class FriendRequestsView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def get(self, request):
        user = request.user

        # Requests received by current user
        received_requests = Friendship.objects.filter(
            receiver=user,
            status="pending",
        ).select_related("sender", "sender__profile")

        # Requests sent by current user
        sent_requests = Friendship.objects.filter(
            sender=user,
            status="pending",
        ).select_related("receiver", "receiver__profile")

        received_data = []
        for r in received_requests:
            sender_prof = Profile.objects.get(user=r.sender)
            received_data.append({
                "id": r.id,
                "user": {
                    "id": r.sender.id,
                    "username": r.sender.username,
                    "nickname": sender_prof.nickname,
                    "avatar": sender_prof.get_avatar_url(request),
                    "is_online": sender_prof.is_online,
                },
                "created_at": r.created_at.isoformat(),
            })

        sent_data = []
        for s in sent_requests:
            receiver_prof = Profile.objects.get(user=s.receiver)
            sent_data.append({
                "id": s.id,
                "user": {
                    "id": s.receiver.id,
                    "username": s.receiver.username,
                    "nickname": receiver_prof.nickname,
                    "avatar": receiver_prof.get_avatar_url(request),
                    "is_online": receiver_prof.is_online,
                },
                "created_at": s.created_at.isoformat(),
            })

        return Response(
            {
                "received": received_data,
                "sent": sent_data,
            },
            status=status.HTTP_200_OK,
        )


class FriendRequestSendView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def post(self, request, user_id):
        if request.user.id == user_id:
            return Response(
                {"error": "Você não pode enviar solicitação de amizade para você mesmo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        first = min(int(request.user.id), int(target_user.id))
        second = max(int(request.user.id), int(target_user.id))
        pair_key = f"{first}_{second}"

        with transaction.atomic():
            friendship, created = Friendship.objects.get_or_create(
                pair_key=pair_key,
                defaults={
                    "sender": request.user,
                    "receiver": target_user,
                    "status": "pending",
                },
            )

            if created:
                # Notify the target user in real time.
                sender_prof = Profile.objects.get(user=request.user)
                notify_user_channel(
                    target_user.id,
                    "friend_request_received",
                    {
                        "request_id": friendship.id,
                        "sender": {
                            "id": request.user.id,
                            "username": request.user.username,
                            "nickname": sender_prof.nickname,
                            "avatar": sender_prof.get_avatar_url(request),
                        },
                    },
                )
                return Response(
                    {
                        "message": "Solicitação de amizade enviada com sucesso",
                        "status": "pending",
                        "friendship_id": friendship.id,
                    },
                    status=status.HTTP_201_CREATED,
                )

            # Existing row for this pair.
            if friendship.status == "accepted":
                return Response(
                    {"error": "Vocês já são amigos"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if friendship.receiver_id == request.user.id and friendship.status == "pending":
                # The other user had sent a request earlier -> mutual auto-accept.
                friendship.status = "accepted"
                friendship.save(update_fields=["status"])

                notify_user_channel(
                    friendship.sender_id,
                    "friend_accepted",
                    {
                        "friendship_id": friendship.id,
                        "user_id": request.user.id,
                        "username": request.user.username,
                    },
                )
                return Response(
                    {
                        "message": "Solicitação mútua aceita automaticamente!",
                        "status": "accepted",
                        "friendship_id": friendship.id,
                    },
                    status=status.HTTP_200_OK,
                )

            if friendship.sender_id == request.user.id and friendship.status == "pending":
                return Response(
                    {"error": "Solicitação de amizade já enviada"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Defensive: rejected rows should not exist (FriendRespondView
            # deletes on reject), but if one appears, repurpose it as pending
            # with the correct direction instead of the old swap logic.
            if friendship.status == "rejected":
                friendship.sender = request.user
                friendship.receiver = target_user
                friendship.status = "pending"
                friendship.save(update_fields=["sender", "receiver", "status"])

                sender_prof = Profile.objects.get(user=request.user)
                notify_user_channel(
                    target_user.id,
                    "friend_request_received",
                    {
                        "request_id": friendship.id,
                        "sender": {
                            "id": request.user.id,
                            "username": request.user.username,
                            "nickname": sender_prof.nickname,
                            "avatar": sender_prof.get_avatar_url(request),
                        },
                    },
                )
                return Response(
                    {
                        "message": "Solicitação de amizade enviada com sucesso",
                        "status": "pending",
                        "friendship_id": friendship.id,
                    },
                    status=status.HTTP_201_CREATED,
                )

            # Fallback (shouldn't be reached): create a fresh request.
            Friendship.objects.filter(pk=friendship.pk).delete()
            friendship = Friendship.objects.create(
                sender=request.user,
                receiver=target_user,
                status="pending",
            )
            sender_prof = Profile.objects.get(user=request.user)
            notify_user_channel(
                target_user.id,
                "friend_request_received",
                {
                    "request_id": friendship.id,
                    "sender": {
                        "id": request.user.id,
                        "username": request.user.username,
                        "nickname": sender_prof.nickname,
                        "avatar": sender_prof.get_avatar_url(request),
                    },
                },
            )
            return Response(
                {
                    "message": "Solicitação de amizade enviada com sucesso",
                    "status": "pending",
                    "friendship_id": friendship.id,
                },
                status=status.HTTP_201_CREATED,
            )


class FriendRespondView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def post(self, request, request_id):
        action = (request.data.get("action") or "").lower().strip()
        if action not in ["accept", "reject"]:
            return Response(
                {"error": "Ação inválida. Use 'accept' ou 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            friendship = Friendship.objects.get(
                id=request_id,
                receiver=request.user,
                status="pending",
            )
        except Friendship.DoesNotExist:
            return Response(
                {"error": "Solicitação não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if action == "accept":
            friendship.status = "accepted"
            friendship.save()

            # Real-time notify sender
            notify_user_channel(
                friendship.sender.id,
                "friend_accepted",
                {
                    "friendship_id": friendship.id,
                    "user_id": request.user.id,
                    "username": request.user.username,
                },
            )

            return Response(
                {
                    "message": "Solicitação de amizade aceita",
                    "status": "accepted",
                },
                status=status.HTTP_200_OK,
            )
        else:
            friendship.delete()
            return Response(
                {"message": "Solicitação de amizade recusada"},
                status=status.HTTP_200_OK,
            )


class FriendDeleteView(APIView):
    authentication_classes = AUTH_AUTHENTICATION
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user_light"

    def delete(self, request, friend_id):
        friendship = Friendship.objects.filter(
            status="accepted"
        ).filter(
            (Q(sender=request.user) & Q(receiver_id=friend_id))
            | (Q(sender_id=friend_id) & Q(receiver=request.user))
        ).first()

        if not friendship:
            return Response(
                {"error": "Amizade não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        friendship.delete()

        # Real-time notify other user
        notify_user_channel(
            friend_id,
            "friend_removed",
            {"user_id": request.user.id},
        )

        return Response(
            {"message": "Amizade desfeita com sucesso"},
            status=status.HTTP_200_OK,
        )

