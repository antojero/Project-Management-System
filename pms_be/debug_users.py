import os
import django
import sys

# Setup Django environment
sys.path.append('/Users/antojero/Documents/Pms/pms_be')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'be.settings')
django.setup()

from users.models import CustomUser
from users.serializers import CustomUserSerializer

def debug_users():
    users = CustomUser.objects.all()
    print(f"Found {users.count()} users.")
    serializer = CustomUserSerializer(users, many=True)
    data = serializer.data
    
    for user_data in data:
        print(f"ID: {user_data.get('id')} | Username: '{user_data.get('username')}'")

if __name__ == "__main__":
    debug_users()
