from rest_framework import serializers
from bookings.models import Booking
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(write_only=True)
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'booking_id', 'stars', 'text', 'reviewer_username', 'created_at']

    def validate(self, data):
        user = self.context['request'].user
        booking = Booking.objects.filter(id=data['booking_id'], status='completed').select_related('item__owner').first()
        if not booking or user not in (booking.renter, booking.owner):
            raise serializers.ValidationError('You can only review your own completed rentals')
        # Renter reviews the item + owner; owner reviews the renter
        reviewee = booking.owner if user == booking.renter else booking.renter
        if Review.objects.filter(booking=booking, reviewer=user).exists():
            raise serializers.ValidationError('You already reviewed this rental')
        data.update(booking=booking, reviewee=reviewee, item=booking.item if user == booking.renter else None)
        return data

    def create(self, validated_data):
        validated_data.pop('booking_id')
        return Review.objects.create(reviewer=self.context['request'].user, **validated_data)
