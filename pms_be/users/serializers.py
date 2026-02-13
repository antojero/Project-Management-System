from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, CustomUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from admin_access.models import Role

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "department", "face_image"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role=validated_data["role"],
            department=validated_data["department"],
            face_image=validated_data.get("face_image")
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["username"] = self.user.username
        data["email"] = self.user.email
        data["user_id"] = self.user.id
        data["role"] = self.user.role.name if self.user.role else None
        return data


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class CustomUserSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "role", "department",
                  "role_name", "department_name", "last_seen"]

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_role_name(self, obj):
        return obj.role.name if obj.role else None

    def get_last_seen(self, obj):
        return obj.last_seen.isoformat() if obj.last_seen else None
