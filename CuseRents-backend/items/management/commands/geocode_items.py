from django.core.management.base import BaseCommand
from items.models import Item
from items.services import geocoding_service
import time

class Command(BaseCommand):
    help = 'Geocode all items that are missing coordinates'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Re-geocode all items, even if they already have coordinates'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of items to geocode'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting geocoding process...'))
        
        # Query items
        if options['all']:
            items = Item.objects.all()
            self.stdout.write(f"Re-geocoding ALL {items.count()} items")
        else:
            items = Item.objects.filter(lat__isnull=True) | Item.objects.filter(lng__isnull=True)
            self.stdout.write(f"Geocoding {items.count()} items with missing coordinates")
        
        # Apply limit if specified
        if options['limit']:
            items = items[:options['limit']]
            self.stdout.write(f"Limited to {options['limit']} items")
        
        success_count = 0
        failure_count = 0
        
        for item in items:
            self.stdout.write(f"\nProcessing: {item.title} (ID: {item.id})")
            self.stdout.write(f"  Address: {item.address_text}")
            
            # Geocode the address
            result = geocoding_service.address_to_coords(item.address_text)
            
            if result:
                # Update item with coordinates
                item.lat = result['lat']
                item.lng = result['lng']
                item.google_place_id = result['place_id']
                item.address_text = result['formatted_address']  # Use formatted address
                item.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ Success: ({result['lat']}, {result['lng']})"
                    )
                )
                success_count += 1
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"  ✗ Failed to geocode address"
                    )
                )
                failure_count += 1
            
            # Rate limiting: wait 0.2 seconds between requests
            time.sleep(0.2)
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS(f"\nGeocoding complete!"))
        self.stdout.write(f"  Success: {success_count}")
        self.stdout.write(f"  Failures: {failure_count}")
        self.stdout.write(f"  Total: {success_count + failure_count}")