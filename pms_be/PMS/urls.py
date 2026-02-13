from django.urls import path
from .views import *

urlpatterns = [
    path("projects/", ProjectAPI.as_view(), name="projects_api"),

    path("ai-chat/", AIChatView.as_view(), name="ai_chat_api"),
    path('ai-voicechat/', voicechat, name='ai_voicechat'),
]
