import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createBooking, createPaymentIntent, confirmPayment } from '../services/api';
import './PaymentForm.css';

// If Stripe.js is blocked (ad blockers, offline) resolve to null so the form shows "Stripe not loaded" instead of crashing
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY).catch(() => null);

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
  const [isError, setIsError] = useState(false);
  // Reuse the booking on retry so a declined card doesn't leave duplicate unpaid bookings
  const [bookingId, setBookingId] = useState(null);

  const totalHold = parseFloat(rentalAmount) + parseFloat(depositAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setIsError(true);
      setMessage('Stripe not loaded. Disable ad blockers for this site and refresh.');
      return;
    }

    setLoading(true);
    setIsError(false);
    try {
      let id = bookingId;
      let bookingCode = null;
      if (!id) {
        setMessage('Reserving your booking...');
        const res = await createBooking({ ...bookingData, wallet_credit_used: 0 });
        id = res.booking.id;
        setBookingId(id);
      }

      setMessage('Authorizing your card...');
      const { clientSecret } = await createPaymentIntent(id);
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (error) throw new Error(error.message);

      // Backend re-checks the payment with Stripe before the booking goes to the owner
      const confirmed = await confirmPayment(id);
      bookingCode = confirmed.booking_code;
      setMessage('Card authorized! Booking sent to the owner.');
      onSuccess?.({ bookingCode, bookingId: id });
    } catch (err) {
      console.error('Payment/Booking error:', err);
      const data = err.response?.data;
      const detail = data?.error || data?.non_field_errors?.[0] || data?.detail || err.message;
      setIsError(true);
      setMessage(detail || 'Payment failed');
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
          * Nothing is charged until the item is returned. Then only the rental fee is charged 
          and the deposit hold is released (unless damage is reported).
        </p>
      </div>

      <div className="card-element-container">
        <label>Card Details</label>
        <CardElement options={cardStyle} />
      </div>

      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="pay-button"
      >
        {loading ? 'Processing...' : `Authorize $${totalHold.toFixed(2)}`}
      </button>

      {message && (
        <div className={`message ${isError ? '' : 'success'}`} role="status">
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