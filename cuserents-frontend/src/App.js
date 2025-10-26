import React, { useState, useEffect } from 'react';
import { searchItems } from './services/api';
import { 
  Home, Search, PlusCircle, User, MapPin, 
  DollarSign, Package, Wrench, Camera, 
  UtensilsCrossed, PartyPopper, Laptop, Book,
  ArrowLeft, Calendar
} from 'lucide-react';
import './App.css';

import PaymentForm from './components/PaymentForm';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingData, setBookingData] = useState(null);

  const categories = [
    { id: 'tools', name: 'Tools', icon: Wrench, color: '#F76900' },
    { id: 'camera', name: 'Camera', icon: Camera, color: '#FF8C42' },
    { id: 'electronics', name: 'Electronics', icon: Laptop, color: '#D44500' },
    { id: 'kitchen', name: 'Kitchen', icon: UtensilsCrossed, color: '#F76900' },
    { id: 'party', name: 'Party', icon: PartyPopper, color: '#FF8C42' },
    { id: 'sports', name: 'Sports', icon: Package, color: '#D44500' },
    { id: 'books', name: 'Books', icon: Book, color: '#F76900' },
    { id: 'other', name: 'Other', icon: Package, color: '#FF8C42' },
  ];

  useEffect(() => {
    if (currentView === 'browse') {
      fetchItems();
    }
  }, [currentView, selectedCategory]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await searchItems(43.0361, -76.1275, {
        radius: 5,
        ...(selectedCategory && { category: selectedCategory })
      });
      setItems(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setCurrentView('itemDetail');
  };

  const handleProceedToCheckout = (checkoutData) => {
    setBookingData(checkoutData);
    setCurrentView('checkout');
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    setCurrentView('bookingConfirmed');
  };

  const HomeView = () => (
    <div className="home-view">
      <div className="hero-section">
        <h1 className="hero-title">🏙️ CuseRents</h1>
        <p className="hero-subtitle">Rent from Syracuse neighbors</p>
        <p className="hero-tagline">Save money. Save the planet. Build community.</p>
        
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">{items.length || 12}</div>
            <div className="stat-label">Items Available</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">95kg</div>
            <div className="stat-label">CO₂ Saved</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">$2,400</div>
            <div className="stat-label">Money Saved</div>
          </div>
        </div>

        <button className="cta-button" onClick={() => setCurrentView('browse')}>
          <Search size={20} />
          Browse Items Near You
        </button>
      </div>

      <div className="categories-section">
        <h2 className="section-title">Browse by Category</h2>
        <div className="category-grid">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentView('browse');
                }}
              >
                <IconComponent size={40} color={cat.color} />
                <span className="category-name">{cat.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Search</h3>
            <p>Find items near campus</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Rent</h3>
            <p>Book by hour or day</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Meet</h3>
            <p>Pick up from neighbor</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Return</h3>
            <p>Leave a review</p>
          </div>
        </div>
      </div>
    </div>
  );

  const BrowseView = () => (
    <div className="browse-view">
      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search for drills, cameras, tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="category-filter">
        <button
          className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory('')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Finding items near you...</p>
        </div>
      ) : (
        <>
          <div className="results-header">
            Found {filteredItems.length} items near Syracuse University
          </div>

          <div className="items-grid">
            {filteredItems.map((item) => {
              const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package;
              return (
                <div key={item.id} className="item-tile">
                  <div className="item-icon-wrapper">
                    <CategoryIcon size={48} color="#F76900" />
                  </div>
                  <div className="item-info">
                    <h3 className="item-name">{item.title}</h3>
                    <p className="item-desc">{item.description}</p>
                    <div className="item-details">
                      <div className="item-price">
                        <DollarSign size={16} />
                        <span className="price">{parseFloat(item.price_per_hour).toFixed(2)}</span>
                        <span className="unit">/hr</span>
                      </div>
                      <div className="item-distance">
                        <MapPin size={16} />
                        <span>{item.distance_km || '0.5'}km</span>
                      </div>
                    </div>
                    <button 
                      className="rent-button"
                      onClick={() => handleViewDetails(item)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const ItemDetailView = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [hours, setHours] = useState(1);

    if (!selectedItem) return null;

    const CategoryIcon = categories.find(c => c.id === selectedItem.category)?.icon || Package;

    const calculateTotal = () => {
      return (parseFloat(selectedItem.price_per_hour) * hours);
    };

    const depositAmount = parseFloat(selectedItem.deposit || 50);

    const handleBooking = () => {
      if (!startDate || !hours) {
        alert('Please select rental date and duration');
        return;
      }

      handleProceedToCheckout({
        item: selectedItem,
        startDate,
        hours,
        rentalFee: parseFloat(calculateTotal()),
        depositAmount: depositAmount
      });
    };

    return (
      <div className="item-detail-view">
        <button className="back-button" onClick={() => setCurrentView('browse')}>
          <ArrowLeft size={20} />
          Back to Browse
        </button>

        <div className="detail-container">
          <div className="detail-header">
            <div className="detail-icon-wrapper">
              <CategoryIcon size={80} color="#F76900" />
            </div>
            <div className="detail-header-info">
              <h1>{selectedItem.title}</h1>
              <p className="detail-category">{selectedItem.category}</p>
              <div className="detail-location">
                <MapPin size={16} />
                <span>{selectedItem.distance_km || '0.5'}km away</span>
              </div>
            </div>
          </div>

          <div className="detail-body">
            <div className="detail-description">
              <h3>Description</h3>
              <p>{selectedItem.description}</p>
            </div>

            <div className="pricing-card">
              <h3>Pricing</h3>
              <div className="price-row">
                <span>Hourly Rate:</span>
                <span className="price-value">${parseFloat(selectedItem.price_per_hour).toFixed(2)}/hr</span>
              </div>
              <div className="price-row">
                <span>Security Deposit:</span>
                <span className="price-value">${depositAmount}</span>
              </div>
            </div>

            <div className="booking-card">
              <h3>Book This Item</h3>
              
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  Rental Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Duration (hours)</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                  min="1"
                  className="form-input"
                />
              </div>

              {hours > 0 && (
        <div className="booking-summary">
    <div className="summary-row">
      <span>Rental Fee ({hours} hrs):</span>
      <span>${calculateTotal().toFixed(2)}</span>
    </div>
    <div className="summary-row">
      <span>Deposit (hold):</span>
      <span>${depositAmount.toFixed(2)}</span>
    </div>
    <div className="summary-row total">
      <span>Total Authorization:</span>
      <span>${(calculateTotal() + depositAmount).toFixed(2)}</span>
    </div>
  </div>
              )}

              <button className="book-button" onClick={handleBooking}>
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CheckoutView = () => {
    if (!bookingData) {
      setCurrentView('browse');
      return null;
    }

    const { item, startDate, hours, rentalFee, depositAmount } = bookingData;
    const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package;

    return (
      <div className="checkout-view">
        <button className="back-button" onClick={() => setCurrentView('itemDetail')}>
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="page-title">Complete Your Booking</h1>

        <div className="checkout-container">
          <div className="order-summary-card">
            <h2>Order Summary</h2>
            
            <div className="summary-item-preview">
              <div className="summary-icon">
                <CategoryIcon size={40} color="#F76900" />
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>

            <div className="summary-details">
              <div className="summary-detail-row">
                <span>Start Date:</span>
                <span>{startDate}</span>
              </div>
              <div className="summary-detail-row">
                <span>Duration:</span>
                <span>{hours} hours</span>
              </div>
              <div className="summary-detail-row">
                <span>Hourly Rate:</span>
                <span>${parseFloat(item.price_per_hour).toFixed(2)}/hr</span>
              </div>
            </div>

            <div className="summary-pricing">
              <div className="summary-price-row">
                <span>Rental Fee:</span>
                <span>${rentalFee.toFixed(2)}</span>
              </div>
              <div className="summary-price-row deposit">
                <span>Security Deposit (hold):</span>
                <span>${depositAmount}</span>
              </div>
              <div className="summary-price-row total">
                <span>Total Authorization:</span>
                <span>${(rentalFee + depositAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="deposit-notice">
              💳 The security deposit will be held on your card but not charged. 
              It will be released after you return the item in good condition.
            </div>
          </div>

          <div className="payment-card">
            <h2>Payment Details</h2>
          <PaymentForm
            rentalAmount={rentalFee}
            depositAmount={depositAmount}
            bookingId={null}
            onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      </div>
    );
  };

  const BookingConfirmedView = () => (
    <div className="confirmation-view">
      <div className="confirmation-card">
        <div className="success-icon">✓</div>
        <h1>Booking Confirmed!</h1>
        <p className="confirmation-message">
          Your rental has been successfully booked and payment processed.
        </p>

        {bookingData && (
          <div className="confirmation-details">
            <h3>Booking Details</h3>
            <div className="confirmation-row">
              <span>Item:</span>
              <span>{bookingData.item.title}</span>
            </div>
            <div className="confirmation-row">
              <span>Start Date:</span>
              <span>{bookingData.startDate}</span>
            </div>
            <div className="confirmation-row">
              <span>Duration:</span>
              <span>{bookingData.hours} hours</span>
            </div>
            <div className="confirmation-row">
              <span>Rental Fee Paid:</span>
              <span>${bookingData.rentalFee.toFixed(2)}</span>
            </div>
            <div className="confirmation-row">
              <span>Deposit Authorized:</span>
              <span>${bookingData.depositAmount}</span>
            </div>
          </div>
        )}

        <div className="next-steps-card">
          <h3>What's Next?</h3>
          <ul>
            <li>You'll receive a confirmation email shortly</li>
            <li>The item owner will contact you for pickup details</li>
            <li>Your security deposit will be released after return</li>
          </ul>
        </div>

        <div className="confirmation-actions">
          <button className="primary-button" onClick={() => setCurrentView('profile')}>
            View My Rentals
          </button>
          <button className="secondary-button" onClick={() => setCurrentView('browse')}>
            Browse More Items
          </button>
        </div>
      </div>
    </div>
  );

  const ListItemView = () => (
    <div className="list-view">
      <h2 className="page-title">List an Item for Rent</h2>
      
      <div className="form-card">
        <div className="form-group">
          <label>Item Name</label>
          <input type="text" placeholder="e.g., DeWalt Cordless Drill" className="form-input" />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select className="form-input">
            <option>Select category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea className="form-input" rows="3" placeholder="Describe your item..."></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price per Hour ($)</label>
            <input type="number" placeholder="3.00" className="form-input" />
          </div>
          <div className="form-group">
            <label>Deposit ($)</label>
            <input type="number" placeholder="20.00" className="form-input" />
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input type="text" placeholder="Your address" className="form-input" />
        </div>

        <button className="submit-button">
          <PlusCircle size={20} />
          List Item
        </button>
      </div>

      <div className="info-box">
        <h4>💡 Listing Tips</h4>
        <ul>
          <li>Price competitively (check similar items)</li>
          <li>Write clear descriptions</li>
          <li>Respond quickly to requests</li>
          <li>Keep items clean and ready</li>
        </ul>
      </div>
    </div>
  );

  const ProfileView = () => (
    <div className="profile-view">
      <div className="profile-card">
        <div className="profile-avatar">
          <User size={64} color="#F76900" />
        </div>
        <h2>Demo User</h2>
        <p className="profile-email">demo@cuserents.com</p>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="stat-value">4.8 ⭐</div>
            <div className="stat-name">Rating</div>
          </div>
          <div className="profile-stat">
            <div className="stat-value">12</div>
            <div className="stat-name">Rentals</div>
          </div>
          <div className="profile-stat">
            <div className="stat-value">45kg</div>
            <div className="stat-name">CO₂ Saved</div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>My Listings</h3>
        <p className="empty-state">You haven't listed any items yet.</p>
        <button className="secondary-button" onClick={() => setCurrentView('list')}>
          List Your First Item
        </button>
      </div>

      <div className="profile-section">
        <h3>My Rentals</h3>
        <p className="empty-state">No active rentals.</p>
      </div>
    </div>
  );

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => setCurrentView('home')}>
            🏙️ CuseRents
          </div>
          <div className="nav-links">
            <button 
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              <Home size={20} />
              <span>Home</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => setCurrentView('browse')}
            >
              <Search size={20} />
              <span>Browse</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'list' ? 'active' : ''}`}
              onClick={() => setCurrentView('list')}
            >
              <PlusCircle size={20} />
              <span>List Item</span>
            </button>
            <button 
              className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentView('profile')}
            >
              <User size={20} />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'home' && <HomeView />}
        {currentView === 'browse' && <BrowseView />}
        {currentView === 'itemDetail' && <ItemDetailView />}
        {currentView === 'checkout' && <CheckoutView />}
        {currentView === 'bookingConfirmed' && <BookingConfirmedView />}
        {currentView === 'list' && <ListItemView />}
        {currentView === 'profile' && <ProfileView />}
      </main>

      <footer className="footer">
        <p>🍊 Built for Syracuse University • Sharing Economy for a Sustainable Future</p>
      </footer>
    </div>
  );
}

export default App;