from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APITestCase


class BookingFlowTest(APITestCase):
    """Full rental lifecycle through the same endpoints the frontend calls."""

    def register(self, username):
        res = self.client.post('/api/users/auth/register/', {
            'username': username, 'email': f'{username}@example.com',
            'password': 'Sup3r-secret-pw', 'password_confirm': 'Sup3r-secret-pw',
            'first_name': username, 'last_name': 'Test',
        })
        self.assertEqual(res.status_code, 201, res.data)
        return res.data['tokens']['access']

    def as_user(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_full_lifecycle(self):
        owner, renter = self.register('owner'), self.register('renter')

        self.as_user(owner)
        res = self.client.post('/api/items/items/', {
            'title': 'Drill', 'description': 'Cordless', 'category': 'tools',
            'price_per_hour': '3.00', 'price_per_day': '20.00', 'deposit': '50.00',
            'address_text': 'Syracuse, NY', 'lat': 43.04, 'lng': -76.14,
            'photo_url': 'https://example.com/drill.jpg', 'carbon_offset_kg': 5,
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        mine = self.client.get('/api/items/items/', {'mine': 'true'}).data['results']
        self.assertEqual([i['title'] for i in mine], ['Drill'])
        item_id = mine[0]['id']

        self.as_user(renter)
        start = timezone.now() + timedelta(hours=1)
        res = self.client.post('/api/bookings/bookings/', {
            'item_id': item_id,
            'start_time': start.isoformat(), 'end_time': (start + timedelta(hours=2)).isoformat(),
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        booking_id = res.data['booking']['id']
        self.assertEqual(res.data['booking']['total_price'], '6.00')

        self.as_user(owner)
        for step in ('accept', 'activate', 'complete'):
            res = self.client.post(f'/api/bookings/bookings/{booking_id}/{step}/')
            self.assertEqual(res.status_code, 200, (step, res.data))

        self.as_user(renter)
        me = self.client.get('/api/users/auth/me/').data
        self.assertEqual(me['wallet_points'], 60)  # 10 points per $1
        self.assertEqual(me['co2_saved_kg'], 5)

        stats = self.client.get('/api/items/items/stats/').data
        self.assertEqual(stats['rental_volume'], 6)

    def test_daily_rate_caps_long_rentals(self):
        from items.models import Item
        from users.models import User
        owner = User.objects.create_user('o2', 'o2@example.com', 'x')
        item = Item.objects.create(owner=owner, title='Tent', description='', category='other',
                                   price_per_hour=3, price_per_day=20, deposit=0,
                                   address_text='Syracuse', lat=43.0, lng=-76.1, photo_url='https://example.com/t.jpg')
        self.as_user(self.register('r2'))
        start = timezone.now() + timedelta(hours=1)
        res = self.client.post('/api/bookings/bookings/', {
            'item_id': item.id, 'start_time': start.isoformat(),
            'end_time': (start + timedelta(hours=30)).isoformat(),
        }, format='json')
        self.assertEqual(res.data['booking']['total_price'], '40.00')  # 2 started days, not 30h x $3
