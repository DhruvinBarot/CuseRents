import googlemaps
import math
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class GeocodingService:
    """
    Service for handling Google Maps geocoding operations
    """
    
    def __init__(self):
        """Initialize Google Maps client"""
        api_key = settings.GOOGLE_MAPS_API_KEY
        if not api_key:
            logger.warning("Google Maps API key not configured")
            self.client = None
        else:
            self.client = googlemaps.Client(key=api_key)
    
    def address_to_coords(self, address_text):
        """
        Convert address to coordinates using Google Geocoding API
        
        Args:
            address_text (str): Full address string
            
        Returns:
            dict: {
                'lat': float,
                'lng': float,
                'place_id': str,
                'formatted_address': str
            } or None if failed
        """
        if not self.client:
            logger.error("Google Maps client not initialized")
            return None
        
        # Check cache first (cache for 30 days)
        cache_key = f"geocode_address_{address_text}"
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Using cached geocoding result for: {address_text}")
            return cached_result
        
        try:
            # Call Google Geocoding API
            geocode_result = self.client.geocode(address_text)
            
            if not geocode_result:
                logger.warning(f"No geocoding results found for: {address_text}")
                return None
            
            # Extract first result
            location = geocode_result[0]['geometry']['location']
            place_id = geocode_result[0].get('place_id', '')
            formatted_address = geocode_result[0].get('formatted_address', address_text)
            
            result = {
                'lat': location['lat'],
                'lng': location['lng'],
                'place_id': place_id,
                'formatted_address': formatted_address
            }
            
            # Cache the result
            cache.set(cache_key, result, 60 * 60 * 24 * 30)  # 30 days
            
            logger.info(f"Successfully geocoded: {address_text} → ({result['lat']}, {result['lng']})")
            return result
            
        except googlemaps.exceptions.ApiError as e:
            logger.error(f"Google Maps API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during geocoding: {e}")
            return None
    
    def coords_to_address(self, lat, lng):
        """
        Convert coordinates to address using Google Reverse Geocoding API
        
        Args:
            lat (float): Latitude
            lng (float): Longitude
            
        Returns:
            str: Formatted address or None if failed
        """
        if not self.client:
            logger.error("Google Maps client not initialized")
            return None
        
        # Check cache first
        cache_key = f"reverse_geocode_{lat}_{lng}"
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Using cached reverse geocoding result for: ({lat}, {lng})")
            return cached_result
        
        try:
            # Call Google Reverse Geocoding API
            reverse_geocode_result = self.client.reverse_geocode((lat, lng))
            
            if not reverse_geocode_result:
                logger.warning(f"No reverse geocoding results found for: ({lat}, {lng})")
                return None
            
            # Extract formatted address
            formatted_address = reverse_geocode_result[0].get('formatted_address', '')
            
            # Cache the result
            cache.set(cache_key, formatted_address, 60 * 60 * 24 * 30)  # 30 days
            
            logger.info(f"Successfully reverse geocoded: ({lat}, {lng}) → {formatted_address}")
            return formatted_address
            
        except googlemaps.exceptions.ApiError as e:
            logger.error(f"Google Maps API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during reverse geocoding: {e}")
            return None
    
    def validate_address(self, address_text):
        """
        Validate an address and get suggestions
        
        Args:
            address_text (str): Address to validate
            
        Returns:
            dict: {
                'valid': bool,
                'formatted_address': str,
                'suggestions': list
            }
        """
        if not self.client:
            logger.error("Google Maps client not initialized")
            return {
                'valid': False,
                'formatted_address': address_text,
                'suggestions': []
            }
        
        try:
            # Use Places Autocomplete for suggestions
            autocomplete_result = self.client.places_autocomplete(
                input_text=address_text,
                types='address'
            )
            
            # Try exact geocoding
            geocode_result = self.client.geocode(address_text)
            
            valid = len(geocode_result) > 0
            formatted_address = geocode_result[0]['formatted_address'] if valid else address_text
            suggestions = [
                suggestion['description'] 
                for suggestion in autocomplete_result[:5]
            ]
            
            return {
                'valid': valid,
                'formatted_address': formatted_address,
                'suggestions': suggestions
            }
            
        except Exception as e:
            logger.error(f"Error validating address: {e}")
            return {
                'valid': False,
                'formatted_address': address_text,
                'suggestions': []
            }
    
    @staticmethod
    def calculate_distance(lat1, lng1, lat2, lng2):
        """
        Calculate distance between two coordinates using Haversine formula
        
        Args:
            lat1 (float): Starting latitude
            lng1 (float): Starting longitude
            lat2 (float): Ending latitude
            lng2 (float): Ending longitude
            
        Returns:
            float: Distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        # Haversine formula
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        distance = R * c
        return round(distance, 2)
    
    def get_distance_matrix(self, origins, destinations):
        """
        Get distances and travel times between multiple points
        
        Args:
            origins (list): List of (lat, lng) tuples
            destinations (list): List of (lat, lng) tuples
            
        Returns:
            dict: Distance matrix results
        """
        if not self.client:
            logger.error("Google Maps client not initialized")
            return None
        
        try:
            result = self.client.distance_matrix(
                origins=origins,
                destinations=destinations,
                mode='driving'
            )
            return result
        except Exception as e:
            logger.error(f"Error getting distance matrix: {e}")
            return None


# Singleton instance
geocoding_service = GeocodingService()