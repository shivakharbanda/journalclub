from rest_framework import serializers
from .models import Episode, Tag, Topic, Comment
from django.contrib.contenttypes.models import ContentType

from django.contrib.auth import get_user_model

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


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data in comments"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at', 'parent', 'replies_count']
        
    def get_replies_count(self, obj):
        return obj.replies.count()


class CreateCommentSerializer(serializers.ModelSerializer):
    object_type = serializers.CharField()
    object_id = serializers.IntegerField()
    parent = serializers.IntegerField(required=False, allow_null=True)  # Changed from parent_id to parent

    class Meta:
        model = Comment
        fields = ['content', 'object_type', 'object_id', 'parent']

    def create(self, validated_data):
        user = self.context['request'].user
        model = validated_data.pop('object_type')
        object_id = validated_data.pop('object_id')
        parent_id = validated_data.pop('parent', None)

        try:
            content_type = ContentType.objects.get(model=model)
            content_object = content_type.get_object_for_this_type(id=object_id)
        except ContentType.DoesNotExist:
            raise serializers.ValidationError("Invalid content type")
        except content_type.model_class().DoesNotExist:
            raise serializers.ValidationError("Target object does not exist")

        parent_comment = None
        if parent_id:
            try:
                parent_comment = Comment.objects.get(id=parent_id)
            except Comment.DoesNotExist:
                raise serializers.ValidationError("Parent comment does not exist")

        comment = Comment.objects.create(
            user=user,
            content=validated_data['content'],
            content_object=content_object,
            parent=parent_comment
        )
        return comment


class ContinueListeningEpisodeSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    topics = TopicSerializer(many=True, read_only=True)
    position_seconds = serializers.SerializerMethodField()
    completed = serializers.SerializerMethodField()
    audio_file = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    progress_percent = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Episode
        fields = [
            'id', 'title', 'slug', 'summary_text', 'description',
            'sources', 'audio_file', 'image', 'created_at',
            'tags', 'topics',
            'position_seconds', 'duration_seconds', 'completed', 'progress_percent',
        ]

    def get_position_seconds(self, obj):
        return getattr(obj, 'position_seconds', 0)

    def get_completed(self, obj):
        return getattr(obj, 'completed', False)

    def get_audio_file(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.audio_file.url) if obj.audio_file else None

    def get_image(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if obj.image else None
    
    def get_duration_seconds(self, obj):
        return getattr(obj, 'duration_seconds', 0)

    def get_progress_percent(self, obj):
        position = getattr(obj, 'position_seconds', 0)
        duration = getattr(obj, 'duration_seconds', 0)
        if duration > 0:
            return round((position / duration) * 100)
        return 0

