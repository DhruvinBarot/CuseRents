from rest_framework import generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Review
from .serializers import ReviewSerializer

REVIEW_BONUS_POINTS = 50


class ReviewListCreateView(generics.ListCreateAPIView):
    """GET ?item=<id> lists an item's reviews; POST {booking_id, stars, text} reviews a completed rental."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Review.objects.filter(flagged=False).select_related('reviewer')
        item_id = self.request.query_params.get('item')
        return queryset.filter(item_id=item_id) if item_id else queryset.none()

    def perform_create(self, serializer):
        serializer.save()
        self.request.user.wallet.add_points(REVIEW_BONUS_POINTS)
