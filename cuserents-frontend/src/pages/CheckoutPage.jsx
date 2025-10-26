import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RentalPaymentForm from '../components/payments/RentalPaymentForm';
import axios from 'axios';
import './CheckoutPage.css';

function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingDetails = location.state;
  const [bookingId, setBookingId] = useState(null);

  if (!bookingDetails) {
    navigate('/');
    return null;
  }

  const { item, startDate, endDate, days, rentalFee, depositAmount } = bookingDetails;

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Create booking in backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookings/`,
        {
          item: item.id,
          start_date: startDate,
          end_date: endDate,
          rental_fee: rentalFee,
          deposit_amount: depositAmount,
          rental_payment_intent_id: paymentData.rentalPaymentIntentId,
          deposit_payment_intent_id: paymentData.depositPaymentIntentId,
          rental_paid: true,
          deposit_authorized: true,
          status: 'confirmed'
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Navigate to confirmation page
      navigate('/booking-confirmed', {
        state: { booking: response.data }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Payment successful but booking creation failed. Please contact support.');
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        <div className="order-summary">
          <h2>Order Summary</h2>
          
          <div className="item-preview">
            <img src={item.image || '/placeholder-item.jpg'} alt={item.name} />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
          </div>

          <div className="rental-details">
            <div className="detail-row">
              <span className="label">Rental Period:</span>
              <span>{startDate} to {endDate}</span>
            </div>
            <div className="detail-row">
              <span className="label">Duration:</span>
              <span>{days} days</span>
            </div>
            <div className="detail-row">
              <span className="label">Daily Rate:</span>
              <span>${item.daily_rate}/day</span>
            </div>
          </div>

          <div className="price-breakdown">
            <div className="breakdown-row">
              <span>Rental Fee ({days} days):</span>
              <span>${rentalFee}</span>
            </div>
            <div className="breakdown-row deposit">
              <span>Security Deposit (hold):</span>
              <span>${depositAmount}</span>
            </div>
            <div className="breakdown-row total">
              <span>Total Authorization:</span>
              <span>${rentalFee + depositAmount}</span>
            </div>
          </div>

          <div className="deposit-info">
            <p>
              💳 <strong>About the security deposit:</strong><br/>
              The deposit amount will be held on your card but not charged. 
              It will be automatically released after you return the item in good condition.
            </p>
          </div>
        </div>

        <div className="payment-section">
          <h2>Payment Details</h2>
          <RentalPaymentForm
            rentalAmount={rentalFee}
            depositAmount={depositAmount}
            bookingId={bookingId}
            onSuccess={handlePaymentSuccess}
          />
        </div>

      </div>
    </div>
  );
}

export default CheckoutPage;