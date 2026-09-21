from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    VideoViewSet,
    profile_view,
    change_password_view,
    delete_account_view,
)
from . import auth_views

router = DefaultRouter()
router.register(r'videos', VideoViewSet, basename='video')

urlpatterns = router.urls + [
    # Auth
    path('auth/register/', auth_views.register, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', auth_views.current_user, name='current_user'),

    # Profile
    path('profile/', profile_view, name='profile'),
    path('profile/change-password/', change_password_view, name='change_password'),
    path('profile/delete/', delete_account_view, name='delete_account'),
]