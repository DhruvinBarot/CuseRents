from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Booking
from payments import stripe_ops
from .emails import notify
import stripe
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
        # Owners only see requests once the renter's card is authorized
        return Booking.objects.filter(
            Q(renter=user) | (Q(item__owner=user) & ~Q(status='awaiting_payment'))
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
        notify(booking, 'accepted')
        
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
        
        # Release the renter's card authorization, then reject
        try:
            stripe_ops.release(booking)
        except stripe.error.StripeError:
            return Response({'error': 'Could not release the payment hold, try again'}, status=status.HTTP_502_BAD_GATEWAY)
        booking.status = 'cancelled'
        booking.save()
        notify(booking, 'rejected')
        
        return Response({
            'message': 'Booking rejected'
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Renter cancels before pickup; the card authorization is released"""
        booking = self.get_object()
        if booking.renter != request.user:
            return Response({'error': 'Only the renter can cancel this booking'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status not in ('awaiting_payment', 'pending', 'accepted'):
            return Response({'error': f'Cannot cancel booking with status: {booking.status}'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            stripe_ops.release(booking)
        except stripe.error.StripeError:
            return Response({'error': 'Could not release the payment hold, try again'}, status=status.HTTP_502_BAD_GATEWAY)
        was_visible_to_owner = booking.status != 'awaiting_payment'
        booking.status = 'cancelled'
        booking.save()
        if was_visible_to_owner:
            notify(booking, 'cancelled')
        return Response({'message': 'Booking cancelled'})
    
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
        
        # Charge the renter before anything is credited; damage also captures the deposit
        damage = bool(request.data.get('damage_reported'))
        if booking.stripe_payment_id:  # shortcut: demo bookings made before Stripe have no payment to capture
            try:
                stripe_ops.capture(booking, include_deposit=damage)
            except stripe.error.StripeError as e:
                return Response({'error': e.user_message or 'Could not capture payment'}, status=status.HTTP_502_BAD_GATEWAY)
        if damage:
            booking.damage_reported = True
            booking.save(update_fields=['damage_reported'])
        
        # Mark as completed
        booking.mark_completed()
        
        # Award reward points
        renter_points, owner_points = booking.calculate_reward_points()
        
        # Update wallets
        booking.renter.wallet.add_points(renter_points)
        booking.item.owner.wallet.add_points(owner_points)
        booking.item.owner.wallet.lifetime_earned += booking.total_price
        booking.item.owner.wallet.save()
        
        # Update CO2 saved
        booking.renter.add_co2_saved(booking.item.carbon_offset_kg)
        notify(booking, 'completed')
        
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