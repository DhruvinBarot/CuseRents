"""Public (approximate) item locations. Exact spots are only for the owner and for renters once a booking is accepted."""
import hashlib
import hmac
import math
import re

from django.conf import settings

FUZZ_MIN_M, FUZZ_MAX_M = 100, 250
METERS_PER_DEG_LAT = 111_320


def approximate_point(item):
    """Move the pin 100-250 m in a direction derived from SECRET_KEY: stable per item, and not reversible from the item id."""
    digest = hmac.new(settings.SECRET_KEY.encode(), str(item.pk).encode(), hashlib.sha256).digest()
    angle = digest[0] / 255 * 2 * math.pi
    meters = FUZZ_MIN_M + digest[1] / 255 * (FUZZ_MAX_M - FUZZ_MIN_M)
    lat = item.lat + meters * math.cos(angle) / METERS_PER_DEG_LAT
    lng = item.lng + meters * math.sin(angle) / (METERS_PER_DEG_LAT * math.cos(math.radians(item.lat)))
    return round(lat, 5), round(lng, 5)


def street_only(address):
    """'310 Montgomery St, Syracuse, NY 13202' -> 'Montgomery St, Syracuse, NY 13202'"""
    return re.sub(r'^\s*\d+[\w-]*\s+', '', address or '')


def public_location(item):
    lat, lng = approximate_point(item)
    return {'lat': lat, 'lng': lng, 'address_text': street_only(item.address_text)}


class ApproximateLocationMixin:
    """Serializer mixin: everyone but the owner gets the approximate pin and a street-only address."""

    def to_representation(self, obj):
        data = super().to_representation(obj)
        request = self.context.get('request')
        if not (request and request.user == obj.owner):  # owners must see (and save back) their exact spot
            data.update(public_location(obj))
            for exact_only in ('google_place_id', 'directions_url'):
                if exact_only in data:
                    data[exact_only] = None
        return data
