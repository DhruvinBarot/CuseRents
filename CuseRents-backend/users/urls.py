from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Profile endpoints (will implement in next stage)
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/<int:pk>/', views.PublicProfileView.as_view(), name='public-profile'),
]