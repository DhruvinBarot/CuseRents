import React, { useState, useEffect } from 'react';
import { searchItems } from './services/api';
import { 
  Home, Search, PlusCircle, User, MapPin, 
  DollarSign, Package, Wrench, Camera, 
  UtensilsCrossed, PartyPopper, Laptop, Book 
} from 'lucide-react';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
                    <button className="rent-button">
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