from django.urls import path
from .views import *

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("login-face/", FaceLoginView.as_view(), name="login_face"),
    path("enroll-face/", FaceEnrollView.as_view(), name="enroll_face"),
    path("department/", DepartmentViewApi.as_view(), name="department_view"),
    path("users/", UsersViewApi.as_view(), name="users_view"),
    path("google-login/", GoogleLoginView.as_view(), name="google_login"),
]
