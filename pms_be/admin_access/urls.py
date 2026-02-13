from django.urls import path
from .views import RoleView, SidebarContentView, RoleBasedAccessView

urlpatterns = [
    path("roles/", RoleView.as_view()),
    path("sidebar/", SidebarContentView.as_view()),
    path("access/", RoleBasedAccessView.as_view()),
]
