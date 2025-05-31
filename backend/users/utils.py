from django.contrib.contenttypes.models import ContentType
from users.models import GuestUser
from journal_club.models import ListeningHistory, LikeDislike

def transfer_guest_data_to_user(user, guest_id):
    try:
        guest = GuestUser.objects.get(device_id=guest_id)
    except GuestUser.DoesNotExist:
        return

    guest_ct = ContentType.objects.get_for_model(GuestUser)
    user_ct = ContentType.objects.get_for_model(user.__class__)

    # Transfer ListeningHistory
    guest_histories = ListeningHistory.objects.filter(
        content_type=guest_ct,
        object_id=guest.id
    )

    for history in guest_histories:
        # Prevent duplicate
        obj, created = ListeningHistory.objects.update_or_create(
            content_type=user_ct,
            object_id=user.id,
            episode=history.episode,
            defaults={
                'duration_seconds': history.duration_seconds,
                'position_seconds': history.position_seconds,
                'completed': history.completed,
            }
        )

    # Transfer Likes/Dislikes
    guest_actions = LikeDislike.objects.filter(
        content_type=guest_ct,
        object_id=guest.id
    )

    for action in guest_actions:
        LikeDislike.objects.update_or_create(
            content_type=user_ct,
            object_id=user.id,
            episode=action.episode,
            defaults={'action': action.action}
        )

    # Optional: cleanup guest data
    guest.delete()
