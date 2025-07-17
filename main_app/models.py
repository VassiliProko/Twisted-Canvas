from django.db import models
from django.contrib.auth.models import User 

# Create your models here.

class Art(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="drawings")
    title = models.CharField(max_length=20)
    data = models.TextField()  # JSON or base64 or compressed pixel data
    created_at = models.DateTimeField(auto_now_add=True)
    width = models.IntegerField()
    height = models.IntegerField()

    def __str__(self):
        return self.title