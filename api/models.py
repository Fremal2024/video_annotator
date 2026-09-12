from django.db import models
from django.contrib.auth.models import User


class Video(models.Model):   #Store the information of each uploaded video
    """Model to store uploaded videos"""
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='videos/')
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    duration = models.IntegerField(default=0)  # This is the duration in seconds
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class AnnotationClip(models.Model):  # Stores each short clip annotation including start time, end time, description, confidence score, and approval status
    """Model to store annotation clips for a video"""
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='clips')
    start_time = models.FloatField()  # in seconds
    end_time = models.FloatField()    # in seconds
    description = models.TextField()
    confidence_score = models.FloatField(default=0.0)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.video.title} - {self.start_time}s to {self.end_time}s"

