from django.contrib import admin
from .models import Art

@admin.register(Art)
class ArtAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "width", "height", "created_at")  # columns to show
    search_fields = ("title", "user__username")  # search by title or username
    list_filter = ("created_at",)  # filter by date