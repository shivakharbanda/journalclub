from django.db import models
from django.utils.text import slugify


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

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title