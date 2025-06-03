from django.db.models import Count, Q
from journal_club.models import Episode, LikeDislike



def refresh_like_dislike_counts():
    episodes = Episode.objects.all()

    for episode in episodes:
        like_count = LikeDislike.objects.filter(episode=episode, action='like').count()
        dislike_count = LikeDislike.objects.filter(episode=episode, action='dislike').count()

        episode.likes_count = like_count
        episode.dislikes_count = dislike_count
        episode.save(update_fields=['likes_count', 'dislikes_count'])



def cdn_or_absolute(request, filefield, cdn_base):
    if not filefield:
        return None
    if cdn_base:
        return f"{cdn_base.rstrip('/')}/{filefield.name}"
    return request.build_absolute_uri(filefield.url)