import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiSearch, FiCheckCircle, FiShield, FiChevronLeft, FiChevronRight, FiGrid, FiCompass } from 'react-icons/fi';
import { LANDMARKS, CATEGORIES } from '../context/MockDataContext';
import './LandingPage.css';

const LandingPage = () => {
    const [heroSearch, setHeroSearch] = useState('');
    const categoryScrollRef = useRef(null);

    const scrollCategories = (dir) => {
        if (categoryScrollRef.current) {
            categoryScrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
        }
    };

    return (
        <div className="landing-page">
            {/* ===== HERO SECTION ===== */}
            <section className="hero-section">
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="hero-location-badge">
                            <span className="dot"></span>
                            <span>City of Cabuyao • Laguna, Philippines</span>
                        </div>

                        <h1 className="hero-title">
                            Discover Local Services<br />
                            Across the Entire<br />
                            <span className="hero-title-accent">City of Cabuyao.</span>
                        </h1>

                        <p className="hero-subtitle">
                            An open, community-powered directory connecting residents to neighborhood sari-sari stores, repair technicians, carinderias, and home services across all 18 barangays.
                        </p>

                        {/* Clean, Production-Grade Search Bar */}
                        <div className="hero-search-container">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    window.location.href = `/search?q=${encodeURIComponent(heroSearch)}`;
                                }}
                                className="hero-search-bar"
                            >
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search services (e.g. Vulcanizing, Sari-Sari, Laundry, Silog, Tailor)..."
                                    value={heroSearch}
                                    onChange={(e) => setHeroSearch(e.target.value)}
                                    className="hero-search-input"
                                />
                                <button type="submit" className="btn btn-primary btn-search">
                                    Search
                                </button>
                            </form>

                            {/* Popular Suggestions */}
                            <div className="hero-suggestions">
                                <span className="suggestions-title">Popular:</span>
                                <Link to="/search?q=sari-sari" className="suggestion-link">Sari-Sari Stores</Link>
                                <Link to="/search?q=repair" className="suggestion-link">Vulcanizing & Repair</Link>
                                <Link to="/search?q=food" className="suggestion-link">Carinderia & Meals</Link>
                                <Link to="/search?q=laundry" className="suggestion-link">Laundry Services</Link>
                            </div>
                        </div>

                        {/* Dual Action CTAs */}
                        <div className="hero-action-buttons">
                            <Link to="/home" className="btn btn-primary btn-lg">
                                Explore Directory <FiArrowRight />
                            </Link>
                            <Link to="/map" className="btn btn-outline btn-lg">
                                <FiMapPin /> Open Cabuyao Map
                            </Link>
                        </div>
                    </div>

                    {/* Stats Highlights */}
                    <div className="stats-row">
                        <div className="stat-box">
                            <span className="stat-val">18</span>
                            <span className="stat-name">Barangays Covered</span>
                            <span className="stat-desc">Entire City of Cabuyao</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-val">7</span>
                            <span className="stat-name">Service Categories</span>
                            <span className="stat-desc">Daily neighborhood essentials</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-val">100%</span>
                            <span className="stat-name">Open to Everyone</span>
                            <span className="stat-desc">No accounts or logins needed</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== BROWSE BY CATEGORY (Scrollable on Desktop & Mobile) ===== */}
            <section className="category-browse-section">
                <div className="container">
                    <div className="section-head-with-controls">
                        <div>
                            <span className="badge badge-navy mb-2">SERVICES DIRECTORY</span>
                            <h2 className="section-heading">Browse Service Categories</h2>
                            <p className="section-description">
                                Find verified micro-enterprises nearest to your neighborhood landmark.
                            </p>
                        </div>

                        {/* Desktop Scroll Controls */}
                        <div className="category-scroll-arrows hidden-mobile">
                            <button 
                                onClick={() => scrollCategories(-1)} 
                                className="category-arrow-btn"
                                aria-label="Scroll categories left"
                            >
                                <FiChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={() => scrollCategories(1)} 
                                className="category-arrow-btn"
                                aria-label="Scroll categories right"
                            >
                                <FiChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Track for both Desktop & Mobile */}
                    <div className="category-scroll-wrapper" ref={categoryScrollRef}>
                        {CATEGORIES.map(cat => (
                            <Link
                                key={cat.id}
                                to={`/search?category=${cat.id}`}
                                className="category-pill-card"
                            >
                                <span className="cat-icon">{cat.icon}</span>
                                <span className="cat-title">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== VALUE PROPOSITION FOR RESIDENTS & BUSINESS OWNERS ===== */}
            <section className="value-prop-section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="badge badge-sky mb-2">HYPERLOCAL VISIBILITY</span>
                        <h2 className="section-heading">Built for Cabuyao Residents & Micro-Enterprises</h2>
                        <p className="section-description" style={{ maxWidth: '650px', margin: '0 auto' }}>
                            Acuity is completely open-access. No account creation or registration required to discover local services or connect with store owners.
                        </p>
                    </div>

                    <div className="value-cards-grid">
                        {/* For Residents */}
                        <div className="value-card resident-card">
                            <span className="badge badge-navy mb-3">FOR RESIDENTS</span>
                            <h3>Fast & Transparent Discovery</h3>
                            <ul className="value-list">
                                <li>
                                    <FiCheckCircle className="text-primary" size={18} />
                                    <span><strong>Proximity-First:</strong> Stores sorted by actual distance from your barangay landmark.</span>
                                </li>
                                <li>
                                    <FiCheckCircle className="text-primary" size={18} />
                                    <span><strong>No Account Needed:</strong> Open access for all residents and visitors with zero barrier to entry.</span>
                                </li>
                                <li>
                                    <FiCheckCircle className="text-primary" size={18} />
                                    <span><strong>Direct Connection:</strong> Call or message store owners directly with a single tap.</span>
                                </li>
                                <li>
                                    <FiCheckCircle className="text-primary" size={18} />
                                    <span><strong>Community Safety:</strong> Flagged warnings keep listings accurate and community-verified.</span>
                                </li>
                            </ul>
                            <Link to="/home" className="btn btn-navy mt-6" style={{ width: '100%' }}>
                                Start Discovering Services <FiArrowRight />
                            </Link>
                        </div>

                        {/* For Micro-Enterprises */}
                        <div className="value-card business-card">
                            <span className="badge badge-sky mb-3">FOR LOCAL BUSINESSES</span>
                            <h3>Free Digital Presence</h3>
                            <ul className="value-list">
                                <li>
                                    <FiCheckCircle className="text-sky" size={18} />
                                    <span><strong>Get Listed on the Map:</strong> Place your sari-sari store, carinderia, or repair stall on the city map.</span>
                                </li>
                                <li>
                                    <FiCheckCircle className="text-sky" size={18} />
                                    <span><strong>Zero Advertising Fees:</strong> Built specifically to empower informal, home-based, and neighborhood shops.</span>
                                </li>
                                <li>
                                    <FiCheckCircle className="text-sky" size={18} />
                                    <span><strong>Landmark Anchoring:</strong> Be found by customers living right around your barangay hub.</span>
                                </li>
                                <li>
                                    <FiCheckCircle className="text-sky" size={18} />
                                    <span><strong>Update Anytime:</strong> Keep operating hours, contact numbers, and service lists up to date.</span>
                                </li>
                            </ul>
                            <Link to="/search" className="btn btn-primary mt-6" style={{ width: '100%' }}>
                                Find or Update a Store <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== BROWSE BY BARANGAY ===== */}
            <section className="barangay-section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="badge badge-navy mb-2">18 BARANGAYS</span>
                        <h2 className="section-heading">Explore Neighborhoods Across Cabuyao</h2>
                        <p className="section-description">
                            Select a barangay to view local micro-enterprises in that area.
                        </p>
                    </div>

                    <div className="barangay-chips-container">
                        {LANDMARKS.map(l => (
                            <Link
                                key={l.id}
                                to={`/map`}
                                className="barangay-chip"
                            >
                                📍 {l.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA BANNER ===== */}
            <section className="cta-banner-section">
                <div className="container">
                    <div className="cta-banner-box">
                        <span className="badge badge-sky mb-3">SUPPORT LOCAL COMMERCE</span>
                        <h2 className="cta-heading">Ready to Discover Your Neighborhood?</h2>
                        <p className="cta-subheading">
                            Connect with verified sari-sari stores, repair technicians, and home kitchens across the City of Cabuyao today.
                        </p>
                        <div className="cta-actions">
                            <Link to="/home" className="btn btn-primary btn-lg">
                                Explore Directory <FiArrowRight />
                            </Link>
                            <Link to="/map" className="btn btn-outline btn-lg">
                                <FiMapPin /> Open Cabuyao Map
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <span className="footer-logo">Acu<span className="text-primary">ity</span></span>
                        <p>© 2026 Acuity — Computer Science Thesis Project.</p>
                        <p className="text-muted">City of Cabuyao, Laguna, Philippines (All 18 Barangays)</p>
                    </div>
                    <div className="footer-links">
                        <Link to="/home">Home</Link>
                        <Link to="/search">Directory</Link>
                        <Link to="/map">Cabuyao Map</Link>
                        <Link to="/flagged">Community Safety</Link>
                        <Link to="/it-expert-validation" style={{ color: 'var(--color-deep-navy)', fontWeight: 800 }}>
                            IT Expert & Panelist Portal ↗
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
