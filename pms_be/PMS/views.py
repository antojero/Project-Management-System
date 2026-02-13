import json
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator

from .models import Project, Module, Task
from .serializers import ProjectSerializer, ModuleSerializer, TaskSerializer

# ------------- Project manual CRUD via query param id -------------
class ProjectAPI(APIView):
    def get(self, request):
        project_id = request.query_params.get("id")
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                serializer = ProjectSerializer(project)
                return Response(serializer.data)
            except Project.DoesNotExist:
                return Response({"error":"Project not found"}, status=status.HTTP_404_NOT_FOUND)

        # list
        projects = Project.objects.all().order_by("-created_at")
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        project_id = request.query_params.get("id")
        if not project_id:
            return Response({"error":"id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error":"Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        project_id = request.query_params.get("id")
        if not project_id:
            return Response({"error":"id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(id=project_id)
            project.delete()
            return Response({"message":"Deleted"}, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            return Response({"error":"Project not found"}, status=status.HTTP_404_NOT_FOUND)
        
import json
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator

from .models import Project, Module, Task
from .serializers import ProjectSerializer, ModuleSerializer, TaskSerializer

# ------------- Project manual CRUD via query param id -------------
class ProjectAPI(APIView):
    def get(self, request):
        project_id = request.query_params.get("id")
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                serializer = ProjectSerializer(project)
                return Response(serializer.data)
            except Project.DoesNotExist:
                return Response({"error":"Project not found"}, status=status.HTTP_404_NOT_FOUND)

        # list
        projects = Project.objects.all().order_by("-created_at")
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        project_id = request.query_params.get("id")
        if not project_id:
            return Response({"error":"id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error":"Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        project_id = request.query_params.get("id")
        if not project_id:
            return Response({"error":"id query param required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(id=project_id)
            project.delete()
            return Response({"message":"Deleted"}, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            return Response({"error":"Project not found"}, status=status.HTTP_404_NOT_FOUND)
        
import json
import requests
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Project, Module, Task
from .serializers import ProjectSerializer, ModuleSerializer, TaskSerializer

User = get_user_model()


class AIChatView(APIView):
    """
    AI-powered dynamic Project/Module/Task creation via natural language.
    - If the message is casual (hi, how are you, etc.), returns AI text reply.
    - If the message requests project/module/task creation, creates it dynamically.
    """

    def post(self, request):
        message = request.data.get("message")
        user_id = request.data.get("user_id")
        user = None

        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass

        if not message:
            return Response({"error": "Message required"}, status=400)

        try:
            # 🔹 Dynamically generate prompt
            prompt = (
                f"You are a project management assistant.\n"
                f"The user sent the following message:\n\"{message}\"\n\n"
                f"If the message is about creating a project, module, or task, "
                f"respond ONLY in JSON with one of these actions: "
                f"\"create_project\", \"create_module\", or \"create_task\".\n"
                f"The JSON must include all relevant fields. Example:\n"
                f"{{\n"
                f"  \"action\": \"create_project|create_module|create_task\",\n"
                f"  \"data\": {{\n"
                f"    \"name\": \"...\",\n"
                f"    \"project_name\": \"...\" (for module),\n"
                f"    \"module_name\": \"...\" (for task),\n"
                f"    \"description\": \"...\",\n"
                f"    \"start_date\": \"YYYY-MM-DD\",\n"
                f"    \"end_date\": \"YYYY-MM-DD\",\n"
                f"    \"priority\": \"low|medium|high|urgent\",\n"
                f"    \"status\": \"todo|in_progress|review|completed\"\n"
                f"  }}\n"
                f"}}\n"
                f"If the message is casual chat, respond normally in plain text."
            )

            # 🔹 Call Ollama API
            response = requests.post(
                "http://127.0.0.1:11434/api/chat",
                json={"model": "llama3:latest", "messages": [{"role": "user", "content": prompt}], "stream": False},
            )

            data = response.json()
            ai_content = data.get("message", {}).get("content", "")
            print("AI raw content:", ai_content, flush=True)

            if not ai_content:
                return Response({"reply": "⚠ Model loaded but returned empty response."})

            # 🔹 Try to parse JSON (for project/module/task)
            try:
                ai_json = json.loads(ai_content)
                action = ai_json.get("action")
                payload = ai_json.get("data", {})
                print("Parsed action:", action, "Payload:", payload, flush=True)
            except json.JSONDecodeError:
                # Not JSON → treat as normal chat
                return Response({"reply": ai_content})

            # 🔹 Validate required fields before creating DB entries
            required_fields = {
                "create_project": ["name", "start_date"],
                "create_module": ["name", "project_name", "start_date"],
                "create_task": ["title", "module_name", "start_date"],
            }

            missing_fields = [f for f in required_fields.get(action, []) if not payload.get(f)]
            if missing_fields:
                # Not enough info → reply AI content instead
                return Response({"reply": ai_content})

            # 🔹 Map actions to DB operations
            result = {}
            if action == "create_project":
                project = Project.objects.create(
                    name=payload.get("name"),
                    description=payload.get("description", ""),
                    start_date=payload.get("start_date"),
                    end_date=payload.get("end_date"),
                    created_by=user,
                )
                result = ProjectSerializer(project).data

            elif action == "create_module":
                project_name = payload.get("project_name")
                try:
                    project = Project.objects.get(name=project_name)
                except Project.DoesNotExist:
                    return Response({"reply": f"Project '{project_name}' not found."}, status=404)

                module = Module.objects.create(
                    project=project,
                    name=payload.get("name"),
                    description=payload.get("description", ""),
                    start_date=payload.get("start_date"),
                    end_date=payload.get("end_date"),
                    assigned_to=user,
                )
                result = ModuleSerializer(module).data

            elif action == "create_task":
                module_name = payload.get("module_name")
                try:
                    module = Module.objects.get(name=module_name)
                except Module.DoesNotExist:
                    return Response({"reply": f"Module '{module_name}' not found."}, status=404)

                task = Task.objects.create(
                    module=module,
                    title=payload.get("name") or payload.get("title"),
                    description=payload.get("description", ""),
                    start_date=payload.get("start_date"),
                    end_date=payload.get("end_date"),
                    priority=payload.get("priority", "medium"),
                    status=payload.get("status", "todo"),
                    assigned_to=user,
                )
                result = TaskSerializer(task).data

            else:
                # Unknown action → treat as normal chat
                return Response({"reply": ai_content})

            return Response({"reply": f"✅ {action} executed!", "created": result})

        except Exception as e:
            return Response({"error": f"Failed to connect to Ollama: {str(e)}"}, status=500)



# ai_voicechat/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests

@csrf_exempt
def voicechat(request):
    if request.method != "POST":
        return JsonResponse({"reply": "Only POST requests allowed"}, status=405)

    try:
        data = json.loads(request.body)
        message = data.get("message", "").strip()
        if not message:
            return JsonResponse({"reply": "No message provided"}, status=400)

        # Call Ollama with summarization instruction
        ollama_url = "http://127.0.0.1:11434/api/chat"
        payload = {
            "model": "llama3:latest",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Always summarize your replies into maximum 3 lines. Be concise, clear, and informative."
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        }

        resp = requests.post(ollama_url, json=payload, timeout=10)
        resp.raise_for_status()

        # Handle streaming multiple JSON lines
        lines = [line for line in resp.text.split("\n") if line.strip()]
        full_reply = ""
        for line in lines:
            try:
                llm_response = json.loads(line)
                msg_content = llm_response.get("message", {}).get("content")
                if msg_content:
                    full_reply += msg_content
            except json.JSONDecodeError:
                continue

        if not full_reply:
            full_reply = "Sorry, no response from LLM."

        return JsonResponse({"reply": full_reply})

    except requests.exceptions.RequestException as e:
        print("Requests error:", e)
        return JsonResponse({"reply": f"Error contacting LLM: {str(e)}"}, status=500)
    except Exception as e:
        print("General error:", e)
        return JsonResponse({"reply": f"Error: {str(e)}"}, status=500)
