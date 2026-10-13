from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch
from django.utils import timezone
from rest_framework.test import APITestCase
from bookings.models import Booking
from bookings.tests import fake_stripe
from items.models import Item
from users.models import User


class PaymentTests(APITestCase):
    def setUp(self):
        self.stripe = fake_stripe()
        patcher = patch('payments.stripe_ops._client', return_value=self.stripe)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.owner = User.objects.create_user('owner', 'o@example.com', 'x', stripe_account_id='acct_owner')
        self.renter = User.objects.create_user('renter', 'r@example.com', 'x')
        item = Item.objects.create(owner=self.owner, title='Drill', description='', category='tools',
                                   price_per_hour=3, deposit=50, address_text='Syracuse',
                                   lat=43.0, lng=-76.1, photo_url='https://example.com/d.jpg')
        start = timezone.now() + timedelta(hours=1)
        self.booking = Booking.objects.create(item=item, renter=self.renter, start_time=start,
                                              end_time=start + timedelta(hours=2), total_price=6,
                                              deposit_amount=50, status='awaiting_payment')

    def authorize(self):
        self.client.force_authenticate(self.renter)
        self.client.post('/api/payments/create-intent/', {'booking_id': self.booking.id})
        self.client.post('/api/payments/confirm/', {'booking_id': self.booking.id})
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'pending')

    def test_owner_reject_releases_hold(self):
        self.authorize()
        self.client.force_authenticate(self.owner)
        self.client.post(f'/api/bookings/bookings/{self.booking.id}/reject/')
        self.stripe.PaymentIntent.cancel.assert_called_once_with('pi_123')
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')

    def test_damage_captures_deposit_too(self):
        self.authorize()
        self.client.force_authenticate(self.owner)
        self.client.post(f'/api/bookings/bookings/{self.booking.id}/accept/')
        self.client.post(f'/api/bookings/bookings/{self.booking.id}/activate/')
        self.client.post(f'/api/bookings/bookings/{self.booking.id}/complete/', {'damage_reported': True})
        self.stripe.PaymentIntent.capture.assert_called_once_with('pi_123', amount_to_capture=5600)

    def test_failed_capture_does_not_complete(self):
        import stripe
        self.authorize()
        self.stripe.PaymentIntent.capture.side_effect = stripe.error.CardError('declined', None, 'card_declined')
        self.client.force_authenticate(self.owner)
        self.client.post(f'/api/bookings/bookings/{self.booking.id}/accept/')
        self.client.post(f'/api/bookings/bookings/{self.booking.id}/activate/')
        res = self.client.post(f'/api/bookings/bookings/{self.booking.id}/complete/')
        self.assertEqual(res.status_code, 502)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'active')

    def test_owner_without_payouts_cannot_be_paid(self):
        self.stripe.Account.retrieve.return_value = SimpleNamespace(capabilities={'transfers': 'inactive'})
        self.client.force_authenticate(self.renter)
        res = self.client.post('/api/payments/create-intent/', {'booking_id': self.booking.id})
        self.assertEqual(res.status_code, 400)
        self.stripe.PaymentIntent.create.assert_not_called()

    def test_cannot_pay_for_someone_elses_booking(self):
        self.client.force_authenticate(self.owner)
        res = self.client.post('/api/payments/create-intent/', {'booking_id': self.booking.id})
        self.assertEqual(res.status_code, 404)

    def test_unauthorized_card_is_not_confirmed(self):
        self.stripe.PaymentIntent.retrieve.return_value = SimpleNamespace(id='pi_123', status='requires_payment_method')
        self.client.force_authenticate(self.renter)
        self.client.post('/api/payments/create-intent/', {'booking_id': self.booking.id})
        res = self.client.post('/api/payments/confirm/', {'booking_id': self.booking.id})
        self.assertEqual(res.status_code, 400)

    def test_webhook_rejects_bad_signature(self):
        res = self.client.post('/api/payments/webhook/', '{}', content_type='application/json',
                               HTTP_STRIPE_SIGNATURE='t=1,v1=bad')
        self.assertEqual(res.status_code, 400)

    def test_webhook_authorizes_booking(self):
        self.booking.stripe_payment_id = 'pi_123'
        self.booking.save()
        event = {'type': 'payment_intent.amount_capturable_updated',
                 'data': {'object': SimpleNamespace(id='pi_123', status='requires_capture')}}
        with patch('stripe.Webhook.construct_event', return_value=event):
            res = self.client.post('/api/payments/webhook/', '{}', content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'pending')

    def test_onboarding_creates_v2_account_then_link(self):
        from unittest.mock import MagicMock
        self.stripe.AccountLink.create.return_value = SimpleNamespace(url='https://connect.stripe.com/setup/x')
        fake = MagicMock(status_code=200, content=b'{}')
        fake.json.return_value = {'id': 'acct_new'}
        self.client.force_authenticate(self.renter)
        with patch('payments.stripe_ops.requests.post', return_value=fake) as post:
            res = self.client.post('/api/payments/connect/onboard/')
        self.assertEqual(res.data, {'url': 'https://connect.stripe.com/setup/x'})
        self.assertIn('/v2/core/accounts', post.call_args.args[0])
        self.renter.refresh_from_db()
        self.assertEqual(self.renter.stripe_account_id, 'acct_new')

    def test_onboarding_surfaces_stripe_rejection(self):
        from unittest.mock import MagicMock
        fake = MagicMock(status_code=400, content=b'{}')
        fake.json.return_value = {'error': {'message': 'nope'}}
        self.client.force_authenticate(self.renter)
        with patch('payments.stripe_ops.requests.post', return_value=fake):
            res = self.client.post('/api/payments/connect/onboard/')
        self.assertEqual((res.status_code, res.data['error']), (502, 'nope'))
        self.renter.refresh_from_db()
        self.assertEqual(self.renter.stripe_account_id, '')
