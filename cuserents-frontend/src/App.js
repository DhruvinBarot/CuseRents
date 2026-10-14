import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { searchItems, createItem, getMyItems, getStats, activateBooking, completeBooking, acceptBooking, rejectBooking, startPayoutOnboarding, getPayoutStatus, cancelBooking, getItemReviews } from './services/api';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import PaymentForm from './components/PaymentForm';
import PhotoInput from './components/PhotoInput';
import ReviewForm from './components/ReviewForm';
import LegalPage from './components/LegalPage';
import {
  Search, PlusCircle, User, MapPin,
  Package, Wrench, Camera,
  UtensilsCrossed, PartyPopper, Laptop, Book,
  ArrowLeft, Calendar, Lock, Star, Leaf, CheckCircle,
  Plus, Menu, X, ArrowRight, ArrowUpRight,
  Map as MapIcon, MessageSquare, Layers, Bell, Video, ShieldCheck, Gift, Pause, Play
} from 'lucide-react';
import './App.css';

// shortcut: demo photos matched by item title, shipped in public/images/items. Delete once owners upload real photos.
const DEMO_PHOTOS = {
  'picnic kit': '/images/items/picnic-kit.webp',
  'electric scooter': '/images/items/electric-scooter.webp',
  'instant pot duo': '/images/items/instant-pot.webp',
  'dewalt cordless drill': '/images/items/dewalt-drill-kit.webp',
  'kitchenaid stand mixer': '/images/items/kitchenaid-mixer.webp',
};
const photoFor = (item) => DEMO_PHOTOS[item?.title?.trim().toLowerCase()] || item?.photo_url;
const ROADMAP = [
  { icon: MapIcon, status: 'Next up', title: 'Map search', text: 'See rentals on a live map and filter by walking distance from your dorm or apartment.' },
  { icon: Layers, status: 'In progress', title: 'Bundles', text: 'Move-in kits, tailgate kits and camping kits rented together at one bundle price.' },
  { icon: MessageSquare, status: 'Planned', title: 'In-app messaging', text: 'Agree on pickup times with owners without sharing your phone number.' },
  { icon: Bell, status: 'Planned', title: 'Saved items & alerts', text: 'Save what you like and get notified when something you need is listed nearby.' },
  { icon: Video, status: 'Planned', title: 'Video demos', text: 'Watch a short clip of how an item works before you book it.' },
  { icon: ShieldCheck, status: 'Planned', title: 'Verified students', text: 'A .edu verified badge on profiles for extra peace of mind.' },
];
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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

