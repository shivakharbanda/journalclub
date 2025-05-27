from rest_framework import serializers
from .models import Episode, Tag, Topic


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name', 'slug', 'description', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']

class EpisodeSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    topics = TopicSerializer(many=True, read_only=True)

    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, write_only=True, source='tags'
    )
    topic_ids = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), many=True, write_only=True, source='topics'
    )

    class Meta:
        model = Episode
        fields = [
            'id', 'title', 'slug', 'summary_text', 'description',
            'sources', 'audio_file', 'image', 'created_at',
            'tags', 'tag_ids',
            'topics', 'topic_ids'  # <-- these were probably missing
        ]
        read_only_fields = ['id', 'slug', 'created_at']
