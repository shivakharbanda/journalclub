from .models import Episode, Tag, Topic
from .serializers import EpisodeSerializer, TagSerializer, TopicSerializer

from rest_framework import generics, status, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied


from django.shortcuts import get_object_or_404
from django.utils.text import slugify


import logging
logger = logging.getLogger('journal_club')

@api_view(['GET'])
def ping(request):
    return Response({"message": "pong"})

class SuperUserCreateMixin:
    def perform_create(self, serializer):
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can create this.")
        serializer.save()


class TagListCreateView(SuperUserCreateMixin, generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'


class TopicListCreateView(SuperUserCreateMixin, generics.ListCreateAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'


class EpisodeTagManageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can modify tags.")
        
        episode = get_object_or_404(Episode, slug=slug)
        tag_names = request.data.get('tags', [])

        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name, defaults={'slug': slugify(name)})
            tags.append(tag)

        episode.tags.set(tags)
        return Response({"message": "Tags updated successfully."})

    def delete(self, request, slug):
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can remove tags.")
        
        episode = get_object_or_404(Episode, slug=slug)
        episode.tags.clear()
        return Response({"message": "All tags removed."})

class EpisodeListCreateView(generics.ListCreateAPIView):
    serializer_class = EpisodeSerializer
    queryset = Episode.objects.all().order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can create episodes.")
        serializer.save()

    def get_queryset(self):
        queryset = Episode.objects.all().order_by('-created_at')
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(title__icontains=q)
        return queryset

class EpisodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Episode.objects.all()
    serializer_class = EpisodeSerializer
    lookup_field = 'slug'
    permission_classes = []

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


# Add this for full Tag CRUD
class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'