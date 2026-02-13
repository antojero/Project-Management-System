# PMS/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CallConsumer(AsyncWebsocketConsumer):
    """
    Simple signaling consumer.
    Each user joins a group named by their username (or user id).
    Messages received are forwarded to the target group's channel.
    Payload example:
    {
      "type": "call.request",  # arbitrary
      "action": "call_request" | "offer" | "answer" | "ice_candidate" | "call_end",
      "from": "caller_username",
      "target": "callee_username",
      "sdp": {...}  # for offer/answer
    }
    """
    async def connect(self):
        # username passed in path: ws/call/<str:username>/
        self.username = self.scope['url_route']['kwargs'].get('username')
        if not self.username:
            await self.close()
            return
        self.group_name = f"user_{self.username}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except Exception:
            return
        target = data.get("target")
        if not target:
            return
        target_group = f"user_{target}"
        # forward to target
        await self.channel_layer.group_send(
            target_group,
            {"type": "call.message", "message": data}
        )

    async def call_message(self, event):
        # send message to WebSocket client
        await self.send(text_data=json.dumps(event["message"]))
