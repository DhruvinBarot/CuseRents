from datetime import timedelta
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase
from bookings.models import Booking
from items.models import Item
from users.models import User


class Phase3Tests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user('owner', 'o@example.com', 'x')
        self.renter = User.objects.create_user('renter', 'r@example.com', 'x')
        self.item = Item.objects.create(owner=self.owner, title='Drill', description='', category='tools',
                                        price_per_hour=3, deposit=0, address_text='Syracuse', lat=43.0, lng=-76.1)
        start = timezone.now() - timedelta(hours=3)
        self.booking = Booking.objects.create(item=self.item, renter=self.renter, start_time=start,
                                              end_time=start + timedelta(hours=2), total_price=6, status='completed')

    def review(self, user, booking_id=None, stars=4):
        self.client.force_authenticate(user)
        return self.client.post('/api/reviews/', {'booking_id': booking_id or self.booking.id, 'stars': stars, 'text': 'ok'})

    def test_renter_reviews_item_once_and_gets_points(self):
        self.assertEqual(self.review(self.renter).status_code, 201)
        self.item.refresh_from_db()
        self.assertEqual((self.item.total_ratings, self.item.rating_avg), (1, 4.0))
        self.assertEqual(self.renter.wallet.reward_points, 50)
        self.assertEqual(self.review(self.renter).status_code, 400)  # duplicate
        reviews = self.client.get('/api/reviews/', {'item': self.item.id}).data['results']
        self.assertEqual([r['reviewer_username'] for r in reviews], ['renter'])

    def test_owner_reviews_renter_not_item(self):
        self.assertEqual(self.review(self.owner, stars=2).status_code, 201)
        self.renter.refresh_from_db()
        self.item.refresh_from_db()
        self.assertEqual((self.renter.total_ratings, self.item.total_ratings), (1, 0))

    def test_cannot_review_unfinished_or_others_rentals(self):
        stranger = User.objects.create_user('stranger', 's@example.com', 'x')
        self.assertEqual(self.review(stranger).status_code, 400)
        self.booking.status = 'active'
        self.booking.save()
        self.assertEqual(self.review(self.renter).status_code, 400)

    def test_renter_cancel_and_owner_email(self):
        self.booking.status = 'accepted'
        self.booking.save()
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post(f'/api/bookings/bookings/{self.booking.id}/cancel/').status_code, 403)
        self.client.force_authenticate(self.renter)
        self.assertEqual(self.client.post(f'/api/bookings/bookings/{self.booking.id}/cancel/').status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'cancelled')
        self.assertEqual(mail.outbox[0].to, ['o@example.com'])

    def test_photo_upload_validation(self):
        self.client.force_authenticate(self.owner)
        url = '/api/items/items/upload-photo/'
        not_image = SimpleUploadedFile('x.txt', b'hello', content_type='text/plain')
        self.assertEqual(self.client.post(url, {'photo': not_image}).status_code, 400)
        image = SimpleUploadedFile('x.png', b'\x89PNG', content_type='image/png')
        with self.settings(CLOUDINARY_STORAGE={'CLOUD_NAME': '', 'API_KEY': '', 'API_SECRET': ''}):
            self.assertEqual(self.client.post(url, {'photo': image}).status_code, 503)
