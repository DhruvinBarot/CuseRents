from django.urls import path
from .views import CreatePaymentIntentView

urlpatterns = [
    path('create-payment-intent/', CreatePaymentIntentView.as_view()),
]