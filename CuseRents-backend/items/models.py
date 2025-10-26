from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import math

class Item(models.Model):
    """
    Rentable items listed by users
    """
    CATEGORY_CHOICES = [
        ('tools', 'Tools & Hardware'),
        ('electronics', 'Electronics'),
        ('camera', 'Camera & Photography'),
        ('sports', 'Sports & Outdoors'),
        ('kitchen', 'Kitchen & Appliances'),
        ('party', 'Party & Events'),
        ('furniture', 'Furniture'),
        ('books', 'Books & Media'),
        ('other', 'Other'),
    ]
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='items',
        help_text="User who owns this item"
    )
    title = models.CharField(
        max_length=200,
        help_text="Item title/name"
    )
    description = models.TextField(
        help_text="Detailed description of the item"
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        help_text="Item category"
    )
    
    # Pricing
    price_per_hour = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Rental price per hour"
    )
    price_per_day = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        null=True,
        blank=True,
        help_text="Rental price per day (optional)"
    )
    deposit = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Security deposit amount"
    )
    
    # Location (Google Maps Integration)
    address_text = models.CharField(
        max_length=300,
        help_text="Full address text"
    )
    google_place_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Google Places API place ID"
    )
    lat = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
        help_text="Latitude coordinate"
    )
    lng = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
        help_text="Longitude coordinate"
    )
    
    # Media
    photo_url = models.URLField(
        help_text="Cloudinary URL for main photo"
    )
    additional_photos = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of additional photo URLs"
    )
    
    # Status & Sustainability
    is_available = models.BooleanField(
        default=True,
        help_text="Whether item is currently available for rent"
    )
    carbon_offset_kg = models.IntegerField(
        default=5,
        validators=[MinValueValidator(0)],
        help_text="Estimated CO2 saved per rental (in kg)"
    )
    
    # Stats
    total_rentals = models.IntegerField(
        default=0,
        help_text="Total number of times rented"
    )
    rating_avg = models.FloatField(
        default=5.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Average rating for this item"
    )
    total_ratings = models.IntegerField(
        default=0,
        help_text="Total number of ratings"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'items'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lat', 'lng']),  # For geo queries
            models.Index(fields=['category']),
            models.Index(fields=['is_available']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.owner.username}"
    
    def calculate_distance(self, target_lat, target_lng):
        """
        Calculate distance to target location using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1 = math.radians(self.lat)
        lat2 = math.radians(target_lat)
        delta_lat = math.radians(target_lat - self.lat)
        delta_lng = math.radians(target_lng - self.lng)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1) * math.cos(lat2) *
             math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        distance = R * c
        return round(distance, 2)
    
    def update_rating(self, new_rating):
        """Update item's average rating"""
        total_points = self.rating_avg * self.total_ratings
        self.total_ratings += 1
        self.rating_avg = (total_points + new_rating) / self.total_ratings
        self.save(update_fields=['rating_avg', 'total_ratings'])
    
    def increment_rentals(self):
        """Increment rental count"""
        self.total_rentals += 1
        self.save(update_fields=['total_rentals'])
    
    def geocode_address(self):
        """
        Geocode the address and update coordinates
        Returns True if successful, False otherwise
        """
        from .services import geocoding_service
        
        if not self.address_text:
            return False
        
        result = geocoding_service.address_to_coords(self.address_text)
        
        if result:
            self.lat = result['lat']
            self.lng = result['lng']
            self.google_place_id = result.get('place_id', '')
            self.address_text = result.get('formatted_address', self.address_text)
            return True
        
        return False


class ItemVideo(models.Model):
    """
    Video demonstrations for items
    """
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='videos',
        help_text="Item this video belongs to"
    )
    video_url = models.URLField(
        help_text="Cloudinary URL for video file"
    )
    thumbnail_url = models.URLField(
        help_text="Cloudinary URL for video thumbnail"
    )
    duration_seconds = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        help_text="Video duration in seconds (max 2 minutes)"
    )
    title = models.CharField(
        max_length=100,
        default="How to use this item",
        help_text="Video title"
    )
    view_count = models.IntegerField(
        default=0,
        help_text="Number of times video was viewed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'item_videos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Video for {self.item.title}"
    
    def increment_views(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])


class Bundle(models.Model):
    """
    Bundles of multiple items rented together at a discount
    """
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bundles',
        help_text="User who created this bundle"
    )
    name = models.CharField(
        max_length=200,
        help_text="Bundle name (e.g., 'Photography Starter Kit')"
    )
    description = models.TextField(
        help_text="Description of what's included"
    )
    items = models.ManyToManyField(
        Item,
        through='BundleItem',
        related_name='bundles',
        help_text="Items included in this bundle"
    )
    discount_percent = models.IntegerField(
        default=10,
        validators=[MinValueValidator(5), MaxValueValidator(50)],
        help_text="Discount percentage (5-50%)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether bundle is currently available"
    )
    total_bookings = models.IntegerField(
        default=0,
        help_text="Number of times this bundle was booked"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bundles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} by {self.creator.username}"
    
    def calculate_total_price(self, hours):
        """Calculate bundle price with discount"""
        total = sum(
            bundle_item.item.price_per_hour * bundle_item.quantity
            for bundle_item in self.bundle_items.all()
        ) * hours
        
        discount = total * (self.discount_percent / 100)
        return total - discount
    
    def increment_bookings(self):
        """Increment booking count"""
        self.total_bookings += 1
        self.save(update_fields=['total_bookings'])


class BundleItem(models.Model):
    """
    Through model for Bundle-Item many-to-many relationship
    """
    bundle = models.ForeignKey(
        Bundle,
        on_delete=models.CASCADE,
        related_name='bundle_items'
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='bundle_items'
    )
    quantity = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Number of this item in the bundle"
    )
    
    class Meta:
        db_table = 'bundle_items'
        unique_together = ['bundle', 'item']
    
    def __str__(self):
        return f"{self.quantity}x {self.item.title} in {self.bundle.name}"