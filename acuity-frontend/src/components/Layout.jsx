import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiMap, FiShield } from 'react-icons/fi';
import ThemeSwitch from './ThemeSwitch';
import './Layout.css';

const Layout = () => {
    const location = useLocation();

    // Single unified navigation menu across the platform
    const navLinks = [
        { path: '/home', icon: <FiHome />, label: 'Home' },
        { path: '/search', icon: <FiSearch />, label: 'Search Services' },
        { path: '/map', icon: <FiMap />, label: 'Cabuyao Map' },
        { path: '/flagged', icon: <FiShield />, label: 'Community Safety' }
    ];

    const isITExpertPage = location.pathname === '/it-expert-validation' || location.pathname === '/search-simulation';

    return (
        <div className="layout-container">
            {/* Top Announcement Banner */}
            <div className="announcement-banner">
                <div className="container banner-inner">
                    <div className="banner-content">
                        <span className="banner-badge">CITY OF CABUYAO</span>
                        <span className="banner-text">
                            Open Hyperlocal Discovery Network • 18 Barangays of Cabuyao, Laguna
                        </span>
                    </div>
                    {!isITExpertPage && (
                        <div className="banner-links">
                            <Link to="/it-expert-validation" className="banner-link">
                                IT Expert & Panelist Portal ↗
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Single Unified Top Navbar (No Redundant Sidebar) */}
            <header className="navbar glass-panel">
                <div className="container nav-container">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="logo-link">
                            <span className="logo-mark">A</span>
                            <h1 className="logo-text">Acu<span className="text-primary">ity</span></h1>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="desktop-nav hidden-mobile">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`nav-pill-link ${location.pathname === link.path ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{link.icon}</span>
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="desktop-actions flex items-center gap-3">
                        <ThemeSwitch />
                    </div>
                </div>
            </header>

            {/* Main Content Area (Clean, Unconstrained Layout) */}
            <div className="main-wrapper container">
                <main className="main-content">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            {!isITExpertPage && (
                <nav className="bottom-nav hidden-desktop glass-panel">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`bottom-nav-item ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            <span className="icon">{link.icon}</span>
                            <span className="label">{link.label}</span>
                        </Link>
                    ))}
                </nav>
            )}
        </div>
    );
};

export default Layout;
