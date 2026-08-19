
# Create your models here.
from django.conf import settings
from django.db import models


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