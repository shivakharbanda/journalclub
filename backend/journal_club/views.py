from rest_framework import generics
from .models import Episode
from .serializers import EpisodeSerializer

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view
from rest_framework.response import Response


from django.shortcuts import render, get_object_or_404

import logging
logger = logging.getLogger('journal_club')

@api_view(['GET'])
def ping(request):
    return Response({"message": "pong"})

class EpisodeListCreateView(generics.ListCreateAPIView):
    serializer_class = EpisodeSerializer
    queryset = Episode.objects.all().order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = Episode.objects.all().order_by('-created_at')
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(title__icontains=q)
        return queryset

class EpisodeDetailView(generics.RetrieveUpdateAPIView):
    queryset = Episode.objects.all()
    serializer_class = EpisodeSerializer
    lookup_field = 'slug'
    permission_classes = []


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



class EpisodeListAPIView(generics.ListAPIView):
    serializer_class = EpisodeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Episode.objects.all().order_by('-created_at')
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(title__icontains=q)
        return queryset
    

class EpisodeDetailAPIView(generics.RetrieveAPIView):
    serializer_class = EpisodeSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'
    queryset = Episode.objects.all()
