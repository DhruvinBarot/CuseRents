import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createBooking } from '../services/api';
import './PaymentForm.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo');

const CheckoutForm = ({ 
  rentalAmount, 
  depositAmount, 
  bookingData,
  onSuccess 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);

  const totalHold = parseFloat(rentalAmount) + parseFloat(depositAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setMessage('Stripe not loaded. Please refresh the page.');
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      // Step 1: Process payment (demo mode)
      setStep(2);
      setMessage('Processing rental fee...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Authorize deposit hold (demo mode)
      setStep(3);
      setMessage('Authorizing deposit hold...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Create booking in Django backend
      setStep(4);
      setMessage('Creating booking...');
      
      console.log('Creating booking with data:', bookingData);
      
      const bookingResponse = await createBooking({
        item_id: bookingData.item_id,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        wallet_credit_used: 0
      });
      
      console.log('Booking created:', bookingResponse);

      // Step 4: Success
      setMessage('Payment successful! Booking confirmed.');
      
      // Extract booking code
      const bookingCode = bookingResponse.booking_code || 
                         bookingResponse.booking?.booking_code || 
                         'SUCCESS';
      
      // Call success callback with payment and booking data
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            rentalPaymentIntentId: 'demo_rental_' + Date.now(),
            depositPaymentIntentId: 'demo_deposit_' + Date.now(),
            bookingCode: bookingCode,
            bookingId: bookingResponse.id || bookingResponse.booking?.id
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Payment/Booking error:', error);
      setMessage(`Error: ${error.response?.data?.detail || error.message || 'Payment failed'}`);
      setStep(1);
    }
    
    setLoading(false);
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <div className="payment-row">
          <span>Rental Fee:</span>
          <span className="amount">${rentalAmount}</span>
        </div>
        <div className="payment-row">
          <span>Security Deposit (Hold):</span>
          <span className="amount">${depositAmount}</span>
        </div>
        <div className="payment-row total">
          <span>Total Authorization:</span>
          <span className="amount">${totalHold.toFixed(2)}</span>
        </div>
        <p className="deposit-note">
          * Security deposit will be held on your card but not charged. 
          It will be released after you return the item in good condition.
        </p>
      </div>

      <div className="card-element-container">
        <label>Card Details</label>
        <CardElement options={cardStyle} />
        <p style={{fontSize: '0.85rem', color: '#666', marginTop: '8px'}}>
          💳 Demo Mode: Use any card number (e.g., 4242 4242 4242 4242)
        </p>
      </div>

      {step > 1 && (
        <div className="payment-steps">
          <div className={step >= 2 ? 'step active' : 'step'}>
            ✓ Rental fee processed
          </div>
          <div className={step >= 3 ? 'step active' : 'step'}>
            ✓ Deposit authorized
          </div>
          <div className={step >= 4 ? 'step active' : 'step'}>
            ✓ Booking created
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="pay-button"
      >
        {loading ? 'Processing...' : `Authorize $${totalHold.toFixed(2)}`}
      </button>

      {message && (
        <div className={`message ${step === 4 ? 'success' : ''}`}>
          {message}
        </div>
      )}
    </form>
  );
};

const PaymentForm = ({ 
  rentalAmount, 
  depositAmount, 
  bookingData,
  onSuccess 
}) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        rentalAmount={rentalAmount}
        depositAmount={depositAmount}
        bookingData={bookingData}
        onSuccess={onSuccess}
      />
    </Elements>
  );
};

export default PaymentForm;