from django.conf import settings
from django.db import migrations


def backfill(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))
    Wallet = apps.get_model('rewards', 'Wallet')
    for user in User.objects.filter(wallet__isnull=True):
        Wallet.objects.create(user=user)


class Migration(migrations.Migration):
    dependencies = [
        ('rewards', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [migrations.RunPython(backfill, migrations.RunPython.noop)]
