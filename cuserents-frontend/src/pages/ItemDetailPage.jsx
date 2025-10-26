import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ItemDetailPage.css';

function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/items/${itemId}/`
      );
      setItem(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching item:', error);
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    return days * (item?.daily_rate || 0);
  };

  // FIX: Get deposit amount as a number
  const getDepositAmount = () => {
    return parseFloat(item?.deposit_amount || 50);
  };

  const handleBookNow = () => {
    if (!startDate || !endDate) {
      alert('Please select rental dates');
      return;
    }

    // Navigate to checkout with booking details
    navigate('/checkout', {
      state: {
        item: item,
        startDate: startDate,
        endDate: endDate,
        days: calculateDays(),
        rentalFee: calculateTotal(),
        depositAmount: getDepositAmount() // FIX: Use the helper function
      }
    });
  };

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="item-detail-page">
      <div className="item-container">
        <div className="item-images">
          <img 
            src={item.image || '/placeholder-item.jpg'} 
            alt={item.name} 
          />
        </div>

        <div className="item-info">
          <h1>{item.name}</h1>
          <p className="item-description">{item.description}</p>
          
          <div className="pricing-info">
            <div className="price-row">
              <span className="label">Daily Rate:</span>
              <span className="price">${item.daily_rate}/day</span>
            </div>
            <div className="price-row">
              <span className="label">Security Deposit:</span>
              <span className="price">${getDepositAmount()}</span>
            </div>
          </div>

          <div className="booking-section">
            <h3>Select Rental Dates</h3>
            
            <div className="date-inputs">
              <div className="date-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="date-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            {calculateDays() > 0 && (
              <div className="rental-summary">
                <div className="summary-row">
                  <span>Duration:</span>
                  <span>{calculateDays()} days</span>
                </div>
                <div className="summary-row">
                  <span>Rental Fee:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Deposit (hold):</span>
                  <span>${getDepositAmount().toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Authorization:</span>
                  <span>${(calculateTotal() + getDepositAmount()).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              className="book-now-btn"
              onClick={handleBookNow}
              disabled={!startDate || !endDate}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailPage;