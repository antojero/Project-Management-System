from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from .models import Message, MessageReaction
from .serializers import MessageSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

class MessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        other_id = request.query_params.get("with")
        if not other_id:
            return Response({"error": "'with' query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            other = User.objects.get(id=other_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        messages = Message.objects.filter(sender=request.user, receiver=other) | Message.objects.filter(sender=other, receiver=request.user)
        messages = messages.order_by("timestamp")
        serializer = MessageSerializer(messages, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        receiver_id = data.get("receiver")
        msg_type = data.get("type", "text")
        content = data.get("content", "")
        file_name = data.get("file_name")
        file_data = data.get("file_data")

        if not receiver_id:
            return Response({"detail": "Receiver required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({"detail": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND)

        message = Message(sender=request.user, receiver=receiver)

        if msg_type in ["file", "audio"] and file_name and file_data:
            message.set_file_content(file_name, file_data, msg_type)
        else:
            message.content = content
            message.type = "text"

        message.save()
        serializer = MessageSerializer(message, context={"request": request})

        # Broadcast via channel layer
        users = sorted([request.user.id, receiver.id])
        room_name = f"chat_{users[0]}_{users[1]}"
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            room_name,
            {
                "type": "chat_message",
                "event": "message",
                "message": serializer.data
            }
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageReactView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        message_id = request.data.get("message_id")
        reaction = request.data.get("reaction")

        if not message_id or not reaction:
            return Response({"detail": "message_id and reaction required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response({"detail": "Message not found"}, status=status.HTTP_404_NOT_FOUND)

        existing = MessageReaction.objects.filter(message=message, user=request.user).first()
        if existing:
            if existing.reaction == reaction:
                existing.delete()
            else:
                existing.reaction = reaction
                existing.save()
        else:
            MessageReaction.objects.create(message=message, user=request.user, reaction=reaction)

        serializer = MessageSerializer(message, context={"request": request})

        # Broadcast reaction update
        users = sorted([message.sender.id, message.receiver.id])
        room_name = f"chat_{users[0]}_{users[1]}"
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            room_name,
            {
                "type": "chat_message",
                "event": "reaction",
                "message": serializer.data
            }
        )

        return Response(serializer.data)


from rest_framework.views import APIView
from rest_framework.response import Response
from deep_translator import GoogleTranslator

class TranslateView(APIView):
    def post(self, request):
        text = request.data.get("text", "")
        target_lang = request.data.get("target_lang", "en")

        if not text.strip():
            return Response({"translated": ""})

        try:
            translated = GoogleTranslator(source="auto", target=target_lang).translate(text)
            return Response({"translated": translated})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
