from rest_framework import serializers
from .models import Message, MessageReaction

class MessageReactionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = MessageReaction
        fields = ("id", "user", "reaction", "created_at")


class MessageSerializer(serializers.ModelSerializer):
    reactions = MessageReactionSerializer(many=True, read_only=True)
    reaction_counts = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()
    content_data = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "sender",
            "receiver",
            "content",
            "content_data",
            "type",
            "timestamp",
            "read",
            "reactions",
            "reaction_counts",
            "my_reaction",
        )

    def get_reaction_counts(self, obj):
        counts = {}
        for r in obj.reactions.all():
            counts[r.reaction] = counts.get(r.reaction, 0) + 1
        return counts

    def get_my_reaction(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        my = obj.reactions.filter(user=request.user).first()
        return my.reaction if my else None

    def get_content_data(self, obj):
        if obj.type in ["file", "audio"]:
            return obj.get_content()
        return obj.content
