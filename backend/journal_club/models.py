from django.db import models
from django.utils.text import slugify

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

User = get_user_model()


class Topic(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Episode(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    summary_text = models.TextField()
    description = models.TextField(blank=True)
    sources = models.JSONField(default=list)  # e.g., list of URLs or references
    audio_file = models.FileField(upload_to='episodes/')
    image = models.ImageField(upload_to='episodes/images/', null=True, blank=True)  # Optional display image
    created_at = models.DateTimeField(auto_now_add=True)
    topics  = models.ManyToManyField(Topic, related_name='episodes', blank=True)
    tags = models.ManyToManyField(Tag, related_name='episodes', blank=True)

    likes_count = models.PositiveIntegerField(default=0)
    dislikes_count = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title



class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)

    # Generic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user} on {self.content_object}"
    


class ListeningHistory(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, db_index=True)
    object_id = models.PositiveIntegerField(db_index=True)
    listener = GenericForeignKey('content_type', 'object_id')

    episode = models.ForeignKey('Episode', on_delete=models.CASCADE)
    duration_seconds = models.PositiveIntegerField(default=0)
    position_seconds = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('content_type', 'object_id', 'episode')
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'episode']),
        ]


class LikeDislike(models.Model):
    ACTIONS = [('like', 'Like'), ('dislike', 'Dislike')]

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    actor = GenericForeignKey('content_type', 'object_id')

    episode = models.ForeignKey('Episode', on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=ACTIONS)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('content_type', 'object_id', 'episode')

class SavedEpisode(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    user = GenericForeignKey('content_type', 'object_id')

    # This now points to any "savable" object (Episode, Series, etc.)
    saved_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name='+')
    saved_object_id = models.PositiveIntegerField()
    saved_object = GenericForeignKey('saved_content_type', 'saved_object_id')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (
            'content_type', 'object_id',
            'saved_content_type', 'saved_object_id'
        )
