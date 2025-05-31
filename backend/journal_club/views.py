from .models import (
    Episode, Tag, 
    Topic, Comment, 
    ListeningHistory
)
from users.models import GuestUser

from .serializers import (
    EpisodeSerializer, TagSerializer, TopicSerializer, 
    CommentSerializer, CreateCommentSerializer,
    ContinueListeningEpisodeSerializer
)

from rest_framework import generics, status, viewsets, mixins
from rest_framework.generics import ListAPIView, GenericAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from django.contrib.contenttypes.models import ContentType

from django.shortcuts import get_object_or_404
from django.utils.text import slugify

from rest_framework.pagination import PageNumberPagination

from users.models import GuestUser
from django.utils import timezone

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


class CommentPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'


class CommentCreateListView(GenericAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = CreateCommentSerializer

    def get_flattened_reply_count(self, comment_id):
        """
        Get total count of all descendant replies (flattened count)
        """
        def count_all_descendants(comment_id):
            # Get direct children
            direct_children = Comment.objects.filter(parent_id=comment_id)
            total_count = direct_children.count()
            
            # Add counts from nested children
            for child in direct_children:
                total_count += count_all_descendants(child.id)
            
            return total_count
        
        return count_all_descendants(comment_id)

    def get(self, request):
        object_type = request.query_params.get('object_type')
        object_id = request.query_params.get('object_id')

        if not object_type or not object_id:
            return Response({"detail": "Missing object_type or object_id"}, status=400)

        try:
            content_type = ContentType.objects.get(model=object_type)
        except ContentType.DoesNotExist:
            return Response({"detail": "Invalid object_type"}, status=400)

        # Only get top-level comments (no parent)
        comments = Comment.objects.filter(
            content_type=content_type,
            object_id=object_id,
            parent__isnull=True
        ).select_related('user').order_by('-created_at')  # Most recent first

        paginated = CommentPagination()
        paginated_comments = paginated.paginate_queryset(comments, request)
        
        # Serialize with flattened reply counts
        serialized_comments = []
        for comment in paginated_comments:
            serialized_comment = CommentSerializer(comment).data
            # Override the replies_count with flattened count
            serialized_comment['replies_count'] = self.get_flattened_reply_count(comment.id)
            serialized_comments.append(serialized_comment)

        return paginated.get_paginated_response(serialized_comments)

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save()
            # Return the comment with user data included
            return Response(CommentSerializer(comment).data, status=201)
        return Response(serializer.errors, status=400)


class CommentRepliesView(ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = []

    def get_all_descendant_ids(self, parent_id):
        """
        Recursively get all descendant comment IDs for a given parent comment.
        This flattens the tree structure into a list.
        """
        descendants = []
        
        # Get direct children
        direct_children = Comment.objects.filter(parent_id=parent_id).values_list('id', flat=True)
        
        for child_id in direct_children:
            descendants.append(child_id)
            # Recursively get children of children
            descendants.extend(self.get_all_descendant_ids(child_id))
        
        return descendants

    def get_queryset(self):
        comment_id = self.kwargs['pk']
        
        # Get all descendant reply IDs (flattened)
        all_reply_ids = self.get_all_descendant_ids(comment_id)
        
        if not all_reply_ids:
            return Comment.objects.none()
        
        # Return all replies in chronological order (flat structure)
        return Comment.objects.filter(
            id__in=all_reply_ids
        ).select_related('user').order_by('created_at')



class SaveListeningProgressView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get('episode_slug')
        if not slug:
            return Response({"error": "episode_slug is required"}, status=400)

        episode = get_object_or_404(Episode, slug=slug)

        # Identify actor
        if request.user.is_authenticated:
            actor = request.user
        else:
            actor = getattr(request, 'guest_user', None)
            if not actor:
                return Response({"error": "guest_id not set"}, status=400)

        content_type = ContentType.objects.get_for_model(actor.__class__)

        try:
            history = ListeningHistory.objects.get(
                content_type=content_type,
                object_id=actor.id,
                episode=episode
            )
            return Response({
                "position_seconds": history.position_seconds,
                "completed": history.completed
            })
        except ListeningHistory.DoesNotExist:
            return Response({
                "position_seconds": 0,
                "completed": False
            })


    def post(self, request):
        slug = request.data.get('episode_slug')
        position = request.data.get('position_seconds', 0)
        duration = request.data.get('duration_seconds', 0)  # <-- NEW
        completed = request.data.get('completed', False)

        if not slug:
            return Response({"error": "episode_slug is required"}, status=400)

        episode = get_object_or_404(Episode, slug=slug)

        if request.user.is_authenticated:
            actor = request.user
        else:
            actor = getattr(request, 'guest_user', None)
            if not actor:
                return Response({"error": "guest_id not set"}, status=400)

        content_type = ContentType.objects.get_for_model(actor.__class__)

        ListeningHistory.objects.update_or_create(
            content_type=content_type,
            object_id=actor.id,
            episode=episode,
            defaults={
                'position_seconds': int(position),
                'duration_seconds': int(duration),  # <-- STORE IT
                'completed': completed,
                'updated_at': timezone.now()
            }
        )

        return Response({"message": "Progress saved"})

class ContinueListeningListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            actor = request.user
        else:
            actor = getattr(request, 'guest_user', None)
            if not actor:
                return Response({"error": "guest_id not set"}, status=400)

        content_type = ContentType.objects.get_for_model(actor.__class__)

        histories = (
            ListeningHistory.objects
            .filter(content_type=content_type, object_id=actor.id, completed=False)
            .select_related('episode')
            .order_by('-updated_at')[:10]
        )

        # Annotate episodes with progress
        episodes = []
        for h in histories:
            ep = h.episode
            ep.position_seconds = h.position_seconds
            ep.duration_seconds = getattr(h, 'duration_seconds', None) or 0  # attach duration
            ep.completed = h.completed
            episodes.append(ep)

        serializer = ContinueListeningEpisodeSerializer(
            episodes, many=True, context={'request': request}
        )
        return Response(serializer.data)