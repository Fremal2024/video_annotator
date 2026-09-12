from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import VideoViewSet
from . import auth_views

router = DefaultRouter()
router.register(r'videos', VideoViewSet, basename='video')

urlpatterns = router.urls + [
    path('auth/register/', auth_views.register, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', auth_views.current_user, name='current_user'),
]