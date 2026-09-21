import cv2
import os
from datetime import timedelta

from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.utils import timezone
from django.db import models

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Video, AnnotationClip, UserProfile
from .serializers import (
    VideoListSerializer,
    VideoDetailSerializer,
    AnnotationClipSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)


# ======================================================================
# Custom exceptions
# ======================================================================
class PlanLimitExceeded(APIException):
    """Raised when a user has hit their plan's video or size limit."""
    status_code = 402  # Payment Required
    default_detail = 'Plan limit reached. Upgrade to continue.'
    default_code = 'plan_limit_exceeded'


# ======================================================================
# Video API
# ======================================================================
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
        if self.action in ('retrieve', 'create'):
            return VideoDetailSerializer
        return VideoListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        return queryset

    # ------------------------------------------------------------------
    # Upload / create (with plan enforcement)
    # ------------------------------------------------------------------
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            user = self.request.user
        else:
            user = User.objects.first()
            if not user:
                user = User.objects.create_user('demo', 'demo@demo.com', 'demopass123')

        # Get or create the profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        limits = profile.get_plan_limits()

        # Check monthly video limit
        if not profile.can_upload():
            raise PlanLimitExceeded(
                f"You've reached the {limits['videos_per_month']}-video limit "
                f"on the {profile.get_plan_display()} plan. Upgrade to upload more."
            )

        # Check file size
        uploaded_file = self.request.FILES.get('file')
        if uploaded_file:
            max_bytes = limits['max_file_mb'] * 1024 * 1024
            if uploaded_file.size > max_bytes:
                raise PlanLimitExceeded(
                    f"File is too large. The {profile.get_plan_display()} plan "
                    f"allows up to {limits['max_file_mb']} MB."
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
        video = self.get_object()

        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        description = request.data.get('description', '').strip()

        if start_time is None or end_time is None:
            return Response({'error': 'start_time and end_time are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            start_time = float(start_time)
            end_time = float(end_time)
        except (TypeError, ValueError):
            return Response({'error': 'start_time and end_time must be numbers'},
                            status=status.HTTP_400_BAD_REQUEST)

        if end_time <= start_time:
            return Response({'error': 'end_time must be greater than start_time'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not description:
            return Response({'error': 'description is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        clip = AnnotationClip.objects.create(
            video=video,
            start_time=start_time,
            end_time=end_time,
            description=description,
            confidence_score=1.0,
            is_approved=True,
        )
        return Response(AnnotationClipSerializer(clip).data,
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='update_clip')
    def update_clip(self, request, pk=None):
        video = self.get_object()
        clip_id = request.data.get('clip_id')

        if not clip_id:
            return Response({'error': 'clip_id is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            clip = video.clips.get(id=clip_id)
        except AnnotationClip.DoesNotExist:
            return Response({'error': 'Clip not found'},
                            status=status.HTTP_404_NOT_FOUND)

        if 'start_time' in request.data:
            try:
                clip.start_time = float(request.data['start_time'])
            except (TypeError, ValueError):
                return Response({'error': 'start_time must be a number'},
                                status=status.HTTP_400_BAD_REQUEST)

        if 'end_time' in request.data:
            try:
                clip.end_time = float(request.data['end_time'])
            except (TypeError, ValueError):
                return Response({'error': 'end_time must be a number'},
                                status=status.HTTP_400_BAD_REQUEST)

        if 'description' in request.data:
            clip.description = request.data['description']

        if 'is_approved' in request.data:
            clip.is_approved = bool(request.data['is_approved'])

        if clip.end_time <= clip.start_time:
            return Response({'error': 'end_time must be greater than start_time'},
                            status=status.HTTP_400_BAD_REQUEST)

        clip.save()
        return Response(AnnotationClipSerializer(clip).data)

    @action(detail=True, methods=['post'], url_path='delete_clip')
    def delete_clip(self, request, pk=None):
        video = self.get_object()
        clip_id = request.data.get('clip_id')

        if not clip_id:
            return Response({'error': 'clip_id is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = video.clips.filter(id=clip_id).delete()
        if deleted:
            return Response({'status': 'deleted'})
        return Response({'error': 'Clip not found'},
                        status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='approve_clip')
    def approve_clip(self, request, pk=None):
        video = self.get_object()
        clip_id = request.data.get('clip_id')

        if not clip_id:
            return Response({'error': 'clip_id is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            clip = video.clips.get(id=clip_id)
            clip.is_approved = True
            clip.save()
            return Response({
                'status': 'approved',
                'clip': AnnotationClipSerializer(clip).data,
            })
        except AnnotationClip.DoesNotExist:
            return Response({'error': 'Clip not found'},
                            status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='reprocess')
    def reprocess(self, request, pk=None):
        video = self.get_object()
        video.clips.all().delete()
        video.status = 'completed'
        video.save()
        return Response({'status': 'reprocessed', 'clips': []})

    @action(detail=True, methods=['post'], url_path='auto_annotate')
    def auto_annotate(self, request, pk=None):
        from video_processor.ai_annotator import AIAnnotator

        video = self.get_object()

        if not video.file or not os.path.exists(video.file.path):
            return Response({'error': 'Video file not found'},
                            status=status.HTTP_400_BAD_REQUEST)

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
            return Response({'error': f'AI annotation failed: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ======================================================================
# Profile endpoints
# ======================================================================
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def profile_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(UserProfileSerializer(profile).data)

    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({'error': 'Current password is incorrect'},
                        status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    update_session_auth_hash(request, user)
    return Response({'status': 'password changed'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    user = request.user
    user.delete()
    return Response({'status': 'account deleted'})


# ======================================================================
# Billing endpoints
# ======================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_plan_view(request):
    """
    Simulated plan upgrade.

    ⚠️ IN PRODUCTION: replace this with a Stripe Checkout session + webhook.
    For this portfolio project we accept a plan and a fake card number,
    then immediately upgrade the user.
    """
    plan = request.data.get('plan', '').lower()
    if plan not in ('pro', 'team'):
        return Response({'error': 'Invalid plan. Choose "pro" or "team".'},
                        status=status.HTTP_400_BAD_REQUEST)

    card_number = (request.data.get('card_number') or '').replace(' ', '')
    if len(card_number) < 12:
        return Response({'error': 'Please enter a valid card number.'},
                        status=status.HTTP_400_BAD_REQUEST)

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.plan = plan
    profile.plan_started_at = timezone.now()
    profile.plan_renews_at = timezone.now() + timedelta(days=30)
    profile.has_payment_method = True
    profile.card_brand = 'Visa'  # simulated
    profile.card_last4 = card_number[-4:]
    profile.save()

    return Response({
        'status': 'upgraded',
        'plan': profile.plan,
        'renews_at': profile.plan_renews_at,
        'card_last4': profile.card_last4,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_plan_view(request):
    """Downgrade back to the free plan."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.plan = 'free'
    profile.plan_renews_at = None
    profile.has_payment_method = False
    profile.card_brand = ''
    profile.card_last4 = ''
    profile.save()
    return Response({'status': 'cancelled', 'plan': 'free'})