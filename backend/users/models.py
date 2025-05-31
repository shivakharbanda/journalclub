from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # add any extra fields if needed
    pass


class GuestUser(models.Model):
    device_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    linked_user = models.OneToOneField(
        CustomUser, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='guest_profile'
    )


    def __str__(self):
        return f"Guest {self.device_id}"
