from django.contrib.contenttypes.models import ContentType
from users.models import GuestUser
from journal_club.models import ListeningHistory

def transfer_guest_data_to_user(user, guest_id):
    try:
        guest_user = GuestUser.objects.get(device_id=guest_id)
    except GuestUser.DoesNotExist:
        return

    guest_ct = ContentType.objects.get_for_model(GuestUser)
    user_ct = ContentType.objects.get_for_model(user.__class__)

    # Reassign all listening history from guest to user
    ListeningHistory.objects.filter(
        content_type=guest_ct,
        object_id=guest_user.id
    ).update(
        content_type=user_ct,
        object_id=user.id
    )

    # Optional: Link the guest user to the real user (for audit/debug)
    guest_user.linked_user = user
    guest_user.save()
