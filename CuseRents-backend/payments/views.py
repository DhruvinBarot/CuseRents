from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import stripe
import os

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

class CreatePaymentIntentView(APIView):
    def post(self, request):
        try:
            amount = request.data.get('amount')  # amount in cents
            
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',
                automatic_payment_methods={'enabled': True}
            )
            
            return Response({
                'clientSecret': intent.client_secret
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )