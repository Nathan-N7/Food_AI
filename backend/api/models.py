from django.conf import settings
from django.db import models
from django.utils import timezone

# A user is considered effectively "online" only while their last heartbeat
# (WebSocket connect/ping) happened within this window. This decouples the
# displayed status from the unreliable WebSocket disconnect event, so a user
# automatically appears offline shortly after closing a tab even if the
# backend never received a clean disconnect for them.
STALE_AFTER_SECONDS = 60


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    nickname = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )
    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
    )
    bio = models.TextField(
        max_length=300,
        blank=True,
        default="",
    )
    is_online = models.BooleanField(
        default=False,
    )
    last_seen = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Profile of {self.user.username} ({self.nickname})"

    def get_avatar_url(self, request=None):
        if self.avatar and hasattr(self.avatar, "url"):
            if request:
                return request.build_absolute_uri(self.avatar.url)
            return self.avatar.url
        return None

    def is_online_effective(self):
        """True only if flagged online AND the heartbeat window is fresh."""
        if not self.is_online:
            return False
        if self.last_seen is None:
            return False
        cutoff = timezone.now() - timezone.timedelta(seconds=STALE_AFTER_SECONDS)
        return self.last_seen >= cutoff


class Friendship(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_friend_requests",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_friend_requests",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    # Canonical, direction-agnostic key (min_userid_max_userid) backing a
    # unique constraint so two users can never have more than one friendship,
    # regardless of who is sender/receiver.
    pair_key = models.CharField(
        max_length=40,
        db_index=True,
        blank=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        unique_together = ("sender", "receiver")
        constraints = [
            models.UniqueConstraint(
                fields=["pair_key"],
                name="unique_friendship_pair",
            )
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.sender_id and self.receiver_id:
            first = min(int(self.sender_id), int(self.receiver_id))
            second = max(int(self.sender_id), int(self.receiver_id))
            self.pair_key = f"{first}_{second}"
        # E quando chamado com update_fields, garante que pair_key seja persistido.
        update_fields = kwargs.get("update_fields")
        if self.pair_key and update_fields is not None and "pair_key" not in update_fields:
            kwargs["update_fields"] = {"pair_key"}.union(update_fields)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Generation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="generations",
    )
    # Durably links a LangGraph thread (used for regeneration) to its owner.
    thread_id = models.CharField(
        max_length=40,
        blank=True,
        default="",
        db_index=True,
    )
    original_image = models.ImageField(
        upload_to="generations/originals/"
    )
    generated_image = models.URLField(
        max_length=1000,
        blank=True,
    )
    prompt = models.JSONField(
        default=dict,
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        default="pending",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"Generation {self.id} - {self.user.username}"