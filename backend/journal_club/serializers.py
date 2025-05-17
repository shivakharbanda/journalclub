from rest_framework import serializers
from .models import Episode

class EpisodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Episode
        fields = ['id', 'title', 'slug', 'summary_text', 'description', 'sources', 'audio_file', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']
