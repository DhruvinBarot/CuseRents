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

# Pickup spots for the batch below (public campus places, cycled)
_SPOTS = [
    ('Marshall St, Syracuse, NY 13210', 43.0398, -76.1340),
    ('Schine Student Center, 303 University Pl, Syracuse, NY 13244', 43.0393, -76.1350),
    ('Bird Library, 222 Waverly Ave, Syracuse, NY 13244', 43.0398, -76.1328),
    ('Thornden Park, Syracuse, NY 13210', 43.0436, -76.1263),
    ('Skytop Rd, Syracuse, NY 13244', 43.0222, -76.1218),
    ('Westcott St, Syracuse, NY 13210', 43.0405, -76.1180),
    ('University Ave, Syracuse, NY 13210', 43.0430, -76.1365),
]

# (title, category, photo, description, $/hour, $/day, deposit). Hourly is ~5-20% of the purchase price
# for quick-use items; things people keep for a day or more get a low daily cap instead.
_MORE = [
    ('Mini Fridge', 'kitchen', 'mini-fridge.webp', 'Compact mini fridge for drinks and snacks. Great for a dorm room, a party or a few weeks.', '2.00', '8.00', '30.00'),
    ('Air Fryer', 'kitchen', 'air-fryer.webp', 'Digital air fryer with a viewing window. Crispy fries, wings and veggies with almost no oil.', '2.50', '10.00', '30.00'),
    ('Queen Air Mattress', 'furniture', 'air-mattress.webp', 'Queen-size inflatable air mattress for guests or move-in week.', '2.00', '10.00', '30.00'),
    ('Photo Backdrop Stand Kit', 'camera', 'backdrop-stand-kit.webp', 'Adjustable backdrop stand for photo shoots, grad photos, birthdays and events.', '3.00', '12.00', '25.00'),
    ('Carry-on Suitcase', 'other', 'carry-on-suitcase.webp', 'Hard-shell carry-on with spinner wheels. Perfect for a weekend trip or break.', '2.00', '10.00', '60.00'),
    ('Catan Board Game', 'books', 'catan.webp', 'The classic strategy board game for 3-4 players. Game night sorted.', '1.00', '5.00', '15.00'),
    ('Charcoal BBQ Grill', 'party', 'charcoal-grill.webp', 'Portable charcoal grill for tailgates, picnics and backyard cookouts.', '2.00', '10.00', '20.00'),
    ('Epson Projector', 'electronics', 'projector.webp', 'Bright Epson 3LCD projector for movie nights, presentations and game days. HDMI cable included.', '6.00', '25.00', '100.00'),
    ('Fishing Rod & Reel', 'sports', 'fishing-rod.webp', 'Spinning rod and reel combo, ready for a day at Onondaga Lake or Green Lakes.', '2.00', '10.00', '20.00'),
    ('Folding Desk', 'furniture', 'folding-desk.webp', 'Sturdy folding desk with a wood top. Sets up in seconds for studying or an extra workspace.', '1.50', '6.00', '20.00'),
    ('Graduation Cap & Gown', 'other', 'cap-and-gown.webp', 'Black graduation cap and gown for commencement or grad photos.', '3.00', '15.00', '20.00'),
    ('Ice Skates', 'sports', 'ice-skates.webp', 'Figure ice skates for open skate nights and winter fun.', '3.00', '12.00', '25.00'),
    ('Karaoke Party Speaker', 'party', 'karaoke-speaker.webp', 'JBL party speaker with light show and wireless microphone. Instant karaoke night.', '6.00', '30.00', '80.00'),
    ('Space Heater', 'electronics', 'space-heater.webp', 'Lasko tower space heater with thermostat for cold Syracuse nights.', '1.50', '8.00', '25.00'),
    ('Ring Light', 'camera', 'ring-light.webp', 'LED ring light on a stand for videos, livestreams, interviews and photos.', '2.00', '8.00', '15.00'),
    ('Sewing Machine', 'other', 'sewing-machine.webp', 'Singer sewing machine for hems, repairs, costumes and craft projects.', '4.00', '18.00', '50.00'),
    ('Sleeping Bag', 'sports', 'sleeping-bag.webp', 'Warm mummy sleeping bag for camping trips and overnight stays.', '2.00', '10.00', '25.00'),
    ('Snow Shovel', 'tools', 'snow-shovel.webp', 'Ergonomic snow shovel for clearing driveways, steps and cars after a storm.', '1.00', '5.00', '10.00'),
    ('Sony a7 IV Mirrorless Camera', 'camera', 'sony-a7iv-camera.webp', 'Full-frame Sony a7 IV with kit lens for photo and video projects, events and portfolios.', '15.00', '75.00', '500.00'),
    ('Statistics Textbook (13th ed.)', 'books', 'statistics-textbook.webp', 'McClave & Sincich Statistics, 13th edition. Rent it for the weeks you need it.', '1.00', '4.00', '40.00'),
    ('String Lights', 'party', 'string-lights.webp', 'Warm fairy string lights for dorm rooms, parties and photo backdrops.', '1.00', '3.00', '5.00'),
    ('DeWalt Socket Tool Set', 'tools', 'socket-tool-set.webp', 'DeWalt mechanics tool set with sockets, ratchets and a carry case.', '3.00', '12.00', '30.00'),
    ('Multi-Position Ladder', 'tools', 'folding-ladder.webp', 'Adjustable multi-position ladder. Works as a step ladder, extension ladder or on stairs.', '4.00', '18.00', '50.00'),
    ('Steam Iron', 'other', 'steam-iron.webp', 'Cordless steam iron for interview shirts and formal wear.', '1.50', '5.00', '10.00'),
    ('Milwaukee Tape Measure', 'tools', 'tape-measure.webp', 'Milwaukee 25 ft tape measure for measuring furniture, rooms and DIY projects.', '1.00', '4.00', '10.00'),
]

DEMO_ITEMS += [
    {
        'title': title, 'category': category, 'photo': photo, 'description': description,
        'price_per_hour': hour, 'price_per_day': day, 'deposit': deposit,
        'address_text': _SPOTS[i % len(_SPOTS)][0], 'lat': _SPOTS[i % len(_SPOTS)][1], 'lng': _SPOTS[i % len(_SPOTS)][2],
    }
    for i, (title, category, photo, description, hour, day, deposit) in enumerate(_MORE)
]


class Command(BaseCommand):
    help = 'Create the demo listings (with photos) for one owner. Safe to re-run: never duplicates or overwrites edits.'

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
