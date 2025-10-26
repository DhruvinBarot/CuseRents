import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, MapPin } from 'lucide-react';

const BookingModal = ({ item, onClose, onSuccess }) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingCode, setBookingCode] = useState(null);

  // Calculate pricing
  const calculatePrice = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      return { hours: 0, total: 0, deposit: 0 };
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    const days = hours / 24;

    const hourlyPrice = parseFloat(item.price_per_hour) * hours;
    const dailyPrice = item.price_per_day ? parseFloat(item.price_per_day) * days : Infinity;
    
    const total = Math.min(hourlyPrice, dailyPrice);
    const deposit = parseFloat(item.deposit) || 0;

    return { 
      hours: hours.toFixed(1), 
      days: days.toFixed(1),
      total: total.toFixed(2), 
      deposit: deposit.toFixed(2),
      grandTotal: (total + deposit).toFixed(2)
    };
  };

  const pricing = calculatePrice();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!startDate || !startTime || !endDate || !endTime) {
      setError('Please select start and end date/time');
      setSubmitting(false);
      return;
    }

    try {
      const { createBooking } = await import('../services/api');
      
      const bookingData = {
        item_id: item.id,
        start_time: new Date(`${startDate}T${startTime}`).toISOString(),
        end_time: new Date(`${endDate}T${endTime}`).toISOString(),
        wallet_credit_used: useWallet ? 0 : 0 // TODO: implement wallet deduction
      };

      const result = await createBooking(bookingData);
      setBookingCode(result.booking_code);
      
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Error creating booking:', err);
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.non_field_errors?.[0] ||
                      'Failed to create booking. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Success view
  if (bookingCode) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>

          <div className="booking-success">
            <div className="success-icon">🎉</div>
            <h2>Booking Request Sent!</h2>
            <p>Your booking code:</p>
            <div className="booking-code-display">{bookingCode}</div>
            <p className="booking-note">
              The owner will review your request. You'll be notified once approved!
            </p>
            <button className="cta-button" onClick={onClose}>
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Booking form
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="modal-title">Book {item.title}</h2>
        <p className="modal-subtitle">Choose your rental period</p>

        {/* Item Info */}
        <div className="booking-item-info">
          <h4>{item.title}</h4>
          <p><MapPin size={16} /> {item.address_text}</p>
          <p><DollarSign size={16} /> ${parseFloat(item.price_per_hour).toFixed(2)}/hr
            {item.price_per_day && ` or $${parseFloat(item.price_per_day).toFixed(2)}/day`}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-row">
            <div className="form-group">
              <label><Calendar size={16} /> Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label><Clock size={16} /> Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Calendar size={16} /> End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label><Clock size={16} /> End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Price Summary */}
          {pricing.hours > 0 && (
            <div className="price-summary">
              <h4>Price Summary</h4>
              <div className="price-row">
                <span>Rental Duration:</span>
                <span>{pricing.hours} hours ({pricing.days} days)</span>
              </div>
              <div className="price-row">
                <span>Rental Price:</span>
                <span>${pricing.total}</span>
              </div>
              <div className="price-row">
                <span>Security Deposit:</span>
                <span>${pricing.deposit}</span>
              </div>
              <div className="price-row total">
                <span>Total:</span>
                <span>${pricing.grandTotal}</span>
              </div>
              <p className="price-note">
                💡 Deposit will be refunded after safe return
              </p>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={submitting || pricing.hours <= 0}
            >
              {submitting ? (
                <>
                  <div className="spinner-small"></div>
                  Requesting...
                </>
              ) : (
                <>
                  📅 Request Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;