from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
import random
import string

def generate_booking_code():
    """Generate unique 6-character booking code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class Booking(models.Model):
    """
    Rental bookings for items or bundles
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('accepted', 'Accepted'),
        ('active', 'Active (In Progress)'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    ]
    
    # Relationships
    renter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings_as_renter',
        help_text="User renting the item(s)"
    )
    item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='bookings',
        help_text="Single item being rented (null if bundle)"
    )
    bundle = models.ForeignKey(
        'items.Bundle',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='bookings',
        help_text="Bundle being rented (null if single item)"
    )
    items = models.ManyToManyField(
        'items.Item',
        through='BookingItem',
        related_name='bundle_bookings',
        help_text="Items in this booking (used for bundles)"
    )
    
    # Timing
    start_time = models.DateTimeField(
        help_text="Rental start date/time"
    )
    end_time = models.DateTimeField(
        help_text="Rental end date/time"
    )
    actual_return_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Actual time item was returned"
    )
    
    # Pricing
    total_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Total rental price"
    )
    deposit_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Security deposit amount"
    )
    wallet_credit_used = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Amount paid from wallet balance"
    )
    late_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Late return fee"
    )
    
    # Rewards
    reward_points_earned = models.IntegerField(
        default=0,
        help_text="Reward points earned from this booking"
    )
    
    # Status & Tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current booking status"
    )
    booking_code = models.CharField(
        max_length=6,
        unique=True,
        help_text="Unique 6-character booking code"
    )
    
    # Payment
    stripe_payment_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Stripe payment intent ID"
    )
    
    # Condition notes
    condition_at_pickup = models.TextField(
        blank=True,
        help_text="Item condition notes at pickup"
    )
    condition_at_return = models.TextField(
        blank=True,
        help_text="Item condition notes at return"
    )
    damage_reported = models.BooleanField(
        default=False,
        help_text="Whether damage was reported"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['renter', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['booking_code']),
            models.Index(fields=['start_time', 'end_time']),
        ]
    
    def __str__(self):
        item_name = self.item.title if self.item else self.bundle.name
        return f"{self.booking_code}: {item_name} by {self.renter.username}"
    
    def save(self, *args, **kwargs):
        # Auto-generate booking code if not exists
        if not self.booking_code:
            self.booking_code = generate_booking_code()
            # Ensure uniqueness
            while Booking.objects.filter(booking_code=self.booking_code).exists():
                self.booking_code = generate_booking_code()
        super().save(*args, **kwargs)
    
    @property
    def owner(self):
        """Get the item owner"""
        if self.item:
            return self.item.owner
        elif self.bundle:
            return self.bundle.creator
        return None
    
    @property
    @property
    def duration_hours(self):
        """Calculate booking duration in hours"""
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            return delta.total_seconds() / 3600
        return 0
    
    @property
    @property
    def is_overdue(self):
        """Check if booking is past end_time and not returned"""
        from django.utils import timezone
        if not self.end_time:
            return False
        return (
            self.status == 'active' and
            timezone.now() > self.end_time and
            not self.actual_return_time
        )
    
    def calculate_reward_points(self):
        """
        Calculate reward points for this booking
        10 points per $1 spent for renter
        50 points per $1 earned for owner
        """
        renter_points = int(self.total_price * 10)
        owner_earnings = self.total_price - self.wallet_credit_used
        owner_points = int(owner_earnings * 50)
        return renter_points, owner_points
    
    def mark_active(self):
        """Mark booking as active (pickup confirmed)"""
        self.status = 'active'
        self.save(update_fields=['status', 'updated_at'])
    
    def mark_completed(self):
        """Mark booking as completed (return confirmed)"""
        from django.utils import timezone
        self.status = 'completed'
        self.actual_return_time = timezone.now()
        self.save(update_fields=['status', 'actual_return_time', 'updated_at'])


class BookingItem(models.Model):
    """
    Through model for Booking-Item many-to-many relationship (for bundles)
    """
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='booking_items'
    )
    item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        related_name='booking_items'
    )
    individual_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Price for this item in the booking"
    )
    quantity = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )
    
    class Meta:
        db_table = 'booking_items'
        unique_together = ['booking', 'item']
    
    def __str__(self):
        return f"{self.quantity}x {self.item.title} in booking {self.booking.booking_code}"