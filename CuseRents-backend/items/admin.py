from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Item, ItemVideo, Bundle, BundleItem

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'category', 'price_per_hour', 'is_available', 'total_rentals', 'rating_avg']
    list_filter = ['category', 'is_available', 'created_at']
    search_fields = ['title', 'description', 'owner__username', 'address_text']
    readonly_fields = ['created_at', 'updated_at', 'total_rentals', 'rating_avg', 'total_ratings']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'title', 'description', 'category')
        }),
        ('Pricing', {
            'fields': ('price_per_hour', 'price_per_day', 'deposit')
        }),
        ('Location', {
            'fields': ('address_text', 'google_place_id', 'lat', 'lng')
        }),
        ('Media', {
            'fields': ('photo_url', 'additional_photos')
        }),
        ('Status & Stats', {
            'fields': ('is_available', 'carbon_offset_kg', 'total_rentals', 'rating_avg', 'total_ratings')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ItemVideo)
class ItemVideoAdmin(admin.ModelAdmin):
    list_display = ['item', 'title', 'duration_seconds', 'view_count', 'created_at']
    search_fields = ['item__title', 'title']
    readonly_fields = ['created_at', 'view_count']

@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = ['name', 'creator', 'discount_percent', 'is_active', 'total_bookings']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'creator__username']
    readonly_fields = ['created_at', 'updated_at', 'total_bookings']
    
    fieldsets = (
        ('Bundle Information', {
            'fields': ('creator', 'name', 'description')
        }),
        ('Settings', {
            'fields': ('discount_percent', 'is_active')
        }),
        ('Stats', {
            'fields': ('total_bookings', 'created_at', 'updated_at')
        }),
    )

@admin.register(BundleItem)
class BundleItemAdmin(admin.ModelAdmin):
    list_display = ['bundle', 'item', 'quantity']
    search_fields = ['bundle__name', 'item__title']