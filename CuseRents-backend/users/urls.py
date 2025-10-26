from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/logout/', views.UserLogoutView.as_view(), name='logout'),
    path('auth/me/', views.CurrentUserView.as_view(), name='current-user'),
    
    # Profile endpoints
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/<int:pk>/', views.PublicProfileView.as_view(), name='public-profile'),
]