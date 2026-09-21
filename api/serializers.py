from rest_framework import serializers
from .models import Video, AnnotationClip
from django.contrib.auth.models import User
from .models import UserProfile


class AnnotationClipSerializer(serializers.ModelSerializer):
    """Serializer for annotation clips"""
    class Meta:
        model = AnnotationClip
        fields = ['id', 'video', 'start_time', 'end_time', 'description', 
                  'confidence_score', 'is_approved', 'created_at']
        read_only_fields = ['id', 'created_at']

class VideoListSerializer(serializers.ModelSerializer):
    """Serializer for video list view"""
    clips_count = serializers.IntegerField(source='clips.count', read_only=True)
    
    class Meta:
        model = Video
        fields = ['id', 'title', 'description', 'thumbnail', 'duration', 
                  'status', 'created_at', 'clips_count']

class VideoDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed video view with clips"""
    clips = AnnotationClipSerializer(many=True, read_only=True)
    
    class Meta:
        model = Video
        fields = ['id', 'title', 'description', 'file', 'thumbnail', 
                  'duration', 'status', 'created_at', 'updated_at', 'clips']

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'phone', 'country', 'dob', 'bio',
            'avatar', 'avatar_url',
            'referral_code', 'referral_count',
            'marketing_emails', 'product_updates',
        ]
        extra_kwargs = {
            'avatar': {'write_only': True, 'required': False},
        }

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        try:
            return obj.avatar.url
        except Exception:
            return None

    def update(self, instance, validated_data):
        # Pop nested user fields
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            if 'email' in user_data:
                user.email = user_data['email']
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            user.save()

        # Update profile fields
        for field in ['phone', 'country', 'dob', 'bio', 'marketing_emails', 'product_updates']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        if 'avatar' in validated_data:
            instance.avatar = validated_data['avatar']

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)