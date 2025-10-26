from django.contrib import admin
from .models import Booking, BookingItem

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_code', 'renter', 'get_owner', 'get_item_title', 'status', 'start_time', 'total_price', 'created_at']
    list_filter = ['status', 'start_time', 'created_at']
    search_fields = ['booking_code', 'renter__username', 'item__title']
    readonly_fields = ['booking_code', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Booking Details', {
            'fields': ('booking_code', 'renter', 'status')
        }),
        ('Item/Bundle', {
            'fields': ('item', 'bundle')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'actual_return_time')
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
    
    def get_owner(self, obj):
        """Get item owner username"""
        if obj.item and obj.item.owner:
            return obj.item.owner.username
        elif obj.bundle and obj.bundle.creator:
            return obj.bundle.creator.username
        return '-'
    get_owner.short_description = 'Owner'
    
    def get_item_title(self, obj):
        """Get item or bundle title"""
        if obj.item:
            return obj.item.title
        elif obj.bundle:
            return obj.bundle.name
        return '-'
    get_item_title.short_description = 'Item/Bundle'

@admin.register(BookingItem)
class BookingItemAdmin(admin.ModelAdmin):
    list_display = ['booking', 'item', 'individual_price', 'quantity']
    search_fields = ['booking__booking_code', 'item__title']
    
    fieldsets = (
        ('Booking Item Details', {
            'fields': ('booking', 'item', 'individual_price', 'quantity')
        }),
    )