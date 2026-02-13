# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.sender_id = int(self.scope['url_route']['kwargs']['sender_id'])  # logged-in user
        self.receiver_id = int(self.scope['url_route']['kwargs']['receiver_id'])
        users = sorted([self.sender_id, self.receiver_id])
        self.room_name = f"chat_{users[0]}_{users[1]}"

        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

        await self.update_last_seen(self.sender_id)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except:
            return

        event = data.get("event", "message")
        await self.update_last_seen(self.sender_id)

        if event == "message":
            await self.channel_layer.group_send(self.room_name, {
                "type": "chat_message",
                "event": "message",
                "message": data.get("message"),
            })

        elif event == "reaction":
            await self.channel_layer.group_send(self.room_name, {
                "type": "chat_message",
                "event": "reaction",
                "message": data.get("message"),
            })

        elif event == "typing":
            await self.channel_layer.group_send(self.room_name, {
                "type": "chat_message",
                "event": "typing",
                "user_id": data.get("user_id"),
            })

        elif event == "mark_read":
            message_ids = data.get("message_ids", [])

            # IMPORTANT FIX → reader is the one who is currently active (sender_id in this session)
            updated_ids = await self.mark_specific_messages_as_read(self.sender_id, message_ids)

            if updated_ids:
                await self.channel_layer.group_send(self.room_name, {
                    "type": "chat_message",
                    "event": "messages_read",
                    "message_ids": updated_ids,
                    "reader_id": self.sender_id,  # ✅ Fix here too
                })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def update_last_seen(self, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            user.last_seen = timezone.now()
            user.save(update_fields=['last_seen'])
        except User.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_specific_messages_as_read(self, reader_id, message_ids):
        print("✅ Reader ID (correct):", reader_id)
        from .models import Message

        qs = Message.objects.filter(
            id__in=message_ids,
            read=False
        )

        ids = list(qs.values_list('id', flat=True))
        if not ids:
            return []

        qs.update(read=True)
        return ids
