"""
Test script for geocoding service
Run with: python test_geocoding.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CuseRents.settings')
django.setup()

from items.services import geocoding_service

print("="*50)
print("Testing CuseRents Geocoding Service")
print("="*50)

# Test 1: Address to Coordinates
print("\n1. Testing address_to_coords():")
address = "100 Winding Ridge Rd, Syracuse, NY 13210"
print(f"   Address: {address}")
result = geocoding_service.address_to_coords(address)
if result:
    print(f"   ✓ Lat: {result['lat']}")
    print(f"   ✓ Lng: {result['lng']}")
    print(f"   ✓ Place ID: {result['place_id']}")
    print(f"   ✓ Formatted: {result['formatted_address']}")
else:
    print("   ✗ Geocoding failed")

# Test 2: Coordinates to Address
print("\n2. Testing coords_to_address():")
lat, lng = 43.0481, -76.1474
print(f"   Coords: ({lat}, {lng})")
address = geocoding_service.coords_to_address(lat, lng)
if address:
    print(f"   ✓ Address: {address}")
else:
    print("   ✗ Reverse geocoding failed")

# Test 3: Distance Calculation
print("\n3. Testing calculate_distance():")
# Syracuse University to Downtown Syracuse
lat1, lng1 = 43.0361, -76.1275  # SU
lat2, lng2 = 43.0481, -76.1474  # Downtown
distance = geocoding_service.calculate_distance(lat1, lng1, lat2, lng2)
print(f"   Syracuse University → Downtown")
print(f"   ✓ Distance: {distance} km")

# Test 4: Address Validation
print("\n4. Testing validate_address():")
test_address = "100 Winding Ridge"
print(f"   Partial address: {test_address}")
validation = geocoding_service.validate_address(test_address)
print(f"   ✓ Valid: {validation['valid']}")
print(f"   ✓ Formatted: {validation['formatted_address']}")
if validation['suggestions']:
    print(f"   ✓ Suggestions:")
    for suggestion in validation['suggestions'][:3]:
        print(f"     - {suggestion}")

print("\n" + "="*50)
print("Testing complete!")
print("="*50)