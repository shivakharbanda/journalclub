from rest_framework import serializers
from .models import Episode, Tag, Topic, Comment, LikeDislike, SavedEpisode
from django.contrib.contenttypes.models import ContentType

from django.contrib.auth import get_user_model
from django.conf import settings


from .utils import cdn_or_absolute 

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

    audio_file = serializers.FileField()
    audio_url = serializers.SerializerMethodField()
    image = serializers.ImageField(allow_null=True, required=False)
    image_url = serializers.SerializerMethodField()

    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, write_only=True, source='tags'
    )
    topic_ids = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), many=True, write_only=True, source='topics'
    )


    user_action = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()  
    class Meta:
        model = Episode
        fields = [
            'id', 'title', 'slug', 'summary_text', 'description',
            'sources', 'audio_file', 'image', 'created_at',
            'tags', 'tag_ids', 'topics', 'topic_ids', 
            'likes_count', 'dislikes_count', 'user_action',
            'is_saved', 'audio_url', 'image_url'
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_audio_url(self, obj):
        request = self.context.get('request')
        return cdn_or_absolute(request, obj.audio_file, settings.AUDIO_CDN_DOMAIN)

    def get_image_url(self, obj):
        request = self.context.get('request')
        return cdn_or_absolute(request, obj.image, settings.AUDIO_CDN_DOMAIN)

    def get_user_action(self, episode):
        request = self.context.get("request")
        if not request:
            return None

        user = request.user if request.user.is_authenticated else getattr(request, 'guest_user', None)
        if not user:
            return None

        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(user.__class__)

        try:
            interaction = LikeDislike.objects.get(
                content_type=content_type,
                object_id=user.id,
                episode=episode
            )
            return interaction.action
        except LikeDislike.DoesNotExist:
            return None

    def get_is_saved(self, episode):
        request = self.context.get("request")
        if not request:
            return False

        user = request.user if request.user.is_authenticated else getattr(request, 'guest_user', None)
        if not user:
            return False

        content_type = ContentType.objects.get_for_model(user.__class__)
        return SavedEpisode.objects.filter(
            content_type=content_type,
            object_id=user.id,
            saved_content_type=ContentType.objects.get_for_model(Episode),
            saved_object_id=episode.id
        ).exists()




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
        return cdn_or_absolute(request, obj.audio_file, settings.AUDIO_CDN_DOMAIN)

    def get_image(self, obj):
        request = self.context.get('request')
        return cdn_or_absolute(request, obj.image, settings.AUDIO_CDN_DOMAIN)
    
    def get_duration_seconds(self, obj):
        return getattr(obj, 'duration_seconds', 0)

    def get_progress_percent(self, obj):
        position = getattr(obj, 'position_seconds', 0)
        duration = getattr(obj, 'duration_seconds', 0)
        if duration > 0:
            return round((position / duration) * 100)
        return 0

