from django.contrib.contenttypes.models import ContentType
from users.models import GuestUser
from journal_club.models import ListeningHistory, LikeDislike, SavedEpisode

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
        episode = action.episode
        guest_action = action.action
        guest_time = action.created_at

        existing = LikeDislike.objects.filter(
            content_type=user_ct,
            object_id=user.id,
            episode=episode
        ).first()

        if not existing:
            LikeDislike.objects.create(
                content_type=user_ct,
                object_id=user.id,
                episode=episode,
                action=guest_action
            )
            if guest_action == "like":
                episode.likes_count += 1
            elif guest_action == "dislike":
                episode.dislikes_count += 1
            episode.save(update_fields=["likes_count", "dislikes_count"])
        else:
            if guest_time > existing.created_at and existing.action != guest_action:
                # Adjust episode counts for overwrite
                if existing.action == "like":
                    episode.likes_count = max(0, episode.likes_count - 1)
                elif existing.action == "dislike":
                    episode.dislikes_count = max(0, episode.dislikes_count - 1)

                if guest_action == "like":
                    episode.likes_count += 1
                elif guest_action == "dislike":
                    episode.dislikes_count += 1

                episode.save(update_fields=["likes_count", "dislikes_count"])

                existing.action = guest_action
                existing.created_at = guest_time
                existing.save(update_fields=["action", "created_at"])

    # Transfer Saved Episodes
    guest_saves = SavedEpisode.objects.filter(
        content_type=guest_ct,
        object_id=guest.id
    )

    for save in guest_saves:
        SavedEpisode.objects.get_or_create(
            content_type=user_ct,
            object_id=user.id,
            saved_content_type=save.saved_content_type,
            saved_object_id=save.saved_object_id
        )


    # TODO: Replace manual count adjustments with a background job or cron
    # that recalculates like/dislike counts from LikeDislike model for consistency

    # Optional: cleanup guest data
    guest.delete()

