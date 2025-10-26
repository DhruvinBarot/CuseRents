from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['reviewer', 'reviewee', 'item', 'stars', 'has_video', 'helpful_count', 'created_at']
    list_filter = ['stars', 'is_verified', 'flagged', 'created_at']
    search_fields = ['reviewer__username', 'reviewee__username', 'item__title', 'text']
    readonly_fields = ['created_at', 'updated_at', 'has_video', 'has_photos', 'helpful_count']
    
    fieldsets = (
        ('Review Information', {
            'fields': ('booking', 'reviewer', 'reviewee', 'item')
        }),
        ('Rating & Content', {
            'fields': ('stars', 'text')
        }),
        ('Media', {
            'fields': ('video_url', 'video_thumbnail', 'video_duration', 'photos', 'has_video', 'has_photos')
        }),
        ('Moderation', {
            'fields': ('is_verified', 'flagged', 'helpful_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_flagged', 'mark_as_verified']
    
    def mark_as_flagged(self, request, queryset):
        queryset.update(flagged=True)
    mark_as_flagged.short_description = "Mark selected reviews as flagged"
    
    def mark_as_verified(self, request, queryset):
        queryset.update(is_verified=True)
    mark_as_verified.short_description = "Mark selected reviews as verified"