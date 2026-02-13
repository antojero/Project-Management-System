import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import chats.routing
import PMS.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'be.settings')  # <-- YOUR settings module

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chats.routing.websocket_urlpatterns + PMS.routing.websocket_urlpatterns
        )
    ),
})
