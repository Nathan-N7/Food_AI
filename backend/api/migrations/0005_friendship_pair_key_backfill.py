# Data migration: populate Friendship.pair_key on existing rows and remove
# non-canonical duplicates so the unique pair_key constraint can be added.
#
# MUST run before the AddConstraint operation (the constraint is added in a
# later migration) so migrating existing data cannot violate it.
from django.db import migrations


def _compute_pair_key(sender_id, receiver_id):
    first = min(int(sender_id), int(receiver_id))
    second = max(int(sender_id), int(receiver_id))
    return f"{first}_{second}"


# Accepted is the "strongest" status; then pending; rejected is weakest.
_STATUS_PRIORITY = {"accepted": 0, "pending": 1, "rejected": 2}


def backfill_pair_key_and_dedupe(apps, schema_editor):
    Friendship = apps.get_model("api", "Friendship")

    rows = list(Friendship.objects.all().order_by("pk"))

    groups = {}
    for row in rows:
        pair_key = _compute_pair_key(row.sender_id, row.receiver_id)
        row.pair_key = pair_key
        groups.setdefault(pair_key, []).append(row)

    survivors = []
    to_delete = []

    for pair_key, group in groups.items():
        # Deterministic survivor for every status combination:
        #  1. strongest status wins (accepted > pending > rejected)
        #  2. then lowest sender_id (canonical direction)
        #  3. then lowest pk as final tiebreaker
        def sort_key(row):
            return (
                _STATUS_PRIORITY.get(row.status, 3),
                int(row.sender_id),
                int(row.pk),
            )

        group.sort(key=sort_key)
        survivor = group[0]
        survivors.append(survivor)
        to_delete.extend(group[1:])

    # Persist pair_key on the survivors.
    for row in survivors:
        row.save()

    # Drop non-canonical duplicates.
    for row in to_delete:
        row.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_friendship_pair_key_generation_thread_id"),
    ]

    operations = [
        migrations.RunPython(
            backfill_pair_key_and_dedupe,
            migrations.RunPython.noop,
        ),
    ]
