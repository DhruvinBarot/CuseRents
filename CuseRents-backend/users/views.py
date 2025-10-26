from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update the authenticated user's profile
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'lat': user.lat,
            'lng': user.lng,
            'address_text': user.address_text,
            'rating_avg': user.rating_avg,
            'co2_saved_kg': user.co2_saved_kg,
            'profile_photo': user.profile_photo,
            'bio': user.bio,
        })
    
    def patch(self, request):
        # Placeholder for profile update
        return Response({'message': 'Profile update coming in Stage 1.3'})


class PublicProfileView(generics.RetrieveAPIView):
    """
    View another user's public profile
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            return Response({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rating_avg': user.rating_avg,
                'total_ratings': user.total_ratings,
                'co2_saved_kg': user.co2_saved_kg,
                'profile_photo': user.profile_photo,
                'bio': user.bio,
                'created_at': user.created_at,
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )