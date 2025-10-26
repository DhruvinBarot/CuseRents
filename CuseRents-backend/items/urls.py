from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'items'

router = DefaultRouter()
router.register(r'items', views.ItemViewSet, basename='item')
router.register(r'bundles', views.BundleViewSet, basename='bundle')

urlpatterns = [
    path('', include(router.urls)),
]