from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.urls import reverse
import json

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
    art = get_object_or_404(Art, id=art_id, user=request.user)
    return render(request, "main_app/canvas_view.html", {
        "art": art
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