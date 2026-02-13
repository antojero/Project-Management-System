# PMS/routing.py
from django.urls import re_path
from . import consumers  # import from PMS
import chats.routing 

websocket_urlpatterns = [
    re_path(r'ws/call/(?P<username>\w+)/$', consumers.CallConsumer.as_asgi()),
]
