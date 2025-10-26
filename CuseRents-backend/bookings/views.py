from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Booking
from .serializers import (
    BookingListSerializer,
    BookingCreateSerializer,
    BookingDetailSerializer
)

class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bookings
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get bookings for current user (as renter or owner)"""
        user = self.request.user
        return Booking.objects.filter(
            Q(renter=user) | Q(item__owner=user)
        ).select_related('item', 'renter', 'item__owner').order_by('-created_at')
    
    def get_serializer_class(self):
        """Return appropriate serializer"""
        if self.action == 'create':
            return BookingCreateSerializer
        elif self.action == 'retrieve':
            return BookingDetailSerializer
        return BookingListSerializer
    
    def create(self, request, *args, **kwargs):
        """Create booking and return booking code prominently"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        
        return Response({
            'booking_code': booking.booking_code,
            'message': 'Booking request created successfully',
            'booking': BookingDetailSerializer(booking).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Owner accepts booking request"""
        booking = self.get_object()
        
        # Only owner can accept
        if booking.item.owner != request.user:
            return Response(
                {'error': 'Only the item owner can accept this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Can only accept pending bookings
        if booking.status != 'pending':
            return Response(
                {'error': f'Cannot accept booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Accept booking
        booking.status = 'accepted'
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response({
            'message': 'Booking accepted successfully',
            'booking': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Owner rejects booking request"""
        booking = self.get_object()
        
        # Only owner can reject
        if booking.item.owner != request.user:
            return Response(
                {'error': 'Only the item owner can reject this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Can only reject pending bookings
        if booking.status != 'pending':
            return Response(
                {'error': f'Cannot reject booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reject booking
        booking.status = 'cancelled'
        booking.save()
        
        return Response({
            'message': 'Booking rejected'
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark booking as completed (after return)"""
        booking = self.get_object()
        
        # Only owner can mark complete
        if booking.item.owner != request.user:
            return Response(
                {'error': 'Only the item owner can complete this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Can only complete active bookings
        if booking.status != 'active':
            return Response(
                {'error': 'Only active bookings can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as completed
        booking.mark_completed()
        
        # Award reward points
        renter_points, owner_points = booking.calculate_reward_points()
        
        # Update wallets
        booking.renter.wallet.add_points(renter_points)
        booking.item.owner.wallet.add_points(owner_points)
        booking.item.owner.wallet.add_balance(booking.total_price - booking.wallet_credit_used)
        booking.item.owner.wallet.lifetime_earned += booking.total_price
        booking.item.owner.wallet.save()
        
        # Update CO2 saved
        booking.renter.add_co2_saved(booking.item.carbon_offset_kg)
        
        serializer = self.get_serializer(booking)
        return Response({
            'message': 'Booking completed successfully',
            'booking': serializer.data,
            'rewards': {
                'renter_points': renter_points,
                'owner_points': owner_points
            }
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Mark booking as active (pickup confirmed)"""
        booking = self.get_object()
        
        # Owner or renter can activate
        if booking.item.owner != request.user and booking.renter != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'accepted':
            return Response(
                {'error': 'Only accepted bookings can be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.mark_active()
        
        serializer = self.get_serializer(booking)
        return Response({
            'message': 'Booking activated - rental started',
            'booking': serializer.data
        })