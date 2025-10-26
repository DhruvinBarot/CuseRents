from django.urls import path, include

urlpatterns = [
    # ... your other urls
    path('api/payments/', include('payments.urls')),
]