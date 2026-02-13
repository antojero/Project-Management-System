from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Project(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_projects")
    status_choices = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]
    status = models.CharField(max_length=20, choices=status_choices, default="pending")

    def __str__(self):
        return self.name


class Module(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="modules")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="assigned_modules")

    def __str__(self):
        return f"{self.name} - {self.project.name}"


class Task(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="assigned_tasks")
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    priority_choices = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]
    priority = models.CharField(max_length=20, choices=priority_choices, default="medium")
    status_choices = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("review", "Review"),
        ("completed", "Completed"),
    ]
    status = models.CharField(max_length=20, choices=status_choices, default="todo")

    def __str__(self):
        return f"{self.title} - {self.module.name}"
    

class UserContext(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="context")
    name = models.CharField(max_length=100, blank=True, null=True)
    last_project = models.CharField(max_length=255, blank=True, null=True)
    last_module = models.CharField(max_length=255, blank=True, null=True)
    memory = models.JSONField(default=list, blank=True)  # 🧠 stores chat history as [{"user":"hi"}, {"ai":"hello"}]

    def __str__(self):
        return f"Context for {self.user.username}"

    def add_message(self, role, content):
        """Append chat message to memory"""
        m = self.memory or []
        m.append({role: content})
        # keep last 20 only to prevent overload
        self.memory = m[-20:]
        self.save()
