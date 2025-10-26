import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BookingConfirmedPage.css';

function BookingConfirmedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  if (!booking) {
    navigate('/');
    return null;
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="success-icon">✓</div>
        
        <h1>Booking Confirmed!</h1>
        <p className="confirmation-message">
          Your rental has been successfully booked and payment processed.
        </p>

        <div className="booking-details-card">
          <h2>Booking Details</h2>
          
          <div className="detail-row">
            <span className="label">Booking ID:</span>
            <span className="value">#{booking.id}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Rental Period:</span>
            <span className="value">
              {booking.start_date} to {booking.end_date}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="label">Rental Fee Paid:</span>
            <span className="value">${booking.rental_fee}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Deposit Authorized:</span>
            <span className="value">${booking.deposit_amount}</span>
          </div>
        </div>

        <div className="next-steps">
          <h3>What's Next?</h3>
          <ul>
            <li>You'll receive a confirmation email shortly</li>
            <li>The item owner will contact you for pickup details</li>
            <li>Your security deposit is on hold and will be released after return</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/my-bookings')} className="primary-btn">
            View My Bookings
          </button>
          <button onClick={() => navigate('/')} className="secondary-btn">
            Browse More Items
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmedPage;