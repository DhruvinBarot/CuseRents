from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from items.models import Item

User = get_user_model()


class SeedDemoItemsTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user('dhruv', 'd@example.com', 'x')

    def seed(self, **kwargs):
        call_command('seed_demo_items', owner='dhruv', photo_base='https://site.test/', stdout=StringIO(), **kwargs)

    def test_creates_five_items_with_photos_for_owner(self):
        self.seed()
        items = Item.objects.filter(owner=self.owner)
        self.assertEqual(items.count(), 5)
        self.assertEqual(items.get(title='Instant Pot Duo').photo_url, 'https://site.test/images/items/instant-pot.webp')

    def test_rerun_does_not_duplicate_or_overwrite_edits(self):
        self.seed()
        Item.objects.filter(title='Picnic Kit').update(price_per_hour='4.00')
        self.seed()
        self.assertEqual(Item.objects.filter(owner=self.owner).count(), 5)
        self.assertEqual(str(Item.objects.get(title='Picnic Kit').price_per_hour), '4.00')

    def test_fills_missing_photo_on_existing_listing(self):
        Item.objects.create(owner=self.owner, title='picnic kit', description='x', category='party',
                            price_per_hour='1.00', address_text='x', lat=43.0, lng=-76.1)
        self.seed()
        self.assertEqual(Item.objects.filter(owner=self.owner, title__iexact='picnic kit').count(), 1)
        self.assertTrue(Item.objects.get(title='picnic kit').photo_url.endswith('picnic-kit.webp'))

    def test_unknown_owner_fails_clearly(self):
        with self.assertRaisesMessage(CommandError, "No user named 'nobody'"):
            call_command('seed_demo_items', owner='nobody', stdout=StringIO())


class ApproximateLocationTests(TestCase):
    """Public responses never reveal the exact pickup spot; owners and accepted renters do see it."""

    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.owner = User.objects.create_user('owner', 'o@example.com', 'x')
        self.renter = User.objects.create_user('renter', 'r@example.com', 'x')
        self.item = Item.objects.create(owner=self.owner, title='Drill', description='x', category='tools',
                                        price_per_hour='3.00', address_text='310 Montgomery St, Syracuse, NY 13202',
                                        lat=43.0510, lng=-76.1450, google_place_id='secret-place')

    def meters_from_exact(self, data):
        from items.views import ItemViewSet
        return ItemViewSet._calculate_distance(self.item.lat, self.item.lng, data['lat'], data['lng']) * 1000

    def test_search_shows_approximate_pin_and_street_only(self):
        res = self.client.get('/api/items/items/search/', {'lat': 43.0481, 'lng': -76.1474, 'radius': 20, 'page_size': 500})
        data = res.json()['results'][0]
        self.assertTrue(95 <= self.meters_from_exact(data) <= 255)
        self.assertEqual(data['address_text'], 'Montgomery St, Syracuse, NY 13202')
        # same pin on every request, so it can't be averaged out
        again = self.client.get('/api/items/items/search/', {'lat': 43.0, 'lng': -76.0, 'radius': 50}).json()['results'][0]
        self.assertEqual((data['lat'], data['lng']), (again['lat'], again['lng']))

    def test_detail_hides_exact_spot_from_others(self):
        self.client.force_authenticate(self.renter)
        data = self.client.get(f'/api/items/items/{self.item.id}/', {'user_lat': 43.0481, 'user_lng': -76.1474}).json()
        self.assertNotEqual((data['lat'], data['lng']), (self.item.lat, self.item.lng))
        self.assertIsNone(data['google_place_id'])
        self.assertIsNone(data['directions_url'])

    def test_owner_sees_exact_spot_on_own_listings(self):
        self.client.force_authenticate(self.owner)
        data = self.client.get('/api/items/items/', {'mine': 'true'}).json()['results'][0]
        self.assertEqual((data['lat'], data['lng'], data['address_text']),
                         (self.item.lat, self.item.lng, self.item.address_text))

    def test_renter_gets_exact_pickup_only_after_owner_accepts(self):
        from datetime import timedelta
        from django.utils import timezone
        from bookings.models import Booking
        start = timezone.now() + timedelta(days=1)
        booking = Booking.objects.create(item=self.item, renter=self.renter, start_time=start,
                                         end_time=start + timedelta(hours=2), total_price=6, status='pending')
        self.client.force_authenticate(self.renter)
        item = self.client.get(f'/api/bookings/bookings/{booking.id}/').json()['item']
        self.assertEqual(item['address_text'], 'Montgomery St, Syracuse, NY 13202')
        booking.status = 'accepted'
        booking.save()
        item = self.client.get(f'/api/bookings/bookings/{booking.id}/').json()['item']
        self.assertEqual((item['lat'], item['address_text']), (self.item.lat, self.item.address_text))
