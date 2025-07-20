from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("create/", views.create_art, name="create_art"),
    path("canvas/<int:art_id>/", views.canvas_view, name="canvas_view"),
    path("save-art/", views.save_art, name="save_art"),
    path("rename-art/<int:art_id>/", views.rename_art, name="rename_art"),
    path("delete-art/<int:art_id>/", views.delete_art, name="delete_art"),
    path("export-art/<int:art_id>/", views.export_art, name="export_art"),
    path("login/", views.login_view, name="login"),
    path("register/", views.register, name="register"),
    path("logout/", views.logout_view, name="logout"),
]