from django.urls import path
from . import views

urlpatterns = [
    path('create-intent/', views.CreatePaymentIntentView.as_view()),
    path('confirm/', views.ConfirmPaymentView.as_view()),
    path('webhook/', views.StripeWebhookView.as_view()),
    path('connect/onboard/', views.ConnectOnboardView.as_view()),
    path('connect/status/', views.ConnectStatusView.as_view()),
]
