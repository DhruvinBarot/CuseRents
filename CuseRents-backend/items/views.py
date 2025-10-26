from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django.db.models import Q
from .models import Item, ItemVideo, Bundle
from .serializers import (
    ItemListSerializer, ItemDetailSerializer, 
    ItemCreateUpdateSerializer, BundleSerializer
)
import math

class ItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for items with map search functionality and CRUD operations
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['created_at', 'price_per_hour', 'rating_avg']
    
    def get_queryset(self):
        """Get items queryset"""
        return Item.objects.select_related('owner').prefetch_related('videos')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list' or self.action == 'search':
            return ItemListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ItemCreateUpdateSerializer
        return ItemDetailSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def perform_create(self, serializer):
        """Set owner to current user when creating item"""
        serializer.save(owner=self.request.user)
    
    def perform_update(self, serializer):
        """Only allow owner to update their items"""
        item = self.get_object()
        if item.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own items")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only allow owner to delete their items"""
        if instance.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own items")
        instance.delete()
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        Map-based search endpoint
        Query params:
        - lat (required): User latitude
        - lng (required): User longitude
        - radius (optional): Search radius in km (default: 5)
        - category (optional): Filter by category
        - min_price (optional): Minimum price per hour
        - max_price (optional): Maximum price per hour
        - available (optional): Only available items (default: true)
        """
        # Get and validate parameters
        try:
            user_lat = float(request.query_params.get('lat'))
            user_lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return Response(
                {'error': 'Valid lat and lng parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        radius = float(request.query_params.get('radius', 50))  # Default 5km
        category = request.query_params.get('category')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        available_only = request.query_params.get('available', 'true').lower() == 'true'
        
        # Start with base queryset
        queryset = self.get_queryset()
        
        # Filter by availability
        if available_only:
            queryset = queryset.filter(is_available=True)
        
        # Filter by category
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by price range
        if min_price:
            queryset = queryset.filter(price_per_hour__gte=float(min_price))
        if max_price:
            queryset = queryset.filter(price_per_hour__lte=float(max_price))
        
        # Calculate distances and filter by radius
        items_with_distance = []
        distances = {}
        
        for item in queryset:
            distance = self._calculate_distance(
                user_lat, user_lng, 
                item.lat, item.lng
            )
            
            if distance <= radius:
                items_with_distance.append((item, distance))
                distances[item.id] = distance
        
        # Sort by distance
        items_with_distance.sort(key=lambda x: x[1])
        sorted_items = [item for item, _ in items_with_distance]
        
        # Paginate results
        page = self.paginate_queryset(sorted_items)
        if page is not None:
            serializer = self.get_serializer(
                page, 
                many=True, 
                context={'distances': distances}
            )
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(
            sorted_items, 
            many=True, 
            context={'distances': distances}
        )
        
        return Response({
            'count': len(sorted_items),
            'results': serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """Get single item with distance calculation"""
        instance = self.get_object()
        
        # Get user location if provided
        user_lat = request.query_params.get('user_lat')
        user_lng = request.query_params.get('user_lng')
        
        context = {'request': request}
        if user_lat and user_lng:
            try:
                context['user_lat'] = float(user_lat)
                context['user_lng'] = float(user_lng)
            except (TypeError, ValueError):
                pass
        
        serializer = self.get_serializer(instance, context=context)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def directions(self, request, pk=None):
        """
        Get Google Maps directions URL to item location
        """
        item = self.get_object()
        user_lat = request.query_params.get('lat')
        user_lng = request.query_params.get('lng')
        
        if not user_lat or not user_lng:
            return Response(
                {'error': 'lat and lng parameters required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        directions_url = (
            f"https://www.google.com/maps/dir/?api=1"
            f"&origin={user_lat},{user_lng}"
            f"&destination={item.lat},{item.lng}"
        )
        
        return Response({
            'directions_url': directions_url,
            'destination': {
                'address': item.address_text,
                'lat': item.lat,
                'lng': item.lng
            }
        })
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of available categories"""
        return Response({
            'categories': [
                {'value': choice[0], 'label': choice[1]}
                for choice in Item.CATEGORY_CHOICES
            ]
        })
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """
        Quick nearby items endpoint (uses 1km radius)
        """
        try:
            user_lat = float(request.query_params.get('lat'))
            user_lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return Response(
                {'error': 'Valid lat and lng parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use 1km radius for "nearby"
        queryset = self.get_queryset().filter(is_available=True)
        
        nearby_items = []
        distances = {}
        
        for item in queryset:
            distance = self._calculate_distance(
                user_lat, user_lng, 
                item.lat, item.lng
            )
            
            if distance <= 1.0:  # 1km radius
                nearby_items.append((item, distance))
                distances[item.id] = distance
        
        # Sort by distance
        nearby_items.sort(key=lambda x: x[1])
        sorted_items = [item for item, _ in nearby_items][:10]  # Top 10
        
        serializer = self.get_serializer(
            sorted_items, 
            many=True, 
            context={'distances': distances}
        )
        
        return Response(serializer.data)
    
    @staticmethod
    def _calculate_distance(lat1, lng1, lat2, lng2):
        """
        Calculate distance using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        distance = R * c
        return round(distance, 2)


class BundleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for bundles (read-only for now)
    """
    queryset = Bundle.objects.filter(is_active=True)
    serializer_class = BundleSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Get active bundles"""
        return Bundle.objects.filter(
            is_active=True
        ).select_related('creator').prefetch_related('bundle_items__item')