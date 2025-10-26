from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Booking, BookingItem

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_code', 'renter', 'owner', 'status', 'start_time', 'total_price', 'created_at']
    list_filter = ['status', 'start_time', 'created_at']
    search_fields = ['booking_code', 'renter__username', 'item__title', 'bundle__name']
    readonly_fields = ['booking_code', 'created_at', 'updated_at', 'duration_hours', 'is_overdue']
    
    fieldsets = (
        ('Booking Details', {
            'fields': ('booking_code', 'renter', 'status')
        }),
        ('Item/Bundle', {
            'fields': ('item', 'bundle')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'actual_return_time', 'duration_hours', 'is_overdue')
        }),
        ('Pricing', {
            'fields': ('total_price', 'deposit_amount', 'wallet_credit_used', 'late_fee')
        }),
        ('Rewards & Payment', {
            'fields': ('reward_points_earned', 'stripe_payment_id')
        }),
        ('Condition Notes', {
            'fields': ('condition_at_pickup', 'condition_at_return', 'damage_reported')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def owner(self, obj):
        return obj.owner.username if obj.owner else '-'
    owner.short_description = 'Owner'

@admin.register(BookingItem)
class BookingItemAdmin(admin.ModelAdmin):
    list_display = ['booking', 'item', 'individual_price', 'quantity']
    search_fields = ['booking__booking_code', 'item__title']