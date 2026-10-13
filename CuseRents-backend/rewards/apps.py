from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_save


def create_wallet(sender, instance, created, **kwargs):
    # Every user needs a wallet (booking completion credits it), including admin/createsuperuser users
    if created:
        from .models import Wallet
        Wallet.objects.get_or_create(user=instance)


class RewardsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rewards'

    def ready(self):
        post_save.connect(create_wallet, sender=settings.AUTH_USER_MODEL)
