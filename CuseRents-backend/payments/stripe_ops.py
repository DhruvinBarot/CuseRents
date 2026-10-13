"""
Stripe Connect money flow (destination charges, one PaymentIntent per booking):

  booking requested  -> authorize rental + deposit (capture_method=manual), funds destined to owner
  owner rejects      -> cancel the authorization (renter never charged)
  item returned      -> capture rental only; deposit part of the hold is released
  damage reported    -> capture rental + deposit
The platform fee is taken from the rental via application_fee_amount.
"""
from decimal import Decimal
import stripe
from django.conf import settings


class PaymentError(Exception):
    pass


def _client():
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def cents(amount):
    return int((Decimal(amount) * 100).quantize(Decimal('1')))


def owner_can_receive(user):
    if not user.stripe_account_id:
        return False
    account = _client().Account.retrieve(user.stripe_account_id)
    return account.capabilities.get('transfers') == 'active'


def create_authorization(booking):
    """Create (or reuse) the PaymentIntent for a booking; amount always computed server-side."""
    if booking.status != 'awaiting_payment':
        raise PaymentError('This booking is not awaiting payment')
    owner = booking.owner
    if not owner_can_receive(owner):
        raise PaymentError("The owner hasn't finished setting up payouts yet, so this item can't be paid for.")
    s = _client()
    if booking.stripe_payment_id:
        return s.PaymentIntent.retrieve(booking.stripe_payment_id)
    rental = cents(booking.total_price)
    intent = s.PaymentIntent.create(
        amount=rental + cents(booking.deposit_amount),
        currency='usd',
        capture_method='manual',
        payment_method_types=['card'],
        application_fee_amount=rental * settings.PLATFORM_FEE_PERCENT // 100,
        transfer_data={'destination': owner.stripe_account_id},
        metadata={'booking_id': booking.id, 'booking_code': booking.booking_code},
    )
    booking.stripe_payment_id = intent.id
    booking.save(update_fields=['stripe_payment_id', 'updated_at'])
    return intent


def sync_from_intent(intent):
    """Apply Stripe's view of the payment to the booking. Used by the confirm endpoint and the webhook."""
    from bookings.models import Booking
    booking = Booking.objects.filter(stripe_payment_id=intent.id).first()
    if not booking:
        return None
    if intent.status == 'requires_capture' and booking.status == 'awaiting_payment':
        booking.status = 'pending'  # card authorized, now waiting for owner approval
        booking.save(update_fields=['status', 'updated_at'])
        from bookings.emails import notify
        notify(booking, 'requested')
    elif intent.status == 'canceled' and booking.status in ('awaiting_payment', 'pending', 'accepted'):
        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])
    return booking


def release(booking):
    """Cancel the authorization (owner rejected / booking cancelled before pickup)."""
    if booking.stripe_payment_id:
        _client().PaymentIntent.cancel(booking.stripe_payment_id)


def capture(booking, include_deposit=False):
    """Charge the renter: rental only, or rental + deposit when damage is reported."""
    amount = cents(booking.total_price) + (cents(booking.deposit_amount) if include_deposit else 0)
    return _client().PaymentIntent.capture(booking.stripe_payment_id, amount_to_capture=amount)


def onboarding_link(user):
    s = _client()
    if not user.stripe_account_id:
        account = s.Account.create(
            type='express', email=user.email,
            capabilities={'card_payments': {'requested': True}, 'transfers': {'requested': True}},
        )
        user.stripe_account_id = account.id
        user.save(update_fields=['stripe_account_id'])
    link = s.AccountLink.create(
        account=user.stripe_account_id, type='account_onboarding',
        refresh_url=f'{settings.FRONTEND_URL}/?payouts=refresh',
        return_url=f'{settings.FRONTEND_URL}/?payouts=done',
    )
    return link.url
