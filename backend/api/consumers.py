import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q
from django.utils import timezone

from .models import Profile, Friendship, STALE_AFTER_SECONDS

logger = logging.getLogger(__name__)


def _friend_ids_of(user):
    """Canonical friend ids (the other party of each accepted friendship)."""
    friendships = Friendship.objects.filter(
        status="accepted"
    ).filter(
        Q(sender=user) | Q(receiver=user)
    )
    friend_ids = []
    for f in friendships:
        friend_ids.append(f.receiver_id if f.sender_id == user.id else f.sender_id)
    return friend_ids


@database_sync_to_async
def set_user_presence(user, is_online):
    try:
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.is_online = is_online
        profile.last_seen = timezone.now()
        profile.save(update_fields=["is_online", "last_seen"])
    except Exception:
        logger.exception("set_user_presence failed")


@database_sync_to_async
def touch_user_last_seen(user):
    """Mark the user as alive (heartbeat) without forcing the online flag."""
    try:
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.last_seen = timezone.now()
        profile.save(update_fields=["last_seen"])
    except Exception:
        logger.exception("touch_user_last_seen failed")


@database_sync_to_async
def get_user_friend_ids(user):
    try:
        return _friend_ids_of(user)
    except Exception:
        logger.exception("get_user_friend_ids failed")
        return []


@database_sync_to_async
def get_stale_online_friend_ids(user):
    """
    Reconcile staleness for the user's friends and return the ids that just
    went offline (is_online was True but the heartbeat window has passed).
    This is the fallback that guarantees friends are shown offline even if a
    WebSocket disconnect was never delivered.
    """
    try:
        old_enough = timezone.now() - timezone.timedelta(seconds=STALE_AFTER_SECONDS)

        friends = Friendship.objects.filter(
            status="accepted"
        ).filter(
            Q(sender=user) | Q(receiver=user)
        )

        # Collect the profiles of accepted friends that claim to be online.
        profile_ids_by_user = {}
        friend_user_ids = []
        for f in friends:
            fid = f.receiver_id if f.sender_id == user.id else f.sender_id
            friend_user_ids.append(fid)

        online = Profile.objects.filter(
            user_id__in=friend_user_ids,
            is_online=True,
        )

        stale_ids = []
        fresh_ids = []
        for p in online:
            if p.last_seen is None or p.last_seen < old_enough:
                stale_ids.append(p.user_id)
            else:
                fresh_ids.append(p.user_id)

        if stale_ids:
            # Persist the reconciliation so REST endpoints see it too.
            Profile.objects.filter(
                user_id__in=stale_ids,
                is_online=True,
            ).update(is_online=False)

        return stale_ids, fresh_ids
    except Exception:
        logger.exception("get_stale_online_friend_ids failed")
        return [], []


@database_sync_to_async
def get_online_friend_ids(user):
    """Ids of friends that are currently online (within the stale window)."""
    try:
        old_enough = timezone.now() - timezone.timedelta(seconds=STALE_AFTER_SECONDS)
        friend_user_ids = _friend_ids_of(user)
        online = Profile.objects.filter(
            user_id__in=friend_user_ids,
            is_online=True,
            last_seen__gte=old_enough,
        ).values_list("user_id", flat=True)
        return list(online)
    except Exception:
        logger.exception("get_online_friend_ids failed")
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


async def _safe_group_send(channel_layer, group, message):
    """
    Deliver a presence update to a single user group without letting a
    transient Redis timeout kill the whole connect/disconnect handler.
    """
    try:
        await channel_layer.group_send(group, message)
    except Exception:
        logger.warning("group_send to %s failed (redis timeout?)", group)


class PresenceConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        self.user_group_name = f"user_{self.user.id}"

        # Join individual user group
        try:
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name,
            )
        except Exception:
            logger.exception("group_add failed")

        await self.accept()

        # Update DB presence and heartbeat time.
        await set_user_presence(self.user, True)

        try:
            # Reconcile any friends whose heartbeat window lapsed, then notify.
            stale_ids, _fresh = await get_stale_online_friend_ids(self.user)

            friend_ids = await get_user_friend_ids(self.user)
            nickname = await get_user_profile_nickname(self.user)

            status_by_friend = {}
            for friend_id in friend_ids:
                status_by_friend[friend_id] = "offline" if friend_id in stale_ids else "online"

            for friend_id, status in status_by_friend.items():
                await _safe_group_send(
                    self.channel_layer,
                    f"user_{friend_id}",
                    {
                        "type": "friend_presence_update",
                        "user_id": self.user.id,
                        "username": self.user.username,
                        "nickname": nickname,
                        "status": status,
                    },
                )
        except Exception:
            logger.exception("presence notify on connect failed")

        # Send initial list of friends currently online.
        try:
            online_friends = await get_online_friend_ids(self.user)
            await self.send_json({
                "type": "initial_presence",
                "online_friend_ids": online_friends,
            })
        except Exception:
            logger.exception("send initial_presence failed")

    async def disconnect(self, close_code):
        if hasattr(self, "user") and self.user and not self.user.is_anonymous:
            # Always persist offline in the DB first (best effort).
            await set_user_presence(self.user, False)

            # Notify all friends that this user went offline, resilient to a
            # transient Redis timeout on any individual send.
            try:
                friend_ids = await get_user_friend_ids(self.user)
                nickname = await get_user_profile_nickname(self.user)
                for friend_id in friend_ids:
                    await _safe_group_send(
                        self.channel_layer,
                        f"user_{friend_id}",
                        {
                            "type": "friend_presence_update",
                            "user_id": self.user.id,
                            "username": self.user.username,
                            "nickname": nickname,
                            "status": "offline",
                        },
                    )
            except Exception:
                logger.exception("presence notify on disconnect failed")

            # Leave group
            try:
                await self.channel_layer.group_discard(
                    self.user_group_name,
                    self.channel_name,
                )
            except Exception:
                logger.exception("group_discard failed")

    async def receive_json(self, content):
        msg_type = content.get("type")

        if msg_type == "ping":
            # Heartbeat: refresh last_seen so a stale-window reconciliation
            # keeps this user online. Also reconcile friends opportunistically.
            await touch_user_last_seen(self.user)
            try:
                stale_ids, _ = await get_stale_online_friend_ids(self.user)
                nickname = await get_user_profile_nickname(self.user)
                for friend_id in stale_ids:
                    await _safe_group_send(
                        self.channel_layer,
                        f"user_{friend_id}",
                        {
                            "type": "friend_presence_update",
                            "user_id": self.user.id,
                            "username": self.user.username,
                            "nickname": nickname,
                            "status": "offline",
                        },
                    )
            except Exception:
                logger.exception("reconcile on ping failed")
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
