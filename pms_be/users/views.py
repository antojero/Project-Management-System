from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser, Department
from admin_access.models import Role
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, DepartmentSerializer, CustomUserSerializer
from django.core.paginator import Paginator
from deepface import DeepFace
import numpy as np
from scipy.spatial.distance import cosine
from PIL import Image
import base64, io

# JWT login
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Registration
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "User registered successfully!",
                "refresh": str(refresh),
                "access": str(refresh.access_token)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Department CRUD (GET/POST/PUT/DELETE)
class DepartmentViewApi(APIView):
    def get(self, request):
        dept_id = request.query_params.get("id")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))

        if dept_id:
            try:
                department = Department.objects.get(id=dept_id)
                serializer = DepartmentSerializer(department)
                return Response(serializer.data)
            except Department.DoesNotExist:
                return Response({"error": "Department not found"}, status=404)

        depts = Department.objects.all().order_by("id")
        paginator = Paginator(depts, page_size)
        page_obj = paginator.get_page(page)
        serializer = DepartmentSerializer(page_obj, many=True)
        return Response({
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page,
            "page_size": page_size,
            "results": serializer.data
        })

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# Users CRUD
class UsersViewApi(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))

        if user_id:
            try:
                user = CustomUser.objects.get(id=user_id)
                serializer = CustomUserSerializer(user)
                return Response(serializer.data)
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=404)

        users = CustomUser.objects.all().order_by("id")
        paginator = Paginator(users, page_size)
        page_obj = paginator.get_page(page)
        serializer = CustomUserSerializer(page_obj, many=True)
        return Response({
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page,
            "page_size": page_size,
            "results": serializer.data
        })

# Face enrollment / first-time registration
class FaceEnrollView(APIView):
    def post(self, request):
        username = request.data.get("username")
        face_image = request.data.get("face_image")

        if not username or not face_image:
            return Response({"detail": "Username and face image required"}, status=400)

        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        try:
            # Decode base64
            imgdata = base64.b64decode(face_image.split(",")[1])
            image = Image.open(io.BytesIO(imgdata))
            temp_path = f"/tmp/{username}_enroll_face.jpg"
            image.save(temp_path)

            # Generate embedding
            embedding = DeepFace.represent(temp_path, model_name="ArcFace", enforce_detection=True)[0]["embedding"]
            user.face_embedding = np.array(embedding).tolist()
            user.save()

            return Response({"detail": "Face registered successfully!"})

        except Exception as e:
            return Response({"detail": f"Face enrollment failed: {str(e)}"}, status=400)
        
from rest_framework_simplejwt.tokens import RefreshToken

class FaceLoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        face_image = request.data.get("face_image")

        if not username or not face_image:
            return Response({"detail": "Username and face_image required"}, status=400)

        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        if not user.face_embedding:
            return Response({"detail": "User has no registered face"}, status=400)

        try:
            # Decode webcam image
            imgdata = base64.b64decode(face_image.split(",")[1])
            image = Image.open(io.BytesIO(imgdata))
            temp_path = f"/tmp/{username}_login_face.jpg"
            image.save(temp_path)

            # Get embeddings
            input_embedding = np.array(
                DeepFace.represent(temp_path, model_name="ArcFace", enforce_detection=True)[0]["embedding"]
            )
            db_embedding = np.array(user.face_embedding)

            # Compute cosine distance
            distance = cosine(input_embedding, db_embedding)
            if distance < 0.35:  # Threshold for face match
                # ✅ Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                return Response({
                    "username": user.username,
                    "user_id": user.id,
                    "role": user.role.name if user.role else None,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                })

            else:
                return Response({"detail": "Face does not match"}, status=401)

        except Exception as e:
            return Response({"detail": f"Face authentication error: {str(e)}"}, status=400)

from google.oauth2 import id_token
from google.auth.transport import requests
import requests as req

class GoogleLoginView(APIView):
    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token is required"}, status=400)

        try:
            # Verify the token
            CLIENT_ID = "763700926710-q39egohman2i31efhdrtpnqso4se8nt2.apps.googleusercontent.com"
            id_info = id_token.verify_oauth2_token(token, requests.Request(), audience=CLIENT_ID)

            email = id_info.get("email")
            username = email.split("@")[0]  # Simple username generation

            # Check if user exists, or create one
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                # Create new user
                # Assign default role/department if needed, or leave empty
                # We need to handle this carefully. For now, assume a default role exists or handle error.
                # Let's try to get a default role/dept (assuming ID 1 exists) or fail gracefully
                try:
                    role = Role.objects.first() 
                    dept = Department.objects.first()
                    user = CustomUser.objects.create(
                        username=username,
                        email=email,
                        role=role,
                        department=dept
                    )
                    user.set_unusable_password() 
                    user.save()
                except Exception as e:
                    return Response({"detail": "Could not create user automatically. Role/Dept missing."}, status=400)

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                "username": user.username,
                "user_id": user.id,
                "role": user.role.name if user.role else None,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })

        except ValueError:
            return Response({"error": "Invalid token"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
