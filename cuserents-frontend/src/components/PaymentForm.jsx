import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './PaymentForm.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

const CheckoutForm = ({ rentalAmount, depositAmount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);

  const totalHold = parseFloat(rentalAmount) + parseFloat(depositAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setLoading(true);
    setMessage('');

    try {
      // For demo purposes - simulate payment success
      // In production, replace this with actual Stripe API calls
      
      setStep(2);
      setMessage('Processing rental fee...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStep(3);
      setMessage('Authorizing deposit hold...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStep(4);
      setMessage('Payment successful! Booking confirmed.');
      
      // Call success callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            rentalPaymentIntentId: 'demo_rental_' + Date.now(),
            depositPaymentIntentId: 'demo_deposit_' + Date.now()
          });
        }
      }, 1000);

    } catch (error) {
      setMessage(`Error: ${error.message}`);
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
      </div>

      {step > 1 && (
        <div className="payment-steps">
          <div className={step >= 2 ? 'step active' : 'step'}>
            ✓ Rental fee charged
          </div>
          <div className={step >= 3 ? 'step active' : 'step'}>
            ✓ Deposit authorized
          </div>
          <div className={step >= 4 ? 'step active' : 'step'}>
            ✓ Booking confirmed
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

const PaymentForm = ({ rentalAmount, depositAmount, bookingId, onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        rentalAmount={rentalAmount}
        depositAmount={depositAmount}
        onSuccess={onSuccess}
      />
    </Elements>
  );
};

export default PaymentForm;