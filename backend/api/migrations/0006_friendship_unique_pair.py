# Add the unique constraint on Friendship.pair_key. This runs AFTER the data
# backfill migration (0005) so existing data is already deduplicated.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_friendship_pair_key_backfill"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="friendship",
            constraint=models.UniqueConstraint(
                fields=["pair_key"],
                name="unique_friendship_pair",
            ),
        ),
    ]
