from django.db import models
from django.utils.text import slugify

class Episode(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    summary_text = models.TextField()
    description = models.TextField(blank=True)
    sources = models.JSONField(default=list)  # e.g., list of URLs or references
    audio_file = models.FileField(upload_to='episodes/')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
