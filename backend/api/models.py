from django.conf import settings
from django.db import models


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
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        unique_together = ("sender", "receiver")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Generation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="generations",
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