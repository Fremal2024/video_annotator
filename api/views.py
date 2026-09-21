import cv2
import os
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Video, AnnotationClip
from .serializers import (
    VideoListSerializer,
    VideoDetailSerializer,
    AnnotationClipSerializer,
)
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import update_session_auth_hash
from .models import UserProfile
from .serializers import UserProfileSerializer, ChangePasswordSerializer
from rest_framework.exceptions import APIException

class PlanLimitExceeded(APIException):
    status_code = 402
    default_detail = 'Plan limit reached.'
    default_code = 'plan_limit_exceeded'

class VideoViewSet(viewsets.ModelViewSet):
    """
    API endpoint for videos.

    - List:           GET    /api/videos/
    - Create:         POST   /api/videos/
    - Retrieve:       GET    /api/videos/{id}/
    - Update:         PUT    /api/videos/{id}/
    - Delete:         DELETE /api/videos/{id}/
    - Add clip:       POST   /api/videos/{id}/add_clip/
    - Update clip:    POST   /api/videos/{id}/update_clip/
    - Delete clip:    POST   /api/videos/{id}/delete_clip/
    - Approve clip:   POST   /api/videos/{id}/approve_clip/
    - Reprocess:      POST   /api/videos/{id}/reprocess/
    - Auto-annotate:  POST   /api/videos/{id}/auto_annotate/
    """
    queryset = Video.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
    # Use the detail serializer for retrieve AND create,
    # because it includes the 'file' field.
        if self.action in ('retrieve', 'create'):
            return VideoDetailSerializer
        return VideoListSerializer

    def get_queryset(self):
        """Only show videos belonging to the logged-in user (if authenticated)."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        return queryset

    # ------------------------------------------------------------------
    # Upload / create
    # ------------------------------------------------------------------
    def perform_create(self, serializer):
        """Save uploaded video and extract its duration."""
        if self.request.user.is_authenticated:
            user = self.request.user
        else:
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(
                    'demo', 'demo@demo.com', 'demopass123'
                )

        video = serializer.save(user=user)

        # Extract duration using OpenCV
        try:
            if video.file and os.path.exists(video.file.path):
                cap = cv2.VideoCapture(video.file.path)
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                if fps > 0:
                    video.duration = int(frame_count / fps)
                cap.release()
        except Exception as e:
            print(f"[VideoViewSet] Could not extract duration: {e}")

        video.status = 'completed'
        video.save()

    # ------------------------------------------------------------------
    # Manual clip management
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='add_clip')
    def add_clip(self, request, pk=None):
        """Add a manual annotation clip to a video."""
        video = self.get_object()

        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        description = request.data.get('description', '').strip()

        if start_time is None or end_time is None:
            return Response(
                {'error': 'start_time and end_time are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start_time = float(start_time)
            end_time = float(end_time)
        except (TypeError, ValueError):
            return Response(
                {'error': 'start_time and end_time must be numbers'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if end_time <= start_time:
            return Response(
                {'error': 'end_time must be greater than start_time'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not description:
            return Response(
                {'error': 'description is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clip = AnnotationClip.objects.create(
            video=video,
            start_time=start_time,
            end_time=end_time,
            description=description,
            confidence_score=1.0,
            is_approved=True,
        )
        return Response(
            AnnotationClipSerializer(clip).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='update_clip')
    def update_clip(self, request, pk=None):
        """Update an existing clip's start/end/description."""
        video = self.get_object()
        clip_id = request.data.get('clip_id')

        if not clip_id:
            return Response(
                {'error': 'clip_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            clip = video.clips.get(id=clip_id)
        except AnnotationClip.DoesNotExist:
            return Response(
                {'error': 'Clip not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if 'start_time' in request.data:
            try:
                clip.start_time = float(request.data['start_time'])
            except (TypeError, ValueError):
                return Response(
                    {'error': 'start_time must be a number'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if 'end_time' in request.data:
            try:
                clip.end_time = float(request.data['end_time'])
            except (TypeError, ValueError):
                return Response(
                    {'error': 'end_time must be a number'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if 'description' in request.data:
            clip.description = request.data['description']

        if 'is_approved' in request.data:
            clip.is_approved = bool(request.data['is_approved'])

        if clip.end_time <= clip.start_time:
            return Response(
                {'error': 'end_time must be greater than start_time'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clip.save()
        return Response(AnnotationClipSerializer(clip).data)

    @action(detail=True, methods=['post'], url_path='delete_clip')
    def delete_clip(self, request, pk=None):
        """Delete a single clip from a video."""
        video = self.get_object()
        clip_id = request.data.get('clip_id')

        if not clip_id:
            return Response(
                {'error': 'clip_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = video.clips.filter(id=clip_id).delete()
        if deleted:
            return Response({'status': 'deleted'})
        return Response(
            {'error': 'Clip not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # ------------------------------------------------------------------
    # Approve / reprocess
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='approve_clip')
    def approve_clip(self, request, pk=None):
        """Mark a specific annotation clip as approved."""
        video = self.get_object()
        clip_id = request.data.get('clip_id')

        if not clip_id:
            return Response(
                {'error': 'clip_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            clip = video.clips.get(id=clip_id)
            clip.is_approved = True
            clip.save()
            return Response({
                'status': 'approved',
                'clip': AnnotationClipSerializer(clip).data,
            })
        except AnnotationClip.DoesNotExist:
            return Response(
                {'error': 'Clip not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=['post'], url_path='reprocess')
    def reprocess(self, request, pk=None):
        """Delete existing clips so the user can annotate from scratch."""
        video = self.get_object()
        video.clips.all().delete()
        video.status = 'completed'
        video.save()
        return Response({'status': 'reprocessed', 'clips': []})

    # ------------------------------------------------------------------
    # AI auto-annotation
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='auto_annotate')
    def auto_annotate(self, request, pk=None):
        """
        Use AI to automatically detect scenes and generate descriptions.
        WARNING: This can take 30-90 seconds depending on video length.
        """
        # Import here to avoid loading openai unless needed
        from video_processor.ai_annotator import AIAnnotator

        video = self.get_object()

        if not video.file or not os.path.exists(video.file.path):
            return Response(
                {'error': 'Video file not found'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Clear previous clips (fresh start)
        video.clips.all().delete()

        try:
            video.status = 'processing'
            video.save()

            annotator = AIAnnotator()
            clips_data = annotator.annotate(video.file.path, video.duration)

            created = []
            for c in clips_data:
                clip = AnnotationClip.objects.create(
                    video=video,
                    start_time=c['start_time'],
                    end_time=c['end_time'],
                    description=c['description'],
                    confidence_score=c['confidence_score'],
                    is_approved=False,
                )
                created.append(AnnotationClipSerializer(clip).data)

            video.status = 'completed'
            video.save()

            return Response({
                'status': 'completed',
                'clips_created': len(created),
                'clips': created,
            })

        except Exception as e:
            video.status = 'failed'
            video.save()
            print(f"[auto_annotate] Error: {e}")
            return Response(
                {'error': f'AI annotation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

# ======================================================================
# Profile endpoints
# ======================================================================

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def profile_view(request):
    """Get or update the current user's profile."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    # PATCH
    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change the current user's password."""
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    update_session_auth_hash(request, user)
    return Response({'status': 'password changed'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    """Permanently delete the current user's account."""
    user = request.user
    user.delete()
    return Response({'status': 'account deleted'})