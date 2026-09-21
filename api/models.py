from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

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

# ======================================================================
# User Profile
# ======================================================================
class UserProfile(models.Model):
    """Extra user data beyond Django's built-in User."""
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
        ('team', 'Team'),
    ]
    PLAN_LIMITS = {
        'free': {'videos_per_month': 5,   'max_file_mb': 40},
        'pro':  {'videos_per_month': 999, 'max_file_mb': 2048},
        'team': {'videos_per_month': 999, 'max_file_mb': 2048},
    }

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=30, blank=True)
    country = models.CharField(max_length=100, blank=True)
    dob = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    referral_code = models.CharField(max_length=20, unique=True, blank=True)
    referral_count = models.IntegerField(default=0)
    marketing_emails = models.BooleanField(default=True)
    product_updates = models.BooleanField(default=True)

    # Plan / billing
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES, default='free')
    plan_started_at = models.DateTimeField(null=True, blank=True)
    plan_renews_at = models.DateTimeField(null=True, blank=True)
    has_payment_method = models.BooleanField(default=False)
    card_brand = models.CharField(max_length=20, blank=True)
    card_last4 = models.CharField(max_length=4, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.plan})"

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import secrets
            self.referral_code = secrets.token_urlsafe(8).replace('-', '').replace('_', '')[:10].upper()
        super().save(*args, **kwargs)

    def get_plan_limits(self):
        return self.PLAN_LIMITS.get(self.plan, self.PLAN_LIMITS['free'])

    def videos_uploaded_this_month(self):
        from django.utils import timezone
        start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return Video.objects.filter(user=self.user, created_at__gte=start).count()

    def can_upload(self):
        limits = self.get_plan_limits()
        return self.videos_uploaded_this_month() < limits['videos_per_month']


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create a UserProfile whenever a new User is created."""
    if created:
        UserProfile.objects.get_or_create(user=instance)
