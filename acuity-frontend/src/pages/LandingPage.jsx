import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiCpu, FiDatabase, FiEye, FiCheckCircle, FiTrendingUp, FiUsers, FiZap, FiSearch } from 'react-icons/fi';
import './LandingPage.css';

const LandingPage = () => {
    const [visibleStats, setVisibleStats] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisibleStats(true), 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="landing-page">
            {/* ===== HERO ===== */}
            <section className="hero-section">
                <div className="hero-bg-effects">
                    <div className="glow-orb" style={{ width: '500px', height: '500px', background: 'var(--primary)', top: '-10%', right: '-5%' }}></div>
                    <div className="glow-orb" style={{ width: '400px', height: '400px', background: 'var(--secondary)', bottom: '-15%', left: '-10%' }}></div>
                    <div className="grid-overlay"></div>
                </div>

                <div className="container hero-content">
                    <div className="hero-badge animate-fade-in-up">
                        <div className="pulse-dot"></div>
                        <span>Machine Learning × Community Impact</span>
                    </div>

                    <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Empowering Local<br />
                        Micro-Enterprises through<br />
                        <span className="gradient-text">Intelligent Discovery</span>
                    </h1>

                    <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Acuity bridges the digital divide for neighborhood businesses using recommendation
                        algorithms, helping sari-sari stores, home-based services, and local vendors
                        gain visibility within their residential communities.
                    </p>

                    <div className="hero-cta animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <Link to="/home" className="btn btn-primary btn-lg">
                            Explore Directory <FiArrowRight />
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className={`stats-row ${visibleStats ? 'visible' : ''}`}>
                        <div className="stat-item">
                            <span className="stat-number">4</span>
                            <span className="stat-label">Registered Micro-Enterprises</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">7</span>
                            <span className="stat-label">Service Categories</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">619</span>
                            <span className="stat-label">Profile Impressions</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS — ML Pipeline ===== */}
            <section className="pipeline-section">
                <div className="container">
                    <div className="section-header">
                        <span className="badge badge-teal mb-4">The ML Pipeline</span>
                        <h2 className="section-heading">How Acuity Works</h2>
                        <p className="section-subtext">
                            A three-stage recommendation engine that transforms raw micro-enterprise data
                            into personalized, proximity-aware suggestions for residents.
                        </p>
                    </div>

                    <div className="pipeline-cards stagger-children">
                        <div className="pipeline-card glass-card">
                            <div className="pipeline-step-number">01</div>
                            <div className="pipeline-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--primary)' }}>
                                <FiDatabase size={28} />
                            </div>
                            <h3>Data Aggregation</h3>
                            <p>Business owners register their micro-enterprise details — services, location coordinates, contact info, and operating schedule — creating a structured local dataset.</p>
                            <div className="pipeline-tags">
                                <span>Profile Input</span>
                                <span>Geo-Coordinates</span>
                                <span>Service Tags</span>
                            </div>
                        </div>

                        <div className="pipeline-connector">
                            <div className="connector-line"></div>
                            <FiArrowRight className="connector-arrow" />
                        </div>

                        <div className="pipeline-card glass-card">
                            <div className="pipeline-step-number">02</div>
                            <div className="pipeline-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)' }}>
                                <FiCpu size={28} />
                            </div>
                            <h3>Algorithmic Processing</h3>
                            <p>The recommendation engine processes proximity data, service relevance, and community engagement signals to rank and score each enterprise for each user.</p>
                            <div className="pipeline-tags">
                                <span>Proximity Score</span>
                                <span>Relevance Matrix</span>
                                <span>Trust Signals</span>
                            </div>
                        </div>

                        <div className="pipeline-connector">
                            <div className="connector-line"></div>
                            <FiArrowRight className="connector-arrow" />
                        </div>

                        <div className="pipeline-card glass-card">
                            <div className="pipeline-step-number">03</div>
                            <div className="pipeline-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)' }}>
                                <FiEye size={28} />
                            </div>
                            <h3>Digital Visibility</h3>
                            <p>Residents receive personalized, location-aware business recommendations — bridging the gap between hidden local services and the community members who need them.</p>
                            <div className="pipeline-tags">
                                <span>Ranked Feed</span>
                                <span>Business Profiles</span>
                                <span>Map Pins</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== RECOMMENDATION FEED PREVIEW ===== */}
            <section className="feed-section">
                <div className="container">
                    <div className="feed-layout">
                        <div className="feed-info">
                            <span className="badge badge-teal mb-4">Recommendation Feed</span>
                            <h2 className="section-heading">Personalized for<br /><span className="gradient-text">Every Resident</span></h2>
                            <p className="section-subtext">
                                Acuity surfaces relevant micro-enterprises based on your location,
                                search patterns, and community engagement — not paid promotions.
                            </p>
                            <div className="feed-features">
                                <div className="feed-feature">
                                    <FiMapPin className="feed-feature-icon" />
                                    <div>
                                        <strong>Proximity-First</strong>
                                        <span>Results sorted by distance from your home address</span>
                                    </div>
                                </div>
                                <div className="feed-feature">
                                    <FiCheckCircle className="feed-feature-icon" />
                                    <div>
                                        <strong>Trust Verified</strong>
                                        <span>Community engagement badges and verified contacts</span>
                                    </div>
                                </div>
                                <div className="feed-feature">
                                    <FiTrendingUp className="feed-feature-icon" />
                                    <div>
                                        <strong>Smart Ranking</strong>
                                        <span>ML-driven relevance scoring per user context</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="feed-preview">
                            {/* Mock Recommendation Cards */}
                            <div className="rec-card glass-card animate-fade-in-up">
                                <div className="rec-header">
                                    <span className="rec-label">
                                        <FiZap /> Top Pick for Your Area
                                    </span>
                                    <span className="rec-score">96% match</span>
                                </div>
                                <h4>Aling Nena's Sari-Sari Store</h4>
                                <p className="rec-meta"><FiMapPin /> 0.3 km away · Sari-Sari / Convenience</p>
                                <div className="rec-tags">
                                    <span>Groceries</span><span>Load</span><span>Ice</span>
                                </div>
                                <div className="rec-footer">
                                    <div className="rec-verified"><FiCheckCircle /> Verified Contact</div>
                                </div>
                            </div>

                            <div className="rec-card glass-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                                <div className="rec-header">
                                    <span className="rec-label secondary">
                                        <FiUsers /> Community Favorite
                                    </span>
                                    <span className="rec-score">89% match</span>
                                </div>
                                <h4>Maria's Home Kitchen</h4>
                                <p className="rec-meta"><FiMapPin /> 0.8 km away · Food & Beverages</p>
                                <div className="rec-tags">
                                    <span>Silog Meals</span><span>Pancit Bilao</span>
                                </div>
                                <div className="rec-footer">
                                    <div className="rec-verified"><FiCheckCircle /> Active Community Member</div>
                                </div>
                            </div>

                            <div className="rec-card glass-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                <div className="rec-header">
                                    <span className="rec-label">
                                        <FiSearch /> Matches "repair"
                                    </span>
                                    <span className="rec-score">82% match</span>
                                </div>
                                <h4>Kuya Jun's Vulcanizing</h4>
                                <p className="rec-meta"><FiMapPin /> 1.1 km away · Repair Services</p>
                                <div className="rec-tags">
                                    <span>Vulcanizing</span><span>Bike Repair</span>
                                </div>
                                <div className="rec-footer">
                                    <div className="rec-verified"><FiCheckCircle /> Verified Contact</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== INTERACTIVE MAP PREVIEW ===== */}
            <section className="map-preview-section">
                <div className="container">
                    <div className="section-header">
                        <span className="badge badge-teal mb-4">Barangay Map</span>
                        <h2 className="section-heading">Visualize Business Density</h2>
                        <p className="section-subtext">
                            An internal coordinate-based map helps residents discover nearby enterprises
                            without requiring external API dependencies.
                        </p>
                    </div>

                    <div className="map-preview-container glass-card">
                        <div className="map-grid">
                            {/* Simulated heat zones */}
                            <div className="heat-zone" style={{ left: '30%', top: '40%', width: '120px', height: '120px', background: 'rgba(220, 38, 38, 0.15)' }}></div>
                            <div className="heat-zone" style={{ left: '60%', top: '25%', width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.12)' }}></div>
                            <div className="heat-zone" style={{ left: '45%', top: '70%', width: '100px', height: '100px', background: 'rgba(245, 158, 11, 0.1)' }}></div>

                            {/* Pins */}
                            <div className="map-demo-pin" style={{ left: '40%', top: '55%' }}>
                                <span className="pin-dot teal"></span>
                                <span className="pin-label">🛒 Sari-Sari</span>
                            </div>
                            <div className="map-demo-pin" style={{ left: '70%', top: '30%' }}>
                                <span className="pin-dot indigo"></span>
                                <span className="pin-label">🔧 Repair</span>
                            </div>
                            <div className="map-demo-pin" style={{ left: '50%', top: '80%' }}>
                                <span className="pin-dot amber"></span>
                                <span className="pin-label">🍔 Food</span>
                            </div>
                            <div className="map-demo-pin" style={{ left: '30%', top: '65%' }}>
                                <span className="pin-dot teal"></span>
                                <span className="pin-label">🧺 Laundry</span>
                            </div>

                            {/* Your location */}
                            <div className="map-demo-pin user-pin" style={{ left: '45%', top: '60%' }}>
                                <span className="pin-you"></span>
                                <span className="pin-label you-label">📍 You</span>
                            </div>
                        </div>

                        <div className="map-legend">
                            <div className="legend-item"><span className="legend-dot teal"></span> Convenience</div>
                            <div className="legend-item"><span className="legend-dot indigo"></span> Repair</div>
                            <div className="legend-item"><span className="legend-dot amber"></span> Food</div>
                            <div className="legend-item"><span className="legend-dot blue"></span> Your Location</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-box gradient-border">
                        <div className="cta-inner">
                            <h2>Ready to Discover Your Neighborhood?</h2>
                            <p>Whether you're a resident seeking services or a business owner aiming for visibility — Acuity connects you.</p>
                            <div className="cta-buttons">
                                <Link to="/home" className="btn btn-primary btn-lg">
                                    Start Discovering <FiArrowRight />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <p>© 2026 Acuity — A CS Thesis Project · Barangay Banay-Banay, Cabuyao, Laguna</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