function App() {
  // Stripe onboarding sends owners back to /?payouts=done|refresh, land them on their profile
  const [currentView, setCurrentView] = useState(() => new URLSearchParams(window.location.search).has('payouts') ? 'profile' : 'home');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [slidesPaused, setSlidesPaused] = useState(false);

  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    getStats().then(setStats).catch((err) => console.error('Error fetching stats:', err));
  }, []);

  const fetchItems = useCallback(async () => {
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
  }, [selectedCategory]);

  useEffect(() => { window.scrollTo(0, 0); setMenuOpen(false); }, [currentView]);

  useEffect(() => {
    if (currentView === 'browse' || currentView === 'home') {
      fetchItems();
    }
  }, [currentView, fetchItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [items, searchQuery]);

  // Hero slideshow: items with our demo photos first, else any item with a photo
  const demoSlides = items.filter(i => DEMO_PHOTOS[i.title?.trim().toLowerCase()]);
  const slides = demoSlides.length ? demoSlides : items.filter(i => i.photo_url).slice(0, 5);
  const [slideHover, setSlideHover] = useState(false);

  useEffect(() => {
    if (currentView !== 'home' || slidesPaused || slideHover || slides.length < 2 || prefersReducedMotion()) return;
    const timer = setInterval(() => setSlide(s => (s + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, [currentView, slidesPaused, slideHover, slides.length]);

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

  const goToCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentView('browse');
  };

  // Listing card shared by Home and Browse; the title button stretches to make the whole card clickable
  const ItemCard = (item) => {
    const category = categories.find(c => c.id === item.category);
    const CategoryIcon = category?.icon || Package;
    const rating = parseFloat(item.rating_avg);
    return (
      <article key={item.id} className="product-card">
        <div className="product-media">
          <CategoryIcon size={48} aria-hidden="true" />
          {photoFor(item) && <img src={photoFor(item)} alt="" className="item-photo" loading="lazy" onError={(e) => { e.currentTarget.hidden = true; }} />}
        </div>
        <div className="product-body">
          <p className="product-dept">{category?.name || 'Other'} · {item.distance_km ?? '0.5'} km away</p>
          <h3 className="product-title">
            <button className="card-link" onClick={() => handleViewDetails(item)}>{item.title}</button>
          </h3>
          <div className="product-foot">
            <p className="product-price">
              ${parseFloat(item.price_per_hour).toFixed(2)}<span>/hr</span>
              {item.price_per_day && <span> · ${parseFloat(item.price_per_day).toFixed(0)}/day</span>}
            </p>
            {rating > 0
              ? <span className="product-rating"><Star size={14} fill="currentColor" aria-hidden="true" />{rating.toFixed(1)}</span>
              : <span className="product-new">New</span>}
          </div>
        </div>
      </article>
    );
  };

  // ==================== HOME VIEW ====================
  const featuredItems = items.slice(0, 8);
  const activeSlide = slides.length ? slide % slides.length : 0;
  const showcase = slides[activeSlide] || items[0];
  const ShowcaseIcon = categories.find(c => c.id === showcase?.category)?.icon || Package;

  const HomeView = () => (
    <div className="home-view">
      <section className="band hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="crumb">CuseRents <span aria-hidden="true">/</span> Syracuse, NY</p>
            <h1 className="hero-title">Rent what you need from people near campus.</h1>
            <p className="lede">Tools, cameras, party gear and more from Syracuse neighbors. Your card is only held, and charged after you return the item.</p>
            <form className="hero-search" role="search" onSubmit={(e) => { e.preventDefault(); setCurrentView('browse'); }}>
              <Search size={20} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search rentals"
                placeholder="Try “drill” or “projector”"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-dark">Search</button>
            </form>
            <div className="quick-chips">
              <span>Popular:</span>
              {categories.slice(0, 5).map(cat => (
                <button key={cat.id} className="chip" onClick={() => goToCategory(cat.id)}>{cat.name}</button>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            {showcase && (
              <div
                className="showcase-card"
                onMouseEnter={() => setSlideHover(true)}
                onMouseLeave={() => setSlideHover(false)}
                onFocus={() => setSlideHover(true)}
                onBlur={() => setSlideHover(false)}
              >
                <div className="product-media showcase-media">
                  <ShowcaseIcon size={64} aria-hidden="true" />
                  {(slides.length ? slides : [showcase]).map((s, i) => photoFor(s) && (
                    <img key={s.id} src={photoFor(s)} alt="" className={`item-photo ${i === activeSlide ? 'is-active' : ''}`} onError={(e) => { e.currentTarget.hidden = true; }} />
                  ))}
                </div>
                <div className="showcase-body" key={showcase.id} aria-live={slidesPaused ? 'polite' : 'off'}>
                  <div>
                    <p className="product-dept">Popular near you</p>
                    <h3>{showcase.title}</h3>
                    <p className="product-price">${parseFloat(showcase.price_per_hour).toFixed(2)}<span>/hr</span></p>
                  </div>
                  <button className="btn btn-dark" onClick={() => handleViewDetails(showcase)}>View <ArrowRight size={18} aria-hidden="true" /></button>
                </div>
                {slides.length > 1 && (
                  <div className="showcase-controls">
                    {slides.map((s, i) => (
                      <button key={s.id} className={`slide-dot ${i === activeSlide ? 'active' : ''}`} onClick={() => setSlide(i)} aria-label={`Show ${s.title}`} aria-current={i === activeSlide} />
                    ))}
                    <button className="slide-toggle" onClick={() => setSlidesPaused(p => !p)} aria-label={slidesPaused ? 'Play slideshow' : 'Pause slideshow'}>
                      {slidesPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                  </div>
                )}
              </div>
            )}
            <p className="showcase-badge"><Lock size={16} aria-hidden="true" /> Card held, not charged</p>
            <dl className="showcase-stats">
              <div><dt>Items available</dt><dd>{stats ? stats.items_available : '–'}</dd></div>
              <div><dt>CO₂ saved</dt><dd>{stats ? `${stats.co2_saved_kg} kg` : '–'}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="band band-line">
        <ul className="container value-strip">
          <li><Lock size={22} aria-hidden="true" /><div><strong>Held, not charged</strong><span>Pay after you return</span></div></li>
          <li><Star size={22} aria-hidden="true" /><div><strong>Two-way reviews</strong><span>Renters and owners rate each other</span></div></li>
          <li><MapPin size={22} aria-hidden="true" /><div><strong>Pickup near campus</strong><span>No shipping, no waiting</span></div></li>
          <li><Leaf size={22} aria-hidden="true" /><div><strong>Greener than buying</strong><span>Share instead of buying new</span></div></li>
        </ul>
      </section>

      <section className="band band-sand">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Browse by category</h2>
            <button className="link-arrow" onClick={() => goToCategory('')}>All rentals <ArrowRight size={18} aria-hidden="true" /></button>
          </div>
          <div className="category-grid">
            {categories.map((cat) => (
              <button key={cat.id} className="category-card" onClick={() => goToCategory(cat.id)}>
                <cat.icon size={28} aria-hidden="true" />
                <span className="category-name">{cat.name}</span>
                <ArrowUpRight className="category-arrow" size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {featuredItems.length > 0 && (
        <section className="band">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">Popular near you</h2>
              <button className="link-arrow" onClick={() => goToCategory('')}>See everything <ArrowRight size={18} aria-hidden="true" /></button>
            </div>
            <div className="items-grid">{featuredItems.map(ItemCard)}</div>
          </div>
        </section>
      )}

      <section className="band band-sand">
        <div className="container split">
          <h2 className="section-title">From students, for students</h2>
          <p className="lede">Most of what we own sits unused most of the time. CuseRents lets the Syracuse community share it: renters save money, owners earn from things they already have, and fewer things get bought and thrown away.</p>
        </div>
        <ol className="container steps-grid">
          <li className="step-card"><span className="step-number">01</span><h3>Search</h3><p>Find what you need near campus.</p></li>
          <li className="step-card"><span className="step-number">02</span><h3>Book</h3><p>Pick a time. Your card is only held.</p></li>
          <li className="step-card"><span className="step-number">03</span><h3>Pick up</h3><p>Show your booking code to the owner.</p></li>
          <li className="step-card"><span className="step-number">04</span><h3>Return</h3><p>You're charged, the deposit is released, and you both leave a review.</p></li>
        </ol>
      </section>

      <section className="band">
        <div className="container">
          <div className="founder-card">
            <div>
              <p className="founder-tag"><Gift size={16} aria-hidden="true" /> Founding member perk</p>
              <h2>Join during the beta and get $5 on us.</h2>
              <p>Create a free account now and we'll add $5 of rental credit to your wallet, plus you'll get first access to everything below.</p>
            </div>
            {isAuthenticated
              ? <p className="founder-done"><CheckCircle size={20} aria-hidden="true" /> You're a founding member</p>
              : <button className="btn btn-orange" onClick={() => setShowAuthModal(true)}>Claim my spot <ArrowRight size={18} aria-hidden="true" /></button>}
          </div>

          <div className="section-head">
            <h2 className="section-title">What's coming to CuseRents</h2>
          </div>
          <ul className="roadmap-grid">
            {ROADMAP.map(r => (
              <li key={r.title} className="roadmap-card">
                <div className="roadmap-top">
                  <r.icon size={28} aria-hidden="true" />
                  <span className={`roadmap-status ${r.status === 'Planned' ? '' : 'is-active'}`}>{r.status}</span>
                </div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="band band-dark">
        <div className="container cta-band">
          <div>
            <h2>Got stuff sitting around?</h2>
            <p>List it in minutes and earn whenever a neighbor rents it. Payouts go to your bank through Stripe.</p>
          </div>
          <button className="btn btn-orange" onClick={() => setCurrentView('list')}><Plus size={18} aria-hidden="true" /> List an item</button>
        </div>
      </section>
    </div>
  );

  // ==================== BROWSE VIEW ====================
  const BrowseView = () => (
    <div className="browse-view">
      <p className="crumb">
        <button onClick={() => setCurrentView('home')}>CuseRents</button> <span aria-hidden="true">/</span> Browse
        {selectedCategory && <> <span aria-hidden="true">/</span> {categories.find(c => c.id === selectedCategory)?.name}</>}
      </p>
      <h1 className="page-title">
        {searchQuery ? `Results for “${searchQuery}”` : (categories.find(c => c.id === selectedCategory)?.name || 'All rentals')}
      </h1>

      <div className="browse-toolbar">
        <div className="browse-search">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search rentals"
            placeholder="Search rentals"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
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
          <p className="results-header">
            {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} near Syracuse University
          </p>

          {filteredItems.length > 0 ? (
            <div className="items-grid">{filteredItems.map(ItemCard)}</div>
          ) : (
            <div className="empty-results">
              <h2>No rentals match that yet</h2>
              <p>Try another department or search term, or be the first to list one.</p>
              <button className="btn btn-dark" onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}>Clear filters</button>
            </div>
          )}
        </>
      )}
    </div>
  );

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
                <span>{new Date(startDate).toLocaleString()}</span>
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
              Your card is only authorized now. When you return the item, the rental fee is charged
              and the deposit hold is released (unless the owner reports damage).
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
          <CheckCircle className="success-icon" size={72} aria-hidden="true" />
          <h1>Booking Confirmed!</h1>
          <p className="confirmation-message">
            Your card is authorized and your request has been sent to the owner.
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
                <span>{new Date(bookingData.startDate).toLocaleString()}</span>
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
              <li>Booking code: <strong>{bookingCode}</strong> - saved to your account</li>
              <li>Check your email for confirmation</li>
              <li>The owner will contact you for pickup details</li>
              <li>You're charged only after return; the deposit hold is released then</li>
              <li>Leave a review to earn bonus reward points!</li>
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

  // ==================== MAIN RENDER ====================
  return (
    <div className="App">
      <header className="site-header">
        <div className="container header-inner">
          <button className="wordmark" onClick={() => setCurrentView('home')} aria-label="CuseRents home">
            cuse<span>rents</span>
          </button>
          <nav id="main-nav" className={`header-nav ${menuOpen ? 'open' : ''}`} aria-label="Main">
            <button className={`nav-item ${currentView === 'browse' ? 'active' : ''}`} onClick={() => goToCategory('')}>Browse rentals</button>
            <button className={`nav-item ${currentView === 'list' ? 'active' : ''}`} onClick={() => setCurrentView('list')}>Earn with your stuff</button>
            {isAuthenticated && (
              <button className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setCurrentView('profile')}>My account</button>
            )}
            {isAuthenticated
              ? <button className="nav-item nav-sand" onClick={handleLogout}>Sign out</button>
              : <button className="nav-item nav-sand" onClick={() => { setMenuOpen(false); setShowAuthModal(true); }}>Sign in</button>}
          </nav>
          <button className="btn btn-dark header-cta" onClick={() => setCurrentView('list')} aria-label="List an item">
            <Plus size={18} aria-hidden="true" /><span>List an item</span>
          </button>
          <button className="menu-toggle" onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-controls="main-nav" aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main className={`main-content ${currentView === 'home' ? 'is-home' : ''}`}>
        {currentView === 'home' && HomeView()}
        {currentView === 'browse' && BrowseView()}
        {currentView === 'itemDetail' && <ItemDetailView selectedItem={selectedItem} setCurrentView={setCurrentView} setShowAuthModal={setShowAuthModal} handleProceedToCheckout={handleProceedToCheckout} />}
        {currentView === 'checkout' && <CheckoutView />}
        {currentView === 'bookingConfirmed' && <BookingConfirmedView />}
        {currentView === 'list' && <ListItemView setCurrentView={setCurrentView} setShowAuthModal={setShowAuthModal} fetchItems={fetchItems} />}
        {(currentView === 'terms' || currentView === 'privacy') && <LegalPage kind={currentView} onBack={() => setCurrentView('home')} />}
        {currentView === 'profile' && <ProfileView setCurrentView={setCurrentView} setShowAuthModal={setShowAuthModal} />}
      </main>

      <footer className="footer">
        <div className="container footer-cols">
          <div className="footer-brand">
            <p className="wordmark wordmark-light">cuse<span>rents</span></p>
            <p>Rent from Syracuse neighbors. Save money, share more, waste less.</p>
          </div>
          <div>
            <h4>Rent</h4>
            {categories.slice(0, 4).map(cat => <button key={cat.id} className="footer-link" onClick={() => goToCategory(cat.id)}>{cat.name}</button>)}
          </div>
          <div>
            <h4>Earn</h4>
            <button className="footer-link" onClick={() => setCurrentView('list')}>List an item</button>
            <button className="footer-link" onClick={() => setCurrentView('profile')}>Set up payouts</button>
          </div>
          <div>
            <h4>Legal</h4>
            <button className="footer-link" onClick={() => setCurrentView('terms')}>Terms of Service</button>
            <button className="footer-link" onClick={() => setCurrentView('privacy')}>Privacy Policy</button>
          </div>
        </div>
        <p className="container footer-tag">Built for the Syracuse University community.</p>
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

// Defined outside App so they keep their state when App re-renders
// (inner components get a new identity every render and remount).
// ==================== ITEM DETAIL VIEW ====================
function ItemDetailView({ selectedItem, setCurrentView, setShowAuthModal, handleProceedToCheckout }) {
  const { user, isAuthenticated } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [hours, setHours] = useState(1);

  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    if (selectedItem) getItemReviews(selectedItem.id).then(setReviews).catch(() => setReviews([]));
  }, [selectedItem]);

  if (!selectedItem) return null;

  const CategoryIcon = categories.find(c => c.id === selectedItem.category)?.icon || Package;
  const isOwnItem = selectedItem.owner?.username === user?.username;

  const calculateTotal = () => {
    // Mirrors backend pricing: hourly, capped by the daily rate per started day
    const hourly = parseFloat(selectedItem.price_per_hour) * hours;
    const daily = parseFloat(selectedItem.price_per_day) * Math.ceil(hours / 24);
    return selectedItem.price_per_day ? Math.min(hourly, daily) : hourly;
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
            {photoFor(selectedItem) ? <img src={photoFor(selectedItem)} alt={selectedItem.title} className="item-photo" /> : <CategoryIcon size={80} color="#F76900" />}
          </div>
          <div className="detail-header-info">
            <h1>{selectedItem.title}</h1>
            <p className="detail-category">{selectedItem.category}</p>
            <div className="detail-location">
              <MapPin size={16} />
              <span>{selectedItem.distance_km || '0.5'}km away • {selectedItem.address_text}</span>
            </div>
            <p style={{marginTop: '10px', color: 'var(--text-gray)'}}>
              by {selectedItem.owner?.username || 'Unknown'} · ★ {selectedItem.owner?.rating_avg?.toFixed(1) || '5.0'}
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

            <div style={{marginTop: '25px'}}>
              <h3>Reviews ({reviews.length})</h3>
              {reviews.length === 0 ? <p className="empty-state">No reviews yet</p> : reviews.map((r) => (
                <div key={r.id} className="review-row">
                  <strong>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</strong> <span>{r.reviewer_username}</span>
                  {r.text && <p>{r.text}</p>}
                </div>
              ))}
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
                      Rental Start
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
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
                      max="144"
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
}

// ==================== LIST ITEM VIEW ====================
function ListItemView({ setCurrentView, setShowAuthModal, fetchItems }) {
  const { isAuthenticated } = useAuth();
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
        photo_url: formData.photo_url,
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
        <CheckCircle className="success-icon" size={72} aria-hidden="true" />
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
          <PhotoInput value={formData.photo_url} onChange={(url) => setFormData((f) => ({ ...f, photo_url: url }))} />
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
        <h4>Listing Tips</h4>
        <ul>
          <li>Price competitively (check similar items)</li>
          <li>Write clear descriptions</li>
          <li>Use Syracuse addresses</li>
          <li>Set realistic deposits</li>
          <li>Set up payouts in your Profile so renters can pay you</li>
        </ul>
      </div>
    </div>
  );
}

// ==================== PROFILE VIEW ====================
function ProfileView({ setCurrentView, setShowAuthModal }) {
  const { user, isAuthenticated } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyItems();
      fetchMyBookings();
      getPayoutStatus().then(setPayouts).catch((err) => console.error('Error fetching payout status:', err));
    }
  }, [isAuthenticated]);

  const fetchMyItems = async () => {
    setLoadingItems(true);
    try {
      const data = await getMyItems();
      setMyItems(data.results || []);
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

  // One request per booking at a time: a second click on "Mark Returned" used to hit Stripe again and show an error
  const handleBookingStep = async (apiCall, bookingId, doneMessage) => {
    if (busyId) return;
    setBusyId(bookingId);
    try {
      await apiCall(bookingId);
      await fetchMyBookings();
      alert(doneMessage);
    } catch (err) {
      console.error('Booking update failed:', err);
      alert(err.response?.data?.error || 'Failed to update booking');
    } finally {
      setBusyId(null);
    }
  };

  const handleSetUpPayouts = async () => {
    try {
      const { url } = await startPayoutOnboarding();
      window.location.href = url;
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start payout setup');
    }
  };

  const handleAcceptBooking = (bookingId) => handleBookingStep(acceptBooking, bookingId, 'Booking accepted! ✅');

  const handleRejectBooking = (bookingId) =>
    window.confirm('Are you sure you want to reject this booking?') && handleBookingStep(rejectBooking, bookingId, 'Booking rejected');

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
            <div className="stat-value">{user?.rating_avg?.toFixed(1) || '5.0'} ★</div>
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
          <p>Rewards tier: <strong>{user?.wallet_tier || 'Starter'}</strong></p>
        </div>
      </div>

      <div className="profile-section">
        <h3>Payouts</h3>
        {!payouts ? (
          <p className="empty-state">Checking payout status...</p>
        ) : payouts.payouts_ready ? (
          <p>Payouts are set up. Rental fees go to your bank account through Stripe after each return.</p>
        ) : (
          <>
            <p className="empty-state">
              {payouts.started ? "Payout setup isn't finished yet." : 'Set up payouts so renters can book your items.'}
            </p>
            <button className="secondary-button" onClick={handleSetUpPayouts}>
              {payouts.started ? 'Continue Payout Setup' : 'Set Up Payouts with Stripe'}
            </button>
          </>
        )}
      </div>

      <div className="profile-section">
        <h3>Booking Requests for My Items ({bookingRequests.length})</h3>
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
                <p className="booking-time">{new Date(booking.start_time).toLocaleString()} → {new Date(booking.end_time).toLocaleString()}</p>
                <p className="booking-price">${parseFloat(booking.total_price).toFixed(2)}</p>
                {booking.status === 'pending' && (
                  <div className="booking-actions">
                    <button className="btn-accept" disabled={busyId === booking.id} onClick={() => handleAcceptBooking(booking.id)}>Accept</button>
                    <button className="btn-reject" disabled={busyId === booking.id} onClick={() => handleRejectBooking(booking.id)}>Reject</button>
                  </div>
                )}
                {booking.status === 'accepted' && (
                  <div className="booking-actions">
                    <button className="btn-accept" disabled={busyId === booking.id} onClick={() => handleBookingStep(activateBooking, booking.id, 'Pickup confirmed, rental started')}>Mark Picked Up</button>
                  </div>
                )}
                {booking.status === 'active' && (
                  <div className="booking-actions">
                    <button className="btn-accept" disabled={busyId === booking.id} onClick={() => handleBookingStep(completeBooking, booking.id, 'Return confirmed, rental fee charged ✅')}>Mark Returned</button>
                    <button className="btn-reject" disabled={busyId === booking.id} onClick={() => window.confirm('Report damage? The renter will also be charged the full deposit.') && handleBookingStep((id) => completeBooking(id, true), booking.id, 'Damage reported, deposit charged')}>Report Damage</button>
                  </div>
                )}
                {booking.status === 'completed' && !booking.reviewed_by_me && (
                  <div className="booking-actions"><ReviewForm bookingId={booking.id} label="Review Renter" onDone={fetchMyBookings} /></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No booking requests yet</p>
        )}
      </div>

      <div className="profile-section">
        <h3>My Rental Requests ({myRentalRequests.length})</h3>
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
                <p className="booking-time">{new Date(booking.start_time).toLocaleString()} → {new Date(booking.end_time).toLocaleString()}</p>
                <p className="booking-price">${parseFloat(booking.total_price).toFixed(2)}</p>
                {booking.status === 'accepted' && (
                  <div className="booking-actions">
                    <button className="btn-accept" disabled={busyId === booking.id} onClick={() => handleBookingStep(activateBooking, booking.id, 'Pickup confirmed, rental started')}>Mark Picked Up</button>
                  </div>
                )}
                {['awaiting_payment', 'pending', 'accepted'].includes(booking.status) && (
                  <div className="booking-actions">
                    <button className="btn-reject" disabled={busyId === booking.id} onClick={() => window.confirm('Cancel this booking? Your card hold will be released.') && handleBookingStep(cancelBooking, booking.id, 'Booking cancelled')}>Cancel Booking</button>
                  </div>
                )}
                {booking.status === 'completed' && !booking.reviewed_by_me && (
                  <div className="booking-actions"><ReviewForm bookingId={booking.id} label="Review Item" onDone={fetchMyBookings} /></div>
                )}
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
                    <button className="btn-edit" onClick={() => setEditingItem(item)} disabled={isDeleting}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
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
}

export default App;