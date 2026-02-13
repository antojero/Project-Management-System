from django.db import models

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Permission(models.Model):
    permission_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.permission_name


class SidebarContent(models.Model):
    component_name = models.CharField(max_length=100, unique=True)
    action_link = models.CharField(max_length=200, unique=True)
    permission = models.ManyToManyField(Permission, blank=True)

    def __str__(self):
        return self.component_name


class RoleBasedAccess(models.Model):
    sidebar_content = models.ForeignKey(
        SidebarContent, on_delete=models.CASCADE, related_name="role_access"
    )
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_access")

    is_view = models.BooleanField(default=False)
    is_add = models.BooleanField(default=False)
    is_employeedata = models.BooleanField(default=False)
    is_admindata = models.BooleanField(default=False)
    is_hrdata = models.BooleanField(default=False)

    class Meta:
        unique_together = ("role", "sidebar_content")
        indexes = [
            models.Index(fields=["role", "sidebar_content"]),
        ]

    def __str__(self):
        return f"{self.role.name} -> {self.sidebar_content.component_name}"
