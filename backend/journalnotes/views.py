from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied

from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from journal_club.models import Episode

from .models import Note
from .serializers import NoteSerializer

class NoteListCreateView(APIView):
    permission_classes = [AllowAny]

    def get_actor(self, request):
        if request.user.is_authenticated:
            return request.user
        return getattr(request, 'guest_user', None)

    def get(self, request, slug):
        actor = self.get_actor(request)
        if not actor:
            return Response({"error": "guest_id not set"}, status=400)

        episode = get_object_or_404(Episode, slug=slug)
        ct = ContentType.objects.get_for_model(actor.__class__)

        notes = Note.objects.filter(
            episode=episode,
            content_type=ct,
            object_id=actor.id
        ).order_by('-updated_at')

        return Response(NoteSerializer(notes, many=True).data)

    def post(self, request, slug):
        actor = self.get_actor(request)
        if not actor:
            return Response({"error": "guest_id not set"}, status=400)

        episode = get_object_or_404(Episode, slug=slug)
        ct = ContentType.objects.get_for_model(actor.__class__)

        data = request.data.copy()
        data['episode'] = episode.id
        data['content_type'] = ct.id
        data['object_id'] = actor.id

        serializer = NoteSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class NoteDetailView(APIView):
    permission_classes = [AllowAny]

    def get_actor(self, request):
        if request.user.is_authenticated:
            return request.user
        return getattr(request, 'guest_user', None)

    def get_object(self, request, slug):
        actor = self.get_actor(request)
        ct = ContentType.objects.get_for_model(actor.__class__)
        return get_object_or_404(Note, slug=slug, content_type=ct, object_id=actor.id)

    def get(self, request, slug):
        note = self.get_object(request, slug)
        return Response(NoteSerializer(note).data)

    def put(self, request, slug):
        note = self.get_object(request, slug)
        serializer = NoteSerializer(note, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, slug):
        note = self.get_object(request, slug)
        note.delete()
        return Response(status=204)
