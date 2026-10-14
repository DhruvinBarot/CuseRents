from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from items.models import Item

# Photos ship with the frontend in public/images/items. Pickup spots are public campus places, not home addresses.
DEMO_ITEMS = [
    {
        'title': 'KitchenAid Stand Mixer', 'category': 'kitchen', 'photo': 'kitchenaid-mixer.webp',
        'description': 'Professional mixer perfect for baking bread, cakes, and cookies.',
        'price_per_hour': '3.50', 'price_per_day': '20.00', 'deposit': '50.00',
        'address_text': 'Marshall St, Syracuse, NY 13210', 'lat': 43.0398, 'lng': -76.1340,
    },
    {
        'title': 'DeWalt Cordless Drill', 'category': 'tools', 'photo': 'dewalt-drill-kit.webp',
        'description': 'DeWalt 20V brushless drill and impact driver kit with two batteries, charger and bag.',
        'price_per_hour': '3.00', 'price_per_day': None, 'deposit': '20.00',
        'address_text': 'Schine Student Center, 303 University Pl, Syracuse, NY 13244', 'lat': 43.0393, 'lng': -76.1350,
    },
    {
        'title': 'Instant Pot Duo', 'category': 'kitchen', 'photo': 'instant-pot.webp',
        'description': '7-in-1 pressure cooker for quick and easy meals.',
        'price_per_hour': '2.00', 'price_per_day': '12.00', 'deposit': '25.00',
        'address_text': 'Bird Library, 222 Waverly Ave, Syracuse, NY 13244', 'lat': 43.0398, 'lng': -76.1328,
    },
    {
        'title': 'Electric Scooter', 'category': 'sports', 'photo': 'electric-scooter.webp',
        'description': 'Electric scooter, perfect for getting around campus.',
        'price_per_hour': '5.00', 'price_per_day': '35.00', 'deposit': '80.00',
        'address_text': 'Thornden Park, Syracuse, NY 13210', 'lat': 43.0436, 'lng': -76.1263,
    },
    {
        'title': 'Picnic Kit', 'category': 'party', 'photo': 'picnic-kit.webp',
        'description': 'Wicker picnic basket for four with plates, cutlery, wine glasses, a cooler bag and a blanket.',
        'price_per_hour': '1.00', 'price_per_day': '1.99', 'deposit': '10.00',
        'address_text': 'Skytop Rd, Syracuse, NY 13244', 'lat': 43.0222, 'lng': -76.1218,
    },
]


class Command(BaseCommand):
    help = 'Create the five demo listings (with photos) for one owner. Safe to re-run: never duplicates or overwrites edits.'

    def add_arguments(self, parser):
        parser.add_argument('--owner', required=True, help='Username that will own the items')
        parser.add_argument('--photo-base', default=settings.FRONTEND_URL, help='Frontend URL that serves /images/items/')

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            owner = User.objects.get(username=options['owner'])
        except User.DoesNotExist:
            raise CommandError(f"No user named '{options['owner']}'. Sign up on the site first, then re-run.")

        base = options['photo_base'].rstrip('/')
        for data in DEMO_ITEMS:
            fields = dict(data)
            photo_url = f"{base}/images/items/{fields.pop('photo')}"
            for money in ('price_per_hour', 'price_per_day', 'deposit'):
                fields[money] = Decimal(fields[money]) if fields[money] else None

            item = Item.objects.filter(owner=owner, title__iexact=fields['title']).first()
            if item is None:
                Item.objects.create(owner=owner, photo_url=photo_url, **fields)
                self.stdout.write(self.style.SUCCESS(f"Created {fields['title']}"))
            elif not item.photo_url:
                # Existing listing: only fill in a missing photo, keep the owner's edits
                item.photo_url = photo_url
                item.save(update_fields=['photo_url', 'updated_at'])
                self.stdout.write(f"Added photo to {item.title}")
            else:
                self.stdout.write(f"Skipped {item.title} (already listed)")
