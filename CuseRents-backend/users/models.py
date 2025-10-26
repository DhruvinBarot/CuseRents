from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    """
    Custom User model with additional fields for RentRadar
    """
    # Contact Information
    phone = models.CharField(
        max_length=15,
        blank=True,
        help_text="User's phone number for contact"
    )
    
    # Location (for map-based search)
    lat = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
        help_text="Latitude coordinate"
    )
    lng = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
        help_text="Longitude coordinate"
    )
    address_text = models.CharField(
        max_length=300,
        blank=True,
        help_text="User's primary address"
    )
    
    # Ratings & Reputation
    rating_avg = models.FloatField(
        default=5.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Average rating as an item owner"
    )
    total_ratings = models.IntegerField(
        default=0,
        help_text="Total number of ratings received"
    )
    
    # Sustainability Metrics
    co2_saved_kg = models.IntegerField(
        default=0,
        help_text="Total CO2 saved through rentals (in kg)"
    )
    
    # Verification Status
    phone_verified = models.BooleanField(
        default=False,
        help_text="Whether phone number is verified"
    )
    email_verified = models.BooleanField(
        default=False,
        help_text="Whether email is verified"
    )
    id_verified = models.BooleanField(
        default=False,
        help_text="Whether ID document is verified"
    )
    
    # Profile
    bio = models.TextField(
        blank=True,
        max_length=500,
        help_text="User bio/description"
    )
    profile_photo = models.URLField(
        blank=True,
        help_text="Cloudinary URL for profile photo"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lat', 'lng']),  # For geo queries
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email})"
    
    @property
    def full_name(self):
        """Return user's full name"""
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def verification_level(self):
        """Calculate verification level (0-3)"""
        level = 0
        if self.email_verified:
            level += 1
        if self.phone_verified:
            level += 1
        if self.id_verified:
            level += 1
        return level
    
    def update_rating(self, new_rating):
        """
        Update user's average rating
        Args:
            new_rating (float): New rating value (1-5)
        """
        total_points = self.rating_avg * self.total_ratings
        self.total_ratings += 1
        self.rating_avg = (total_points + new_rating) / self.total_ratings
        self.save(update_fields=['rating_avg', 'total_ratings'])
    
    def add_co2_saved(self, kg):
        """
        Add CO2 savings to user's total
        Args:
            kg (int): CO2 saved in kilograms
        """
        self.co2_saved_kg += kg
        self.save(update_fields=['co2_saved_kg'])
