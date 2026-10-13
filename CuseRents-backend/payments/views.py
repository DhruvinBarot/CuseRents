import stripe
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from bookings.models import Booking
from . import stripe_ops


def _renter_booking(request):
    return Booking.objects.filter(id=request.data.get('booking_id'), renter=request.user).first()


class CreatePaymentIntentView(APIView):
    """POST {booking_id} -> client secret for the booking's authorization."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking = _renter_booking(request)
        if not booking:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        try:
            intent = stripe_ops.create_authorization(booking)
        except stripe_ops.PaymentError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.StripeError as e:
            return Response({'error': e.user_message or 'Payment provider error'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({'clientSecret': intent.client_secret})


class ConfirmPaymentView(APIView):
    """POST {booking_id} after the card is confirmed; status is re-read from Stripe, never trusted from the client."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking = _renter_booking(request)
        if not booking or not booking.stripe_payment_id:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        try:
            intent = stripe_ops._client().PaymentIntent.retrieve(booking.stripe_payment_id)
        except stripe.error.StripeError:
            return Response({'error': 'Could not verify payment'}, status=status.HTTP_502_BAD_GATEWAY)
        booking = stripe_ops.sync_from_intent(intent)
        if booking.status != 'pending':
            return Response({'error': 'Payment was not authorized'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'booking_code': booking.booking_code, 'booking_id': booking.id, 'status': booking.status})


class StripeWebhookView(APIView):
    """Backup path for payment updates (e.g. renter closed the tab before confirm ran)."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            event = stripe.Webhook.construct_event(
                request.body, request.META.get('HTTP_STRIPE_SIGNATURE', ''), settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if event['type'].startswith('payment_intent.'):
            stripe_ops.sync_from_intent(event['data']['object'])
        return Response({'received': True})


class ConnectOnboardView(APIView):
    """POST -> Stripe-hosted onboarding URL so an owner can receive payouts."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            return Response({'url': stripe_ops.onboarding_link(request.user)})
        except stripe.error.StripeError as e:
            return Response({'error': e.user_message or 'Could not start payout setup'}, status=status.HTTP_502_BAD_GATEWAY)


class ConnectStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ready = stripe_ops.owner_can_receive(request.user)
        except stripe.error.StripeError:
            ready = False
        return Response({'started': bool(request.user.stripe_account_id), 'payouts_ready': ready})
