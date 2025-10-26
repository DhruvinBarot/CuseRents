from django.db import models

# Payment models will be added in Stage 4
# For now, payment logic is handled through:
# - Booking.stripe_payment_id
# - WalletTransaction records
# - Wallet balance management