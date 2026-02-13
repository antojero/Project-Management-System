from rest_framework import serializers
from .models import Role, Permission, SidebarContent, RoleBasedAccess

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "permission_name"]


class SidebarContentSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(), write_only=True, source="permission"
    )

    class Meta:
        model = SidebarContent
        fields = ["id", "component_name", "action_link", "permission", "permission_ids"]


class RoleBasedAccessSerializer(serializers.ModelSerializer):
    sidebar_detail = SidebarContentSerializer(source="sidebar_content", read_only=True)

    class Meta:
        model = RoleBasedAccess
        fields = [
            "id",
            "role",
            "sidebar_content",
            "sidebar_detail",
            "is_view",
            "is_add",
            "is_employeedata",
            "is_admindata",
            "is_hrdata",
        ]


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name"]
