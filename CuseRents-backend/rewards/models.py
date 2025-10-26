from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal

class Wallet(models.Model):
    """
    User's wallet for managing balance and reward points
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet',
        help_text="User who owns this wallet"
    )
    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Available wallet balance in USD"
    )
    reward_points = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Accumulated reward points"
    )
    lifetime_earned = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total amount earned through rentals (lifetime)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wallets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}'s Wallet (${self.balance}, {self.reward_points} pts)"
    
    def add_balance(self, amount):
        """Add money to wallet balance"""
        self.balance += Decimal(str(amount))
        self.save(update_fields=['balance', 'updated_at'])
    
    def deduct_balance(self, amount):
        """Deduct money from wallet balance"""
        if self.balance >= Decimal(str(amount)):
            self.balance -= Decimal(str(amount))
            self.save(update_fields=['balance', 'updated_at'])
            return True
        return False
    
    def add_points(self, points):
        """Add reward points"""
        self.reward_points += points
        self.save(update_fields=['reward_points', 'updated_at'])
    
    def redeem_points(self, points):
        """
        Redeem points for wallet credit
        100 points = $1.00
        """
        if self.reward_points >= points and points >= 100:
            credit_amount = Decimal(str(points / 100))
            self.reward_points -= points
            self.balance += credit_amount
            self.save(update_fields=['reward_points', 'balance', 'updated_at'])
            return credit_amount
        return None
    
    @property
    def tier_level(self):
        """Calculate user tier based on lifetime earnings"""
        if self.lifetime_earned >= 1000:
            return 'Gold'
        elif self.lifetime_earned >= 500:
            return 'Silver'
        elif self.lifetime_earned >= 100:
            return 'Bronze'
        return 'Starter'


class WalletTransaction(models.Model):
    """
    Track all wallet transactions
    """
    TRANSACTION_TYPES = [
        ('rental_earning', 'Rental Earning'),
        ('rental_payment', 'Rental Payment'),
        ('reward_redemption', 'Reward Redeemed'),
        ('referral_bonus', 'Referral Bonus'),
        ('deposit_hold', 'Deposit Hold'),
        ('deposit_refund', 'Deposit Refund'),
        ('platform_fee', 'Platform Fee'),
    ]
    
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions',
        help_text="Wallet this transaction belongs to"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Transaction amount (positive for credit, negative for debit)"
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES,
        help_text="Type of transaction"
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wallet_transactions',
        help_text="Related booking (if applicable)"
    )
    description = models.TextField(
        blank=True,
        help_text="Transaction description/notes"
    )
    balance_after = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Wallet balance after this transaction"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'wallet_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', '-created_at']),
            models.Index(fields=['transaction_type']),
        ]
    
    def __str__(self):
        return f"{self.wallet.user.username} - {self.transaction_type}: ${self.amount}"
    
    def save(self, *args, **kwargs):
        # Record balance after transaction
        if not self.balance_after:
            self.balance_after = self.wallet.balance
        super().save(*args, **kwargs)