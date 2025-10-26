from rest_framework import serializers
from .models import Item, ItemVideo, Bundle, BundleItem
from django.contrib.auth import get_user_model

User = get_user_model()

class ItemOwnerSerializer(serializers.ModelSerializer):
    """Simplified user serializer for item owner"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'rating_avg', 'profile_photo']

class ItemVideoSerializer(serializers.ModelSerializer):
    """Serializer for item videos"""
    class Meta:
        model = ItemVideo
        fields = ['id', 'video_url', 'thumbnail_url', 'duration_seconds', 'title', 'view_count']
        read_only_fields = ['view_count']

class ItemListSerializer(serializers.ModelSerializer):
    """
    Serializer for item list view (map search results)
    Includes calculated distance field
    """
    owner = ItemOwnerSerializer(read_only=True)
    distance_km = serializers.SerializerMethodField()
    has_video_demo = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'category', 'price_per_hour', 'price_per_day',
            'deposit', 'photo_url', 'rating_avg', 'total_rentals',
            'lat', 'lng', 'address_text', 'is_available',
            'owner', 'distance_km', 'has_video_demo', 'carbon_offset_kg'
        ]
    
    def get_distance_km(self, obj):
        """Get pre-calculated distance from context"""
        return self.context.get('distances', {}).get(obj.id)
    
    def get_has_video_demo(self, obj):
        """Check if item has video demo"""
        return obj.videos.exists()

class ItemDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for single item view
    """
    owner = ItemOwnerSerializer(read_only=True)
    videos = ItemVideoSerializer(many=True, read_only=True)
    distance_km = serializers.SerializerMethodField()
    directions_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'category',
            'price_per_hour', 'price_per_day', 'deposit',
            'address_text', 'google_place_id', 'lat', 'lng',
            'photo_url', 'additional_photos',
            'is_available', 'carbon_offset_kg',
            'total_rentals', 'rating_avg', 'total_ratings',
            'owner', 'videos', 'distance_km', 'directions_url',
            'created_at', 'updated_at'
        ]
    
    def get_distance_km(self, obj):
        """Get calculated distance"""
        user_lat = self.context.get('user_lat')
        user_lng = self.context.get('user_lng')
        if user_lat and user_lng:
            return obj.calculate_distance(user_lat, user_lng)
        return None
    
    def get_directions_url(self, obj):
        """Generate Google Maps directions URL"""
        user_lat = self.context.get('user_lat')
        user_lng = self.context.get('user_lng')
        if user_lat and user_lng:
            return (
                f"https://www.google.com/maps/dir/?api=1"
                f"&origin={user_lat},{user_lng}"
                f"&destination={obj.lat},{obj.lng}"
            )
        return None

class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating items
    """
    class Meta:
        model = Item
        fields = [
            'title', 'description', 'category',
            'price_per_hour', 'price_per_day', 'deposit',
            'address_text', 'lat', 'lng', 'photo_url',
            'additional_photos', 'is_available', 'carbon_offset_kg'
        ]
    
    def validate(self, data):
        """Validate item data"""
        # Ensure either lat/lng are provided OR address_text for geocoding
        if not (data.get('lat') and data.get('lng')) and not data.get('address_text'):
            raise serializers.ValidationError(
                "Either provide lat/lng coordinates or address_text for geocoding"
            )
        
        # Validate price_per_day is higher than price_per_hour if provided
        if data.get('price_per_day') and data.get('price_per_hour'):
            if data['price_per_day'] <= data['price_per_hour']:
                raise serializers.ValidationError(
                    "Price per day should be higher than price per hour"
                )
        
        return data
    
    def create(self, validated_data):
        """Create item and auto-geocode if needed"""
        # Set owner from request user
        validated_data['owner'] = self.context['request'].user
        
        item = Item.objects.create(**validated_data)
        
        # Auto-geocode if lat/lng not provided
        if not item.lat or not item.lng:
            item.geocode_address()
            item.save()
        
        return item

class BundleItemSerializer(serializers.ModelSerializer):
    """Serializer for items in a bundle"""
    item = ItemListSerializer(read_only=True)
    
    class Meta:
        model = BundleItem
        fields = ['item', 'quantity']

class BundleSerializer(serializers.ModelSerializer):
    """Serializer for bundles"""
    creator = ItemOwnerSerializer(read_only=True)
    bundle_items = BundleItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    total_price_per_hour = serializers.SerializerMethodField()
    
    class Meta:
        model = Bundle
        fields = [
            'id', 'name', 'description', 'discount_percent',
            'is_active', 'total_bookings', 'creator',
            'bundle_items', 'item_count', 'total_price_per_hour',
            'created_at'
        ]
    
    def get_item_count(self, obj):
        """Get number of items in bundle"""
        return obj.bundle_items.count()
    
    def get_total_price_per_hour(self, obj):
        """Calculate total price with discount"""
        return obj.calculate_total_price(hours=1)