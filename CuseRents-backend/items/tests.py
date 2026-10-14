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
