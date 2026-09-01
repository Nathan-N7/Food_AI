from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile, Friendship, Message


User = get_user_model()


def get_profile_data(user, request=None):
    """Helper to serialize user profile data."""
    profile, _ = UserProfile.objects.get_or_create(user=user)

    avatar_url = None
    if profile.avatar and request:
        avatar_url = request.build_absolute_uri(
            profile.avatar.url
        )

    is_actually_online = profile.is_online and (timezone.now() - profile.last_seen < timedelta(minutes=2))
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "display_name": profile.display_name or user.username,
        "bio": profile.bio,
        "avatar": avatar_url,
        "is_online": is_actually_online,
        "last_seen": profile.last_seen.isoformat(),
    }


# ─── PROFILE VIEWS ───────────────────────────────────────

class MyProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """Get current user's profile."""
        profile, _ = UserProfile.objects.get_or_create(
            user=request.user
        )
        profile.is_online = True
        profile.last_seen = timezone.now()
        profile.save()

        return Response(
            get_profile_data(request.user, request),
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        """Update current user's profile."""
        profile, _ = UserProfile.objects.get_or_create(
            user=request.user
        )

        display_name = request.data.get("display_name")
        bio = request.data.get("bio")
        avatar = request.FILES.get("avatar")

        if display_name is not None:
            profile.display_name = display_name[:100]

        if bio is not None:
            profile.bio = bio[:500]

        if avatar is not None:
            if profile.avatar:
                profile.avatar.delete(save=False)
            profile.avatar = avatar

        profile.save()

        return Response(
            get_profile_data(request.user, request),
            status=status.HTTP_200_OK,
        )


class UserProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get another user's profile."""
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = get_profile_data(user, request)

        friendship = Friendship.objects.filter(
            Q(from_user=request.user, to_user=user)
            | Q(from_user=user, to_user=request.user)
        ).first()

        data["friendship_status"] = (
            friendship.status if friendship else None
        )
        data["friendship_id"] = (
            friendship.id if friendship else None
        )

        return Response(data, status=status.HTTP_200_OK)


# ─── USER SEARCH ──────────────────────────────────────────

class UserSearchView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Search users by username."""
        query = request.query_params.get("q", "").strip()

        if len(query) < 2:
            return Response(
                {"error": "Mínimo 2 caracteres para busca"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        users = (
            User.objects
            .filter(username__icontains=query)
            .exclude(id=request.user.id)
            [:20]
        )

        results = []
        for user in users:
            data = get_profile_data(user, request)

            friendship = Friendship.objects.filter(
                Q(from_user=request.user, to_user=user)
                | Q(from_user=user, to_user=request.user)
            ).first()

            data["friendship_status"] = (
                friendship.status if friendship else None
            )
            data["friendship_id"] = (
                friendship.id if friendship else None
            )

            results.append(data)

        return Response(results, status=status.HTTP_200_OK)


# ─── FRIENDS VIEWS ────────────────────────────────────────

class FriendsListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all accepted friends."""
        friendships = Friendship.objects.filter(
            Q(from_user=request.user) | Q(to_user=request.user),
            status="accepted",
        )

        friends = []
        for f in friendships:
            friend_user = (
                f.to_user
                if f.from_user == request.user
                else f.from_user
            )
            data = get_profile_data(friend_user, request)
            data["friendship_id"] = f.id
            friends.append(data)

        return Response(friends, status=status.HTTP_200_OK)


class FriendRequestSendView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Send a friend request."""
        to_user_id = request.data.get("to_user_id")

        if not to_user_id:
            return Response(
                {"error": "to_user_id é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            to_user = User.objects.get(pk=to_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if to_user == request.user:
            return Response(
                {"error": "Não pode adicionar a si mesmo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = Friendship.objects.filter(
            Q(from_user=request.user, to_user=to_user)
            | Q(from_user=to_user, to_user=request.user)
        ).first()

        if existing:
            if existing.status == "accepted":
                return Response(
                    {"error": "Vocês já são amigos"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if existing.status == "pending":
                if existing.from_user == to_user:
                    existing.status = "accepted"
                    existing.save()
                    return Response(
                        {
                            "message": "Amizade aceita automaticamente",
                            "friendship_id": existing.id,
                            "status": "accepted",
                        },
                        status=status.HTTP_200_OK,
                    )
                return Response(
                    {"error": "Pedido já enviado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if existing.status == "rejected":
                existing.status = "pending"
                existing.from_user = request.user
                existing.to_user = to_user
                existing.save()
                return Response(
                    {
                        "message": "Pedido de amizade reenviado",
                        "friendship_id": existing.id,
                        "status": "pending",
                    },
                    status=status.HTTP_201_CREATED,
                )

        friendship = Friendship.objects.create(
            from_user=request.user,
            to_user=to_user,
            status="pending",
        )

        return Response(
            {
                "message": "Pedido de amizade enviado",
                "friendship_id": friendship.id,
                "status": "pending",
            },
            status=status.HTTP_201_CREATED,
        )


class FriendRequestsListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List pending friend requests received."""
        requests_received = Friendship.objects.filter(
            to_user=request.user,
            status="pending",
        )

        results = []
        for f in requests_received:
            data = get_profile_data(f.from_user, request)
            data["friendship_id"] = f.id
            data["requested_at"] = f.created_at.isoformat()
            results.append(data)

        return Response(results, status=status.HTTP_200_OK)


class FriendRequestAcceptView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id):
        """Accept a friend request."""
        try:
            friendship = Friendship.objects.get(
                pk=friendship_id,
                to_user=request.user,
                status="pending",
            )
        except Friendship.DoesNotExist:
            return Response(
                {"error": "Pedido não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        friendship.status = "accepted"
        friendship.save()

        return Response(
            {
                "message": "Amizade aceita",
                "friendship_id": friendship.id,
                "status": "accepted",
            },
            status=status.HTTP_200_OK,
        )


class FriendRequestRejectView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id):
        """Reject a friend request."""
        try:
            friendship = Friendship.objects.get(
                pk=friendship_id,
                to_user=request.user,
                status="pending",
            )
        except Friendship.DoesNotExist:
            return Response(
                {"error": "Pedido não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        friendship.status = "rejected"
        friendship.save()

        return Response(
            {
                "message": "Pedido rejeitado",
                "friendship_id": friendship.id,
                "status": "rejected",
            },
            status=status.HTTP_200_OK,
        )


class FriendRemoveView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, friendship_id):
        """Remove a friendship."""
        try:
            friendship = Friendship.objects.get(
                pk=friendship_id,
            )
        except Friendship.DoesNotExist:
            return Response(
                {"error": "Amizade não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            friendship.from_user != request.user
            and friendship.to_user != request.user
        ):
            return Response(
                {"error": "Sem permissão"},
                status=status.HTTP_403_FORBIDDEN,
            )

        friendship.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )


# ─── MESSAGE VIEWS ────────────────────────────────────────

class ConversationsListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all conversations with last message."""
        me = request.user

        sent_to = (
            Message.objects
            .filter(sender=me)
            .values_list("receiver_id", flat=True)
            .distinct()
        )
        received_from = (
            Message.objects
            .filter(receiver=me)
            .values_list("sender_id", flat=True)
            .distinct()
        )

        partner_ids = set(sent_to) | set(received_from)

        conversations = []
        for pid in partner_ids:
            partner = User.objects.get(pk=pid)

            last_msg = (
                Message.objects
                .filter(
                    Q(sender=me, receiver=partner)
                    | Q(sender=partner, receiver=me)
                )
                .order_by("-created_at")
                .first()
            )

            unread_count = Message.objects.filter(
                sender=partner,
                receiver=me,
                is_read=False,
            ).count()

            data = get_profile_data(partner, request)
            data["last_message"] = {
                "content": last_msg.content if last_msg else "",
                "created_at": (
                    last_msg.created_at.isoformat()
                    if last_msg else ""
                ),
                "is_mine": (
                    last_msg.sender == me if last_msg else False
                ),
            }
            data["unread_count"] = unread_count

            conversations.append(data)

        conversations.sort(
            key=lambda c: c["last_message"]["created_at"],
            reverse=True,
        )

        return Response(conversations, status=status.HTTP_200_OK)


class MessagesView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get message history with a user."""
        try:
            other_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        messages = Message.objects.filter(
            Q(sender=request.user, receiver=other_user)
            | Q(sender=other_user, receiver=request.user)
        ).order_by("created_at")[:100]

        data = []
        for msg in messages:
            data.append({
                "id": msg.id,
                "sender_id": msg.sender.id,
                "receiver_id": msg.receiver.id,
                "content": msg.content,
                "is_read": msg.is_read,
                "is_mine": msg.sender == request.user,
                "created_at": msg.created_at.isoformat(),
            })

        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, user_id):
        """Send a message to a user."""
        content = (
            request.data.get("content", "").strip()
        )

        if not content:
            return Response(
                {"error": "Mensagem não pode ser vazia"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(content) > 2000:
            return Response(
                {"error": "Mensagem muito longa (max 2000)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            receiver = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if receiver == request.user:
            return Response(
                {"error": "Não pode enviar mensagem para si mesmo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_friend = Friendship.objects.filter(
            Q(from_user=request.user, to_user=receiver)
            | Q(from_user=receiver, to_user=request.user),
            status="accepted",
        ).exists()

        if not is_friend:
            return Response(
                {"error": "Vocês precisam ser amigos para trocar mensagens"},
                status=status.HTTP_403_FORBIDDEN,
            )

        msg = Message.objects.create(
            sender=request.user,
            receiver=receiver,
            content=content,
        )

        return Response(
            {
                "id": msg.id,
                "sender_id": msg.sender.id,
                "receiver_id": msg.receiver.id,
                "content": msg.content,
                "is_read": msg.is_read,
                "is_mine": True,
                "created_at": msg.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class MarkMessagesReadView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        """Mark all messages from a user as read."""
        try:
            other_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        updated = Message.objects.filter(
            sender=other_user,
            receiver=request.user,
            is_read=False,
        ).update(is_read=True)

        return Response(
            {"marked_read": updated},
            status=status.HTTP_200_OK,
        )
