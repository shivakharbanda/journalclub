from rest_framework import generics
from .models import Episode
from .serializers import EpisodeSerializer

from rest_framework.permissions import IsAuthenticated


from django.shortcuts import render, get_object_or_404

class EpisodeListCreateView(generics.ListCreateAPIView):
    queryset = Episode.objects.all().order_by('-created_at')
    serializer_class = EpisodeSerializer
    permission_classes = [IsAuthenticated]

class EpisodeDetailView(generics.RetrieveUpdateAPIView):
    queryset = Episode.objects.all()
    serializer_class = EpisodeSerializer
    lookup_field = 'slug'
    permission_classes = [IsAuthenticated]


def episode_detail_view(request, slug):
    episode = get_object_or_404(Episode, slug=slug)
    return render(request, 'journal_club/episode_detail.html', {'episode': episode})


def episode_list_view(request):
    q = request.GET.get("q")
    episodes = Episode.objects.all()
    if q:
        episodes = episodes.filter(title__icontains=q)
    episodes = episodes.order_by("-created_at")
    return render(request, "journal_club/episode_list.html", {"episodes": episodes})
