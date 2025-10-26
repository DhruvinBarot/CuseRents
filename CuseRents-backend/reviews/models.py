from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Review(models.Model):
    """
    Reviews for items and users after rental completion
    """
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='reviews',
        help_text="Booking this review is for"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        help_text="User writing the review"
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        help_text="User being reviewed"
    )
    item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reviews',
        help_text="Item being reviewed (if applicable)"
    )
    
    # Rating & Content
    stars = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1-5 stars"
    )
    text = models.TextField(
        blank=True,
        max_length=1000,
        help_text="Written review text"
    )
    
    # Video Review (optional)
    video_url = models.URLField(
        blank=True,
        help_text="Cloudinary URL for video testimonial (optional)"
    )
    video_thumbnail = models.URLField(
        blank=True,
        help_text="Thumbnail for video review"
    )
    video_duration = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text="Video duration in seconds (max 1 minute)"
    )
    
    # Photos (optional)
    photos = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of photo URLs showing item condition"
    )
    
    # Metadata
    is_verified = models.BooleanField(
        default=True,
        help_text="Whether review is from verified rental"
    )
    helpful_count = models.IntegerField(
        default=0,
        help_text="Number of users who found this review helpful"
    )
    flagged = models.BooleanField(
        default=False,
        help_text="Whether review has been flagged for moderation"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        unique_together = ['booking', 'reviewer', 'reviewee']
        indexes = [
            models.Index(fields=['item', '-created_at']),
            models.Index(fields=['reviewee', '-created_at']),
            models.Index(fields=['stars']),
        ]
    
    def __str__(self):
        return f"{self.reviewer.username} → {self.reviewee.username}: {self.stars}★"
    
    @property
    def has_video(self):
        """Check if review includes video"""
        return bool(self.video_url)
    
    @property
    def has_photos(self):
        """Check if review includes photos"""
        return len(self.photos) > 0
    
    def increment_helpful(self):
        """Increment helpful count"""
        self.helpful_count += 1
        self.save(update_fields=['helpful_count'])
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Update item rating if this is an item review
        if self.item:
            self.item.update_rating(self.stars)
        
        # Update user rating
        self.reviewee.update_rating(self.stars)