from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'full_name', 'rating_avg', 'co2_saved_kg', 'verification_level']
    list_filter = ['phone_verified', 'email_verified', 'id_verified', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Contact Information', {
            'fields': ('phone', 'address_text')
        }),
        ('Location', {
            'fields': ('lat', 'lng')
        }),
        ('Reputation', {
            'fields': ('rating_avg', 'total_ratings', 'co2_saved_kg')
        }),
        ('Verification', {
            'fields': ('phone_verified', 'email_verified', 'id_verified', 'verification_level')
        }),
        ('Profile', {
            'fields': ('bio', 'profile_photo')
        }),
    )
    
    readonly_fields = ['rating_avg', 'total_ratings', 'co2_saved_kg', 'verification_level']