import React, { useState, useEffect, useMemo } from 'react';
import { searchItems, createItem, getMyItems } from './services/api';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import PaymentForm from './components/PaymentForm';
import { 
  Home, Search, PlusCircle, User, MapPin, 
  DollarSign, Package, Wrench, Camera, 
  UtensilsCrossed, PartyPopper, Laptop, Book, LogOut,
  ArrowLeft, Calendar
} from 'lucide-react';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();

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
      const data = await searchItems(43.0481, -76.1474, {
        radius: 20,
        ...(selectedCategory && { category: selectedCategory })
      });
      setItems(data.results || []);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [items, searchQuery]);

  const handleLogout = () => {
    logout();
    setCurrentView('home');
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setCurrentView('itemDetail');
  };

  const handleProceedToCheckout = (checkoutData) => {
    setBookingData(checkoutData);
    setCurrentView('checkout');
  };

  // ==================== HOME VIEW ====================
  const HomeView = () => (
    <div className="home-view">
      <div className="hero-section">
        <h1 className="hero-title">🏙️ CuseRents</h1>
        <p className="hero-subtitle">Rent from Syracuse neighbors</p>
        <p className="hero-tagline">Save money. Save the planet. Build community.</p>
        
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">12</div>
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
              <div key={cat.id} className="category-card" onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentView('browse');
              }}>
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

  // ==================== BROWSE VIEW ====================
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
          autoComplete="off"
        />
      </div>

      <div className="category-filter">
        <button className={`filter-chip ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory('')}>
          All
        </button>
        {categories.map((cat) => (
          <button key={cat.id} className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.id)}>
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
                    <button className="rent-button" onClick={() => handleViewDetails(item)}>
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

  // ==================== ITEM DETAIL VIEW ====================
  const ItemDetailView = () => {
    const [startDate, setStartDate] = useState('');
    const [hours, setHours] = useState(1);

    if (!selectedItem) return null;

    const CategoryIcon = categories.find(c => c.id === selectedItem.category)?.icon || Package;
    const isOwnItem = selectedItem.owner?.username === user?.username;

    const calculateTotal = () => {
      return (parseFloat(selectedItem.price_per_hour) * hours);
    };

    const depositAmount = parseFloat(selectedItem.deposit || 50);

    const handleBooking = () => {
      if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
      }

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
                <span>{selectedItem.distance_km || '0.5'}km away • {selectedItem.address_text}</span>
              </div>
              <p style={{marginTop: '10px', color: 'var(--text-gray)'}}>
                by {selectedItem.owner?.username || 'Unknown'} ⭐ {selectedItem.owner?.rating_avg?.toFixed(1) || '5.0'}
              </p>
            </div>
          </div>

          <div className="detail-body">
            <div className="detail-description">
              <h3>Description</h3>
              <p>{selectedItem.description}</p>
              
              <div style={{marginTop: '25px'}}>
                <h3>Pricing</h3>
                <div className="price-row">
                  <span>Hourly Rate:</span>
                  <span className="price-value">${parseFloat(selectedItem.price_per_hour).toFixed(2)}/hr</span>
                </div>
                {selectedItem.price_per_day && (
                  <div className="price-row">
                    <span>Daily Rate:</span>
                    <span className="price-value">${parseFloat(selectedItem.price_per_day).toFixed(2)}/day</span>
                  </div>
                )}
                <div className="price-row">
                  <span>Security Deposit:</span>
                  <span className="price-value">${depositAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="booking-card">
                <h3>Book This Item</h3>
                
                {isOwnItem ? (
                  <div style={{padding: '20px', textAlign: 'center', background: '#FEE2E2', borderRadius: '8px'}}>
                    <p style={{color: '#991b1b', fontWeight: '600'}}>This is your item</p>
                  </div>
                ) : (
                  <>
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
                        max="168"
                        className="form-input"
                      />
                    </div>

                    {hours > 0 && startDate && (
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== CHECKOUT VIEW ====================
  const CheckoutView = () => {
    if (!bookingData) {
      setCurrentView('browse');
      return null;
    }

    const { item, startDate, hours, rentalFee, depositAmount } = bookingData;
    const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package;

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(startDateTime.getTime() + (hours * 60 * 60 * 1000));

    const backendBookingData = {
      item_id: item.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString()
    };

    const handlePaymentSuccess = (paymentData) => {
      console.log('Payment successful:', paymentData);
      setBookingData({
        ...bookingData,
        bookingCode: paymentData.bookingCode,
        bookingId: paymentData.bookingId
      });
      setCurrentView('bookingConfirmed');
    };

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
                <span>${depositAmount.toFixed(2)}</span>
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
              bookingData={backendBookingData}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      </div>
    );
  };

  // ==================== BOOKING CONFIRMED VIEW ====================
  const BookingConfirmedView = () => {
    const bookingCode = bookingData?.bookingCode || 'N/A';

    return (
      <div className="confirmation-view">
        <div className="confirmation-card">
          <div className="success-icon">✅</div>
          <h1>Booking Confirmed!</h1>
          <p className="confirmation-message">
            Your rental has been successfully booked and payment processed.
          </p>

          <div style={{
            background: '#F76900',
            color: 'white',
            padding: '25px',
            borderRadius: '12px',
            margin: '30px 0'
          }}>
            <p style={{fontSize: '1rem', marginBottom: '10px', opacity: 0.9}}>Your Booking Code</p>
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              letterSpacing: '6px',
              fontFamily: '"Courier New", monospace'
            }}>
              {bookingCode}
            </div>
            <p style={{fontSize: '0.9rem', marginTop: '10px', opacity: 0.9}}>
              Show this code when picking up the item
            </p>
          </div>

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
                <span>${bookingData.depositAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="next-steps-card">
            <h3>What's Next?</h3>
            <ul>
              <li>✅ Booking code: <strong>{bookingCode}</strong> - saved to your account</li>
              <li>📧 Check your email for confirmation</li>
              <li>👤 The owner will contact you for pickup details</li>
              <li>💳 Deposit will be released after safe return</li>
              <li>⭐ Leave a review to earn bonus reward points!</li>
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
  };

  // ==================== LIST ITEM VIEW ====================
  const ListItemView = () => {
    const [formData, setFormData] = useState({
      title: '', description: '', category: '', price_per_hour: '', price_per_day: '',
      deposit: '', address_text: '', lat: '', lng: '', photo_url: '', carbon_offset_kg: 5
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isAuthenticated) {
      return (
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please login to list items for rent</p>
          <button className="cta-button" onClick={() => setShowAuthModal(true)}>Login or Sign Up</button>
        </div>
      );
    }

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setError('');
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError('');

      if (!formData.title || !formData.category || !formData.price_per_hour || !formData.address_text) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      try {
        const itemData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price_per_hour: parseFloat(formData.price_per_hour),
          price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
          deposit: parseFloat(formData.deposit) || 50,
          address_text: formData.address_text,
          lat: parseFloat(formData.lat) || 43.0481,
          lng: parseFloat(formData.lng) || -76.1474,
          photo_url: formData.photo_url || 'https://via.placeholder.com/400?text=No+Image',
          carbon_offset_kg: parseInt(formData.carbon_offset_kg) || 5,
          is_available: true
        };

        await createItem(itemData);
        setSuccess(true);
        setFormData({ title: '', description: '', category: '', price_per_hour: '', price_per_day: '',
          deposit: '', address_text: '', lat: '', lng: '', photo_url: '', carbon_offset_kg: 5 });

        setTimeout(() => {
          setCurrentView('browse');
          setSuccess(false);
          fetchItems();
        }, 2000);
      } catch (err) {
        console.error('Error creating item:', err);
        setError(err.response?.data?.detail || 'Failed to create item');
      } finally {
        setSubmitting(false);
      }
    };

    if (success) {
      return (
        <div className="success-message-page">
          <div className="success-icon">✅</div>
          <h2>Item Listed Successfully!</h2>
          <p>Your item is now available for rent.</p>
          <p className="redirect-message">Redirecting to browse page...</p>
        </div>
      );
    }

    return (
      <div className="list-view">
        <h2 className="page-title">List an Item for Rent</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group">
            <label>Item Name</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., DeWalt Cordless Drill" className="form-input" required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="form-input" required>
              <option value="">Select category...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows="3" placeholder="Describe your item..." required></textarea>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price per Hour ($)</label>
              <input type="number" name="price_per_hour" value={formData.price_per_hour} onChange={handleChange} step="0.01" min="0.01" placeholder="3.00" className="form-input" required />
            </div>
            <div className="form-group">
              <label>Price per Day ($)</label>
              <input type="number" name="price_per_day" value={formData.price_per_day} onChange={handleChange} step="0.01" placeholder="20.00" className="form-input" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Deposit ($)</label>
              <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} step="0.01" placeholder="50.00" className="form-input" />
            </div>
            <div className="form-group">
              <label>CO₂ Offset (kg)</label>
              <input type="number" name="carbon_offset_kg" value={formData.carbon_offset_kg} onChange={handleChange} placeholder="5" className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" name="address_text" value={formData.address_text} onChange={handleChange} placeholder="e.g., 100 Winding Ridge Rd, Syracuse, NY" className="form-input" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude (optional)</label>
              <input type="number" name="lat" value={formData.lat} onChange={handleChange} step="0.000001" placeholder="43.0481" className="form-input" />
            </div>
            <div className="form-group">
              <label>Longitude (optional)</label>
              <input type="number" name="lng" value={formData.lng} onChange={handleChange} step="0.000001" placeholder="-76.1474" className="form-input" />
            </div>
          </div>
          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? <><div className="spinner-small"></div>Creating...</> : <><PlusCircle size={20} />List Item</>}
          </button>
        </form>
        <div className="info-box">
          <h4>💡 Listing Tips</h4>
          <ul>
            <li>Price competitively (check similar items)</li>
            <li>Write clear descriptions</li>
            <li>Use Syracuse addresses</li>
            <li>Set realistic deposits</li>
          </ul>
        </div>
      </div>
    );
  };

  // ==================== PROFILE VIEW ====================
  const ProfileView = () => {
    const [myItems, setMyItems] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItemId, setDeletingItemId] = useState(null);

    useEffect(() => {
      if (isAuthenticated && currentView === 'profile') {
        fetchMyItems();
        fetchMyBookings();
      }
    }, [isAuthenticated, currentView]);

    const fetchMyItems = async () => {
      setLoadingItems(true);
      try {
        const data = await getMyItems();
        const userItems = data.results?.filter(item => item.owner?.username === user?.username) || [];
        setMyItems(userItems);
      } catch (err) {
        console.error('Error fetching my items:', err);
      } finally {
        setLoadingItems(false);
      }
    };

    const fetchMyBookings = async () => {
      setLoadingBookings(true);
      try {
        const { getMyBookings } = await import('./services/api');
        const data = await getMyBookings();
        const bookingsArray = data.results || data || [];
        setMyBookings(Array.isArray(bookingsArray) ? bookingsArray : []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    const handleDelete = async (itemId) => {
      if (!window.confirm('Are you sure you want to delete this item?')) return;
      setDeletingItemId(itemId);
      try {
        const { deleteItem } = await import('./services/api');
        await deleteItem(itemId);
        await fetchMyItems();
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item');
      } finally {
        setDeletingItemId(null);
      }
    };

    const handleEditSuccess = async () => {
      await fetchMyItems();
    };

    const handleAcceptBooking = async (bookingId) => {
      try {
        const { acceptBooking } = await import('./services/api');
        await acceptBooking(bookingId);
        await fetchMyBookings();
        alert('Booking accepted! ✅');
      } catch (err) {
        console.error('Error accepting booking:', err);
        alert('Failed to accept booking');
      }
    };

    const handleRejectBooking = async (bookingId) => {
      if (!window.confirm('Are you sure you want to reject this booking?')) return;
      try {
        const { rejectBooking } = await import('./services/api');
        await rejectBooking(bookingId);
        await fetchMyBookings();
        alert('Booking rejected');
      } catch (err) {
        console.error('Error rejecting booking:', err);
        alert('Failed to reject booking');
      }
    };

    if (!isAuthenticated) {
      return (
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please login to view your profile</p>
          <button className="cta-button" onClick={() => setShowAuthModal(true)}>Login or Sign Up</button>
        </div>
      );
    }

    const myRentalRequests = myBookings.filter(b => b.renter?.username === user?.username);
    const bookingRequests = myBookings.filter(b => b.owner?.username === user?.username);

    return (
      <div className="profile-view">
        <div className="profile-card">
          <div className="profile-avatar">
            <User size={64} color="#F76900" />
          </div>
          <h2>{user?.first_name} {user?.last_name}</h2>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="stat-value">{user?.rating_avg?.toFixed(1) || '5.0'} ⭐</div>
              <div className="stat-name">Rating</div>
            </div>
            <div className="profile-stat">
              <div className="stat-value">{user?.wallet_points || 0}</div>
              <div className="stat-name">Points</div>
            </div>
            <div className="profile-stat">
              <div className="stat-value">{user?.co2_saved_kg || 0}kg</div>
              <div className="stat-name">CO₂ Saved</div>
            </div>
          </div>
          <div className="wallet-balance">
            <p>Wallet Balance: <strong>${user?.wallet_balance || '0.00'}</strong></p>
          </div>
        </div>

        <div className="profile-section">
          <h3>📬 Booking Requests for My Items ({bookingRequests.length})</h3>
          {loadingBookings ? (
            <div className="loading"><div className="spinner-small"></div><p>Loading...</p></div>
          ) : bookingRequests.length > 0 ? (
            <div className="bookings-list">
              {bookingRequests.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <span className="booking-code">{booking.booking_code}</span>
                    <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                  </div>
                  <h4>{booking.item?.title}</h4>
                  <p className="booking-renter">Requested by: {booking.renter?.username}</p>
                  <p className="booking-time">📅 {new Date(booking.start_time).toLocaleString()} → {new Date(booking.end_time).toLocaleString()}</p>
                  <p className="booking-price">💰 ${parseFloat(booking.total_price).toFixed(2)}</p>
                  {booking.status === 'pending' && (
                    <div className="booking-actions">
                      <button className="btn-accept" onClick={() => handleAcceptBooking(booking.id)}>✅ Accept</button>
                      <button className="btn-reject" onClick={() => handleRejectBooking(booking.id)}>❌ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No booking requests yet</p>
          )}
        </div>

        <div className="profile-section">
          <h3>📦 My Rental Requests ({myRentalRequests.length})</h3>
          {loadingBookings ? (
            <div className="loading"><div className="spinner-small"></div><p>Loading...</p></div>
          ) : myRentalRequests.length > 0 ? (
            <div className="bookings-list">
              {myRentalRequests.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <span className="booking-code">{booking.booking_code}</span>
                    <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                  </div>
                  <h4>{booking.item?.title}</h4>
                  <p className="booking-owner">Owner: {booking.owner?.username}</p>
                  <p className="booking-time">📅 {new Date(booking.start_time).toLocaleString()} → {new Date(booking.end_time).toLocaleString()}</p>
                  <p className="booking-price">💰 ${parseFloat(booking.total_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No active bookings. Browse items to rent!</p>
          )}
        </div>

        <div className="profile-section">
          <h3>My Listings ({myItems.length})</h3>
          {loadingItems ? (
            <div className="loading"><div className="spinner-small"></div><p>Loading...</p></div>
          ) : myItems.length > 0 ? (
            <div className="my-items-list">
              {myItems.map((item) => {
                const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package;
                const isDeleting = deletingItemId === item.id;
                return (
                  <div key={item.id} className="my-item-row">
                    <div className="my-item-main">
                      <CategoryIcon size={32} color="#F76900" />
                      <div className="my-item-details">
                        <h4>{item.title}</h4>
                        <p className="item-meta">${parseFloat(item.price_per_hour).toFixed(2)}/hr • {item.address_text}</p>
                        <span className={`item-status ${item.is_available ? 'available' : 'rented'}`}>
                          {item.is_available ? '● Available' : '● Rented'}
                        </span>
                      </div>
                    </div>
                    <div className="my-item-actions">
                      <button className="btn-edit" onClick={() => setEditingItem(item)} disabled={isDeleting}>✏️ Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(item.id)} disabled={isDeleting}>{isDeleting ? '⏳' : '🗑️'} Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <p className="empty-state">You haven't listed any items yet.</p>
              <button className="secondary-button" onClick={() => setCurrentView('list')}>List Your First Item</button>
            </>
          )}
        </div>

        {editingItem && (
          <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSuccess={handleEditSuccess} categories={categories} />
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => setCurrentView('home')}>🏙️ CuseRents</div>
          <div className="nav-links">
            <button className={`nav-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => setCurrentView('home')}>
              <Home size={20} /><span>Home</span>
            </button>
            <button className={`nav-link ${currentView === 'browse' ? 'active' : ''}`} onClick={() => setCurrentView('browse')}>
              <Search size={20} /><span>Browse</span>
            </button>
            <button className={`nav-link ${currentView === 'list' ? 'active' : ''}`} onClick={() => setCurrentView('list')}>
              <PlusCircle size={20} /><span>List Item</span>
            </button>
            <button className={`nav-link ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setCurrentView('profile')}>
              <User size={20} /><span>Profile</span>
            </button>
            {!isAuthenticated ? (
              <button className="nav-link" onClick={() => setShowAuthModal(true)} style={{background: 'var(--orange)', color: 'white'}}>
                <User size={20} /><span>Login</span>
              </button>
            ) : (
              <>
                <span className="nav-user">👤 {user?.username}</span>
                <button className="nav-link" onClick={handleLogout}><LogOut size={20} /><span>Logout</span></button>
              </>
            )}
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

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

export default App;