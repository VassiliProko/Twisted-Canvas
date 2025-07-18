from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.urls import reverse
import json
import base64
from PIL import Image
import io

from .models import User, Art



def home(request):
    if request.user.is_authenticated:
        drawings = Art.objects.filter(user=request.user).order_by('-created_at')
    else:
        drawings = []

    return render(request, "main_app/index.html", {
        "drawings": drawings
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("home"))
        else:
            return render(request, "main_app/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "main_app/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("home"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "main_app/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "main_app/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("home"))
    else:
        return render(request, "main_app/register.html")
    

def canvas_view(request, art_id):
    drawing = get_object_or_404(Art, id=art_id, user=request.user)
    return render(request, "main_app/canvas_view.html", {
        "drawing": drawing
    })

@login_required
def create_art(request):
    if request.method == "POST":
        title = request.POST.get("title", "Untitled")
        width_raw = request.POST.get("width")
        height_raw = request.POST.get("height")

        if not title or title.strip() == "":
            title = "Untitled"

        # Try converting width and height to integers
        try:
            width = int(width_raw)
            height = int(height_raw)
        except (ValueError, TypeError):
            drawings = request.user.drawings.all()
            return render(request, "main_app/index.html", {
                "message": "Please provide valid numeric width and height.",
                "drawings": drawings
            })

        # Enforce allowed range, reload page with message
        if width < 1 or width > 512 or height < 1 or height > 512:
            drawings = request.user.drawings.all()
            return render(request, "main_app/index.html", {
                "message": "Dimensions must be between 1 and 512.",
                "drawings": drawings
            })

        # finally create the art canvas object
        art = Art.objects.create(
            user=request.user,
            title=title,
            data="{}",
            width=width,
            height=height
        )
        return redirect("canvas_view", art_id=art.id)

    return redirect("home")

@csrf_exempt
def save_art(request):
    if request.method == "POST":
        data = json.loads(request.body)
        art_id = data.get("art_id")
        art_data = data.get("data")

        # Save existing or create new art
        if art_id:
            art = Art.objects.get(id=art_id)
            art.data = art_data
            art.save()
        else:
            art = Art.objects.create(user=request.user, title="Untitled", data=art_data)

        return JsonResponse({"status": "success", "art_id": art.id})

    return JsonResponse({"error": "POST required"}, status=400)

@login_required
def rename_art(request, art_id):
    if request.method == "POST":
        title = request.POST.get("new_title", "").strip()
        if not title:
            title = "Untitled"

        try:
            art = Art.objects.get(id=art_id, user=request.user)
            art.title = title
            art.save()
        except Art.DoesNotExist:
            pass

    return redirect("home")

@login_required
def delete_art(request, art_id):
    if request.method == "POST":
        try:
            art = Art.objects.get(id=art_id, user=request.user)
            art.delete()
        except Art.DoesNotExist:
            pass
    
    return redirect("home")


@login_required
def export_art(request, art_id):
    if request.method == "POST":
        scale = float(request.POST.get("scale", 1))
        action = request.POST.get("action")

        # Load the drawing data
        art = Art.objects.get(id=art_id, user=request.user)
        drawing = art.data

        # Convert drawing to image
        image = render_scaled_image(drawing, scale)

        if action == "save":
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            buffer.seek(0)
            response = HttpResponse(buffer, content_type="image/jpeg")
            response['Content-Disposition'] = f'attachment; filename="{art.title}.jpg"'
            return response

        elif action == "copy":
            # Just redirect without doing anything on the backend
            return redirect("canvas_view", art_id=art.id)
        
    return redirect("canvas_view", art_id=art_id)


def render_scaled_image(data_url, scale):
    # Extract base64 part
    if not data_url.startswith("data:image/"):
        raise ValueError("Invalid data URL")

    base64_str = data_url.split(",", 1)[1]
    image_data = base64.b64decode(base64_str)

    # Open image and convert to RGB
    img = Image.open(io.BytesIO(image_data)).convert("RGB")

    # Resize using scale
    new_width = int(img.width * scale)
    new_height = int(img.height * scale)
    resized = img.resize((new_width, new_height), Image.Resampling.NEAREST) # nearest neighbor for pixel clarity

    return resized