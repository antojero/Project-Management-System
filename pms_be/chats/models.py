from django.conf import settings
from django.db import models
import json

class Message(models.Model):
    MESSAGE_TYPE_CHOICES = (
        ("text", "text"),
        ("file", "file"),
        ("audio", "audio"),
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sent_messages",
        on_delete=models.CASCADE,
        null=True, blank=True
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="received_messages",
        on_delete=models.CASCADE,
        null=True, blank=True
    )
    content = models.TextField()  # text or JSON for files/audio
    type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default="text")
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender} -> {self.receiver} ({self.type})"

    def set_file_content(self, file_name, file_data, file_type="file"):
        """
        Save file/audio info as JSON in content field
        file_data should be base64 string
        """
        self.content = json.dumps({
            "name": file_name,
            "data": file_data,
            "type": file_type
        })
        self.type = file_type

    def get_content(self):
        """
        Return text for text messages or JSON for files/audio
        """
        if self.type in ["file", "audio"]:
            try:
                return json.loads(self.content)
            except:
                return {"name": "unknown", "data": "", "type": self.type}
        return self.content


class MessageReaction(models.Model):
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="reactions"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reaction = models.CharField(max_length=10)  # store emoji
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")

    def __str__(self):
        return f"{self.user} reacted {self.reaction} to message {self.message.id}"
