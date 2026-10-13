from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Login/register live in users.urls (rate limited); only token refresh is needed here.
    # Removed unused duplicate auth routes (simplejwt obtain/verify, dj-rest-auth, allauth google, api-auth)
    # so they can't be used to bypass the login throttle.
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App URLs
    path('api/users/', include('users.urls')),
    path('api/items/', include('items.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/rewards/', include('rewards.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Customize admin site
admin.site.site_header = "CuseRents Administration"
admin.site.site_title = "CuseRents Admin"
admin.site.index_title = "Welcome to CuseRents Admin Portal"
