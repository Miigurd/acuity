import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiMap, FiAlertTriangle } from 'react-icons/fi';
import ThemeSwitch from './ThemeSwitch';
import './Layout.css';

const Layout = () => {
    const location = useLocation();

    const navLinks = [
        { path: '/home', icon: <FiHome />, label: 'Home' },
        { path: '/search', icon: <FiSearch />, label: 'Search' },
        { path: '/map', icon: <FiMap />, label: 'Map' },
        { path: '/flagged', icon: <FiAlertTriangle />, label: 'Warnings' }
    ];

    return (
        <div className="layout-container">
            {/* Top Navbar for all screens */}
            <header className="navbar glass-panel">
                <div className="container flex justify-between items-center py-4">
                    <Link to="/" className="logo-link">
                        <h1 className="logo-text">Acu<span className="text-primary">ity</span></h1>
                    </Link>

                    <div className="desktop-actions flex items-center gap-4">
                        <ThemeSwitch />
                    </div>
                </div>
            </header>

            <div className="main-wrapper container">
                {/* Desktop Sidebar */}
                <aside className="sidebar hidden-mobile">
                    <nav className="sidebar-nav">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
                            >
                                <span className="icon">{link.icon}</span>
                                <span className="label">{link.label}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="main-content with-sidebar">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
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
        </div>
    );
};

export default Layout;
