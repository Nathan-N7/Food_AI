from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("api", "0004_profile_forty_two_id")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="two_factor_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="profile",
            name="two_factor_secret",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.CreateModel(
            name="TwoFactorChallenge",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token_hash", models.CharField(max_length=64, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"indexes": [models.Index(fields=["token_hash", "used_at"], name="api_twofact_token_h_8d4a7c_idx")]},
        ),
    ]
