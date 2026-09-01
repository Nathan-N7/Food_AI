from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Profile, Friendship


@database_sync_to_async
def set_user_presence(user, is_online):
    try:
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.is_online = is_online
        profile.last_seen = timezone.now()
        profile.save(update_fields=["is_online", "last_seen"])
    except Exception:
        pass


@database_sync_to_async
def get_user_friend_ids(user):
    try:
        friendships = Friendship.objects.filter(
            status="accepted"
        ).filter(
            models_Q_helper(user)
        )
        friend_ids = []
        for f in friendships:
            if f.sender_id == user.id:
                friend_ids.append(f.receiver_id)
            else:
                friend_ids.append(f.sender_id)
        return friend_ids
    except Exception:
        return []


def models_Q_helper(user):
    from django.db.models import Q
    return Q(sender=user) | Q(receiver=user)


@database_sync_to_async
def get_online_friend_ids(user):
    try:
        friend_ids = []
        friendships = Friendship.objects.filter(
            status="accepted"
        ).filter(
            models_Q_helper(user)
        )
        for f in friendships:
            friend_id = f.receiver_id if f.sender_id == user.id else f.sender_id
            friend_ids.append(friend_id)

        online_profiles = Profile.objects.filter(
            user_id__in=friend_ids,
            is_online=True,
        ).values_list("user_id", flat=True)

        return list(online_profiles)
    except Exception:
        return []


@database_sync_to_async
def get_user_profile_nickname(user):
    """
    Fetch the user's profile nickname without doing a synchronous ORM
    lookup from an async context (avoids SynchronousOnlyOperation).
    """
    try:
        profile = Profile.objects.get(user=user)
        return profile.nickname or user.username
    except Profile.DoesNotExist:
        return user.username
    except Exception:
        return user.username


class PresenceConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        self.user_group_name = f"user_{self.user.id}"

        # Join individual user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name,
        )

        await self.accept()

        # Update DB presence
        await set_user_presence(self.user, True)

        # Notify all friends that this user came online
        friend_ids = await get_user_friend_ids(self.user)
        nickname = await get_user_profile_nickname(self.user)
        for friend_id in friend_ids:
            await self.channel_layer.group_send(
                f"user_{friend_id}",
                {
                    "type": "friend_presence_update",
                    "user_id": self.user.id,
                    "username": self.user.username,
                    "nickname": nickname,
                    "status": "online",
                },
            )

        # Send initial list of online friends to this user
        online_friends = await get_online_friend_ids(self.user)
        await self.send_json({
            "type": "initial_presence",
            "online_friend_ids": online_friends,
        })

    async def disconnect(self, close_code):
        if hasattr(self, "user") and self.user and not self.user.is_anonymous:
            # Update DB presence
            await set_user_presence(self.user, False)

            # Notify all friends that this user went offline
            friend_ids = await get_user_friend_ids(self.user)
            nickname = await get_user_profile_nickname(self.user)
            for friend_id in friend_ids:
                await self.channel_layer.group_send(
                    f"user_{friend_id}",
                    {
                        "type": "friend_presence_update",
                        "user_id": self.user.id,
                        "username": self.user.username,
                        "nickname": nickname,
                        "status": "offline",
                    },
                )

            # Leave group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name,
            )

    async def receive_json(self, content):
        msg_type = content.get("type")

        if msg_type == "ping":
            await self.send_json({"type": "pong"})
        elif msg_type == "get_online_friends":
            online_friends = await get_online_friend_ids(self.user)
            await self.send_json({
                "type": "online_friends_list",
                "online_friend_ids": online_friends,
            })

    async def friend_presence_update(self, event):
        """Handler for friend_presence_update events sent to user group"""
        await self.send_json({
            "type": "friend_presence",
            "user_id": event["user_id"],
            "username": event["username"],
            "nickname": event.get("nickname", ""),
            "status": event["status"],
        })

    async def friend_request_notification(self, event):
        """Handler for friend request alerts sent in real-time"""
        await self.send_json({
            "type": "friend_request_notification",
            "action": event.get("action"),
            "data": event.get("data", {}),
        })
