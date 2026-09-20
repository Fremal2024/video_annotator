from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as media_serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Serve uploaded media files in BOTH development and production.
# NOTE: This is fine for an app on Render's free tier,
urlpatterns += [
    re_path(
        r'^media/(?P<path>.*)$',
        media_serve,
        {'document_root': settings.MEDIA_ROOT},
    ),
]

# Serve static files in development only
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)