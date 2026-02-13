from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Role, Permission, SidebarContent, RoleBasedAccess
from .serializers import (
    RoleSerializer,
    PermissionSerializer,
    SidebarContentSerializer,
    RoleBasedAccessSerializer,
)
from django.db import IntegrityError, transaction

# Role endpoints
class RoleView(APIView):
    def get(self, request):
        role_id = request.query_params.get("id")
        if role_id:
            try:
                role = Role.objects.get(pk=role_id)
            except Role.DoesNotExist:
                return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)

            role_data = RoleSerializer(role).data
            accesses = RoleBasedAccess.objects.filter(role=role)
            role_data["sidebars"] = RoleBasedAccessSerializer(accesses, many=True).data
            return Response(role_data)

        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        role_id = request.query_params.get("id")
        if not role_id:
            return Response({"error": "id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            role = Role.objects.get(pk=role_id)
        except Role.DoesNotExist:
            return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = RoleSerializer(role, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        role_id = request.query_params.get("id")
        if not role_id:
            return Response({"error": "id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            role = Role.objects.get(pk=role_id)
            role.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Role.DoesNotExist:
            return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)


# Sidebar endpoints
class SidebarContentView(APIView):
    def get(self, request):
        sidebar_id = request.query_params.get("id")
        if sidebar_id:
            try:
                sidebar = SidebarContent.objects.get(pk=sidebar_id)
                serializer = SidebarContentSerializer(sidebar)
                return Response(serializer.data)
            except SidebarContent.DoesNotExist:
                return Response({"error": "Sidebar content not found"}, status=status.HTTP_404_NOT_FOUND)
        sidebar = SidebarContent.objects.all()
        serializer = SidebarContentSerializer(sidebar, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SidebarContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        sidebar_id = request.query_params.get("id")
        if not sidebar_id:
            return Response({"error": "id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            sidebar = SidebarContent.objects.get(pk=sidebar_id)
        except SidebarContent.DoesNotExist:
            return Response({"error": "Sidebar content not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SidebarContentSerializer(sidebar, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        sidebar_id = request.query_params.get("id")
        if not sidebar_id:
            return Response({"error": "id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            sidebar = SidebarContent.objects.get(pk=sidebar_id)
            sidebar.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SidebarContent.DoesNotExist:
            return Response({"error": "Sidebar content not found"}, status=status.HTTP_404_NOT_FOUND)


# RoleBasedAccess endpoints
class RoleBasedAccessView(APIView):
    def get(self, request):
        access_id = request.query_params.get("id")
        role_id = request.query_params.get("role")

        if access_id:
            try:
                access = RoleBasedAccess.objects.get(pk=access_id)
                serializer = RoleBasedAccessSerializer(access)
                return Response(serializer.data)
            except RoleBasedAccess.DoesNotExist:
                return Response({"error": "RoleBasedAccess not found"}, status=status.HTTP_404_NOT_FOUND)

        if role_id:
            accesses = RoleBasedAccess.objects.filter(role__id=role_id)
            serializer = RoleBasedAccessSerializer(accesses, many=True)
            return Response(serializer.data)

        access = RoleBasedAccess.objects.all()
        serializer = RoleBasedAccessSerializer(access, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create or update a single RoleBasedAccess.
        If (role, sidebar_content) exists, update that row (return 200).
        Else create new (201).
        """
        role = request.data.get("role")
        sidebar_content = request.data.get("sidebar_content")
        if role is None or sidebar_content is None:
            return Response({"error": "role and sidebar_content are required"}, status=status.HTTP_400_BAD_REQUEST)

        exists = RoleBasedAccess.objects.filter(role_id=role, sidebar_content_id=sidebar_content).first()
        if exists:
            serializer = RoleBasedAccessSerializer(exists, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = RoleBasedAccessSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    serializer.save()
            except IntegrityError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        access_id = request.query_params.get("id")
        if not access_id:
            return Response({"error": "id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            access = RoleBasedAccess.objects.get(pk=access_id)
        except RoleBasedAccess.DoesNotExist:
            return Response({"error": "RoleBasedAccess not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = RoleBasedAccessSerializer(access, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
            except IntegrityError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        access_id = request.query_params.get("id")
        if not access_id:
            return Response({"error": "id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            access = RoleBasedAccess.objects.get(pk=access_id)
            access.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RoleBasedAccess.DoesNotExist:
            return Response({"error": "RoleBasedAccess not found"}, status=status.HTTP_404_NOT_FOUND)
