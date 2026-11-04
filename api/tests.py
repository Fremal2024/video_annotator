from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from unittest.mock import patch
from .models import Video, UserProfile, AnnotationClip

@override_settings(DEFAULT_FILE_STORAGE='django.core.files.storage.FileSystemStorage')
class VideoAPITestCase(TestCase):
    def setUp(self):
        # Create a test user
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.profile = self.user.profile
        
        # Authenticate the client
        self.client.force_authenticate(user=self.user)

        # Create a dummy video file
        self.dummy_video = SimpleUploadedFile(
            "test_video.mp4", 
            b"dummy video content", 
            content_type="video/mp4"
        )

    def test_unauthenticated_user_cannot_upload(self):
        """Test that anonymous users get a 401 error."""
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/videos/', {'title': 'Test', 'file': self.dummy_video})
        self.assertEqual(response.status_code, 401)

    @patch('cv2.VideoCapture')
    def test_create_video(self, mock_cv2):
        """Test that an authenticated user can upload a video."""
        mock_cv2.return_value.get.side_effect = [25.0, 250.0] 
        
        response = self.client.post('/api/videos/', {
            'title': 'My Test Video',
            'file': self.dummy_video
        }, format='multipart')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(Video.objects.first().user, self.user)

    @patch('cv2.VideoCapture')
    def test_free_plan_limit(self, mock_cv2):
        """Test that a free user cannot upload more than 5 videos."""
        mock_cv2.return_value.get.side_effect = [25.0, 250.0] 
        
        for i in range(5):
            Video.objects.create(user=self.user, title=f'Vid {i}')
        
        response = self.client.post('/api/videos/', {
            'title': 'Vid 6',
            'file': self.dummy_video
        }, format='multipart')
        
        self.assertEqual(response.status_code, 402) 
        self.assertEqual(Video.objects.count(), 5)

    def test_add_and_delete_clip(self):
        """Test adding and deleting an annotation clip."""
        video = Video.objects.create(user=self.user, title='Test Vid')
        
        response = self.client.post(f'/api/videos/{video.id}/add_clip/', {
            'start_time': 0.0,
            'end_time': 10.5,
            'description': 'A test scene'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(video.clips.count(), 1)
        
        clip_id = response.data['id']
        
        response = self.client.post(f'/api/videos/{video.id}/delete_clip/', {
            'clip_id': clip_id
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(video.clips.count(), 0)

    @patch('os.path.exists', return_value=True)
    @patch('video_processor.ai_annotator.AIAnnotator.annotate')
    def test_auto_annotate_endpoint(self, mock_annotate, mock_exists):
        """Test the AI auto-annotate endpoint (mocking the Gemini AI)."""
        mock_annotate.return_value = [
            {'start_time': 0.0, 'end_time': 10.0, 'description': 'AI Scene 1', 'confidence_score': 0.9}
        ]
        
        video = Video.objects.create(
            user=self.user, 
            title='Test Vid', 
            status='completed',
            file=self.dummy_video
        )
        
        response = self.client.post(f'/api/videos/{video.id}/auto_annotate/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['clips_created'], 1)
        self.assertEqual(video.clips.count(), 1)
        self.assertEqual(video.clips.first().description, 'AI Scene 1')