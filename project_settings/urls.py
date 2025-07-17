"""
URL configuration for project_settings project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from main_app import views

urlpatterns = [
    path("", views.home, name="home"),
    path("create/", views.create_art, name="create_art"),
    path("canvas/<int:art_id>/", views.canvas_view, name="canvas_view"),
    path("save-art/", views.save_art, name="save_art"),
    path("rename-art/<int:art_id>/", views.rename_art, name="rename_art"),
    path("delete-art/<int:art_id>/", views.delete_art, name="delete_art"),
    path("login/", views.login_view, name="login"),
    path("register/", views.register, name="register"),
    path("logout/", views.logout_view, name="logout"),
    path("admin/", admin.site.urls),
]
