import React, { useState, useEffect, useMemo } from 'react';
import { searchItems, createItem, getMyItems } from './services/api';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import EditItemModal from './components/EditItemModal';
import { 
  Home, Search, PlusCircle, User, MapPin, 
  DollarSign, Package, Wrench, Camera, 
  UtensilsCrossed, PartyPopper, Laptop, Book, LogOut 
} from 'lucide-react';
import './App.css';

function App() {
  // State management
  const [currentView, setCurrentView] = useState('home');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Auth context
  const { user, isAuthenticated, logout } = useAuth();

  // Categories configuration
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

  // Fetch items when browse view or category changes
  useEffect(() => {
    if (currentView === 'browse') {
      fetchItems();
    }
  }, [currentView, selectedCategory]);

  // Fetch items from API
  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await searchItems(43.0361, -76.1275, {
        radius: 5,
        ...(selectedCategory && { category: selectedCategory })
      });
      setItems(data.results || []);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items by search query (optimized with useMemo)
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    
    return items.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return title.includes(query) || description.includes(query);
    });
  }, [items, searchQuery]);

  // Handle logout
  const handleLogout = () => {
    logout();
    setCurrentView('home');
  };

  // ==================== HOME VIEW ====================
  const HomeView = () => (
    <div className="home-view">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">🏙️ CuseRents</h1>
        <p className="hero-subtitle">Rent from Syracuse neighbors</p>
        <p className="hero-tagline">Save money. Save the planet. Build community.</p>
        
        {/* Stats */}
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

      {/* Categories Section */}
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

      {/* How It Works Section */}
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
  const BrowseView = () => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleBookItem = (item) => {
      if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
      }
      setSelectedItem(item);
    };

    const handleBookingSuccess = () => {
      setSelectedItem(null);
      // Optionally show success message or redirect to profile
    };

    return (
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
                const isOwnItem = item.owner?.username === user?.username;
                
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
                      <div className="item-owner-info">
                        <span>by {item.owner?.username || 'Unknown'}</span>
                      </div>
                      {isOwnItem ? (
                        <button className="rent-button" disabled style={{opacity: 0.6}}>
                          Your Item
                        </button>
                      ) : (
                        <button 
                          className="rent-button"
                          onClick={() => handleBookItem(item)}
                        >
                          📅 Book Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {selectedItem && (
          <BookingModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    );
  };

  // ==================== LIST ITEM VIEW ====================
  const ListItemView = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      category: '',
      price_per_hour: '',
      price_per_day: '',
      deposit: '',
      address_text: '',
      lat: '',
      lng: '',
      photo_url: '',
      carbon_offset_kg: 5
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Require authentication to list items
    if (!isAuthenticated) {
      return (
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please login to list items for rent</p>
          <button className="cta-button" onClick={() => setShowAuthModal(true)}>
            Login or Sign Up
          </button>
        </div>
      );
    }

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
      setError('');
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError('');

      // Validation
      if (!formData.title || !formData.category || !formData.price_per_hour) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      if (!formData.address_text) {
        setError('Please provide an address');
        setSubmitting(false);
        return;
      }

      try {
        // Prepare data
        const itemData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price_per_hour: parseFloat(formData.price_per_hour),
          price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
          deposit: parseFloat(formData.deposit) || 0,
          address_text: formData.address_text,
          lat: parseFloat(formData.lat) || 43.0361,
          lng: parseFloat(formData.lng) || -76.1275,
          photo_url: formData.photo_url || 'https://via.placeholder.com/400?text=No+Image',
          carbon_offset_kg: parseInt(formData.carbon_offset_kg) || 5,
          is_available: true
        };

        // Create item
        await createItem(itemData);
        
        // Show success
        setSuccess(true);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          price_per_hour: '',
          price_per_day: '',
          deposit: '',
          address_text: '',
          lat: '',
          lng: '',
          photo_url: '',
          carbon_offset_kg: 5
        });

        // Redirect to browse after 2 seconds
        setTimeout(() => {
          setCurrentView('browse');
          setSuccess(false);
          fetchItems();
        }, 2000);

      } catch (err) {
        console.error('Error creating item:', err);
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.title?.[0] ||
                            err.response?.data?.category?.[0] ||
                            'Failed to create item. Please try again.';
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    };

    // Success page
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

    // List item form
    return (
      <div className="list-view">
        <h2 className="page-title">List an Item for Rent</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group">
            <label>Item Name</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., DeWalt Cordless Drill" 
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input" 
              rows="3" 
              placeholder="Describe your item, its condition, and any special instructions..."
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price per Hour ($)</label>
              <input 
                type="number" 
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                placeholder="3.00" 
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Price per Day ($)</label>
              <input 
                type="number" 
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                step="0.01"
                placeholder="20.00" 
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Deposit ($)</label>
              <input 
                type="number" 
                name="deposit"
                value={formData.deposit}
                onChange={handleChange}
                step="0.01"
                placeholder="20.00" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>CO₂ Offset (kg)</label>
              <input 
                type="number" 
                name="carbon_offset_kg"
                value={formData.carbon_offset_kg}
                onChange={handleChange}
                placeholder="5" 
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input 
              type="text" 
              name="address_text"
              value={formData.address_text}
              onChange={handleChange}
              placeholder="e.g., 100 Winding Ridge Rd, Syracuse, NY" 
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude (optional)</label>
              <input 
                type="number" 
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                step="0.000001"
                placeholder="43.0361" 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Longitude (optional)</label>
              <input 
                type="number" 
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                step="0.000001"
                placeholder="-76.1275" 
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Photo URL (optional)</label>
            <input 
              type="url" 
              name="photo_url"
              value={formData.photo_url}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg" 
              className="form-input"
            />
            <small style={{color: 'var(--text-gray)', fontSize: '0.85rem'}}>
              Leave blank to use placeholder image
            </small>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner-small"></div>
                Creating...
              </>
            ) : (
              <>
                <PlusCircle size={20} />
                List Item
              </>
            )}
          </button>
        </form>

        <div className="info-box">
          <h4>💡 Listing Tips</h4>
          <ul>
            <li>Price competitively (check similar items in Browse)</li>
            <li>Write clear, detailed descriptions</li>
            <li>Use Syracuse addresses for accurate distance calculations</li>
            <li>Set realistic deposits to protect your item</li>
            <li>Respond quickly to rental requests</li>
          </ul>
        </div>
      </div>
    );
  };

  // ==================== PROFILE VIEW ====================
  const ProfileView = () => {
    const [myItems, setMyItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItemId, setDeletingItemId] = useState(null);

    useEffect(() => {
      if (isAuthenticated && currentView === 'profile') {
        fetchMyItems();
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

    const handleDelete = async (itemId) => {
      if (!window.confirm('Are you sure you want to delete this item?')) {
        return;
      }

      setDeletingItemId(itemId);
      try {
        const { deleteItem } = await import('./services/api');
        await deleteItem(itemId);
        await fetchMyItems(); // Refresh list
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item. Please try again.');
      } finally {
        setDeletingItemId(null);
      }
    };

    const handleEditSuccess = async () => {
      await fetchMyItems();
    };

    if (!isAuthenticated) {
      return (
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please login to view your profile</p>
          <button className="cta-button" onClick={() => setShowAuthModal(true)}>
            Login or Sign Up
          </button>
        </div>
      );
    }

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
          <h3>My Listings ({myItems.length})</h3>
          {loadingItems ? (
            <div className="loading">
              <div className="spinner-small"></div>
              <p>Loading your items...</p>
            </div>
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
                        <p className="item-meta">
                          ${parseFloat(item.price_per_hour).toFixed(2)}/hr • {item.address_text}
                        </p>
                        <span className={`item-status ${item.is_available ? 'available' : 'rented'}`}>
                          {item.is_available ? '● Available' : '● Rented'}
                        </span>
                      </div>
                    </div>
                    <div className="my-item-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => setEditingItem(item)}
                        disabled={isDeleting}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? '⏳' : '🗑️'} Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <p className="empty-state">You haven't listed any items yet.</p>
              <button className="secondary-button" onClick={() => setCurrentView('list')}>
                List Your First Item
              </button>
            </>
          )}
        </div>

        <div className="profile-section">
          <h3>My Rentals</h3>
          <p className="empty-state">No active rentals.</p>
        </div>

        {editingItem && (
          <EditItemModal 
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSuccess={handleEditSuccess}
            categories={categories}
          />
        )}
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="App">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          {/* Logo/Brand */}
          <div className="nav-brand" onClick={() => setCurrentView('home')}>
            🏙️ CuseRents
          </div>
          
          {/* Navigation Links */}
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
            
            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <button 
                className="nav-link"
                onClick={() => setShowAuthModal(true)}
                style={{background: 'var(--orange)', color: 'white'}}
              >
                <User size={20} />
                <span>Login</span>
              </button>
            ) : (
              <>
                <span className="nav-user">
                  👤 {user?.username}
                </span>
                <button 
                  className="nav-link"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {currentView === 'home' && <HomeView />}
        {currentView === 'browse' && <BrowseView />}
        {currentView === 'list' && <ListItemView />}
        {currentView === 'profile' && <ProfileView />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>🍊 Built for Syracuse University • Sharing Economy for a Sustainable Future</p>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default App;