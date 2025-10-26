from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Wallet, WalletTransaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'reward_points', 'tier_level', 'lifetime_earned']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    list_filter = ['created_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Financial Details', {
            'fields': ('balance', 'lifetime_earned')
        }),
        ('Rewards', {
            'fields': ('reward_points',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'transaction_type', 'amount', 'balance_after', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['wallet__user__username', 'description']
    readonly_fields = ['created_at', 'balance_after']
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('wallet', 'amount', 'transaction_type', 'description')
        }),
        ('Related Booking', {
            'fields': ('booking',)
        }),
        ('Result', {
            'fields': ('balance_after', 'created_at')
        }),
    )