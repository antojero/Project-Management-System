from django.contrib.auth.models import AbstractUser
from django.db import models
from admin_access.models import Role
from django.utils import timezone
import json

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, blank=True, null=True)
    last_seen = models.DateTimeField(blank=True, null=True)
    face_embedding = models.JSONField(blank=True, null=True)  # store face embedding

    def __str__(self):
        return self.username

    def update_last_seen(self):
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])
