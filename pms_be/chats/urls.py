# chat/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path("messages/", MessageListCreateView.as_view(), name="chat-messages"),
    path("messages/react/", MessageReactView.as_view(), name="chat-message-react"),
    path("translate/", TranslateView.as_view(), name="translate"),
]
