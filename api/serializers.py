from rest_framework import serializers
from .models import Video, AnnotationClip

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