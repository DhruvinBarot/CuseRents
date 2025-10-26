from rest_framework import serializers
from .models import Booking
from items.models import Item
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class BookingItemSerializer(serializers.ModelSerializer):
    """Simplified item serializer for bookings"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Item
        fields = ['id', 'title', 'category', 'price_per_hour', 'price_per_day', 
                  'deposit', 'photo_url', 'address_text', 'lat', 'lng', 'owner_username']

class BookingRenterSerializer(serializers.ModelSerializer):
    """Simplified user serializer for booking renter"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 'rating_avg']

class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for listing bookings"""
    item = BookingItemSerializer(read_only=True)
    renter = BookingRenterSerializer(read_only=True)
    owner = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_code', 'item', 'renter', 'owner',
            'start_time', 'end_time', 'duration_hours',
            'total_price', 'deposit_amount', 'wallet_credit_used',
            'reward_points_earned', 'status', 'is_overdue',
            'created_at', 'updated_at'
        ]
    
    def get_owner(self, obj):
        """Get item owner info"""
        if obj.owner:
            return {
                'id': obj.owner.id,
                'username': obj.owner.username,
                'email': obj.owner.email
            }
        return None
    
    def get_duration_hours(self, obj):
        """Get booking duration in hours"""
        return obj.duration_hours
    
    def get_is_overdue(self, obj):
        """Check if booking is overdue"""
        return obj.is_overdue

class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings"""
    item_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Booking
        fields = ['item_id', 'start_time', 'end_time', 'wallet_credit_used']
    
    def validate(self, data):
        """Validate booking data"""
        # Check if item exists
        try:
            item = Item.objects.get(id=data['item_id'])
        except Item.DoesNotExist:
            raise serializers.ValidationError("Item not found")
        
        # Check if item is available
        if not item.is_available:
            raise serializers.ValidationError("Item is not available")
        
        # Check if user is trying to book their own item
        request = self.context.get('request')
        if item.owner == request.user:
            raise serializers.ValidationError("You cannot book your own item")
        
        # Validate times
        start_time = data['start_time']
        end_time = data['end_time']
        
        if start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time")
        
        if start_time < timezone.now():
            raise serializers.ValidationError("Start time cannot be in the past")
        
        # Check for overlapping bookings
        overlapping = Booking.objects.filter(
            item=item,
            status__in=['pending', 'accepted', 'active']
        ).filter(
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()
        
        if overlapping:
            raise serializers.ValidationError("Item is already booked for this time period")
        
        data['item'] = item
        return data
    
    def create(self, validated_data):
        """Create booking with calculated pricing"""
        item = validated_data.pop('item')
        item_id = validated_data.pop('item_id')
        
        # Calculate duration
        duration = validated_data['end_time'] - validated_data['start_time']
        hours = duration.total_seconds() / 3600
        days = hours / 24
        
        # Calculate pricing (use cheaper option)
        hourly_price = float(item.price_per_hour) * hours
        daily_price = float(item.price_per_day) * days if item.price_per_day else float('inf')
        
        total_price = min(hourly_price, daily_price)
        
        # Calculate reward points (10 points per $1)
        reward_points = int(total_price * 10)
        
        # Create booking
        booking = Booking.objects.create(
            item=item,
            renter=self.context['request'].user,
            start_time=validated_data['start_time'],
            end_time=validated_data['end_time'],
            total_price=total_price,
            deposit_amount=item.deposit,
            wallet_credit_used=validated_data.get('wallet_credit_used', 0),
            reward_points_earned=reward_points,
            status='pending'
        )
        
        return booking

class BookingDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single booking"""
    item = BookingItemSerializer(read_only=True)
    renter = BookingRenterSerializer(read_only=True)
    owner = serializers.SerializerMethodField()
    duration_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_code', 'item', 'renter', 'owner',
            'start_time', 'end_time', 'actual_return_time', 'duration_hours',
            'total_price', 'deposit_amount', 'wallet_credit_used', 'late_fee',
            'reward_points_earned', 'status',
            'condition_at_pickup', 'condition_at_return', 'damage_reported',
            'created_at', 'updated_at'
        ]
    
    def get_owner(self, obj):
        """Get item owner info"""
        if obj.owner:
            return BookingRenterSerializer(obj.owner).data
        return None