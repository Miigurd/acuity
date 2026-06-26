import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import BusinessCard from '../components/BusinessCard';
import { FiSearch, FiArrowRight, FiMapPin, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/* ─── Reusable horizontal card slider ─── */
const CardSlider = ({ children }) => {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [progress, setProgress] = useState(0);

  const syncState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < maxScroll - 4);
    setProgress(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncState();
    el.addEventListener('scroll', syncState, { passive: true });
    window.addEventListener('resize', syncState);
    return () => {
      el.removeEventListener('scroll', syncState);
      window.removeEventListener('resize', syncState);
    };
  }, [syncState]);

  const slide = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const arrowBase = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 10, width: '36px', height: '36px', borderRadius: '50%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    padding: 0,
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={() => slide(-1)}
          style={{ ...arrowBase, left: '-14px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          aria-label="Scroll left"
        >
          <FiChevronLeft size={18} />
        </button>
      )}

      {/* Scrollable track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex', gap: '16px',
          overflowX: 'auto', paddingBottom: '12px',
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* Right arrow */}
      {canRight && (
        <button
          onClick={() => slide(1)}
          style={{ ...arrowBase, right: '-14px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          aria-label="Scroll right"
        >
          <FiChevronRight size={18} />
        </button>
      )}

      {/* Progress bar */}
      <div style={{ height: '3px', borderRadius: '9999px', background: 'var(--bg-elevated)', marginTop: '6px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '9999px',
          background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
          width: `${Math.max(progress * 100, 8)}%`,
          transition: 'width 0.15s ease',
        }} />
      </div>
    </div>
  );
};

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { businesses, categories, calculateDistance, getLandmarkById, trackEvent } = useMockData();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (trackEvent) {
        trackEvent({ eventType: 'search', query: searchQuery });
      }
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  const nearestBusinesses = [...businesses]
    .filter(b => b.isActive && (!b.flagCount || b.flagCount < 3))
    .sort((a, b) => {
      const distA = parseFloat(calculateDistance(user.location, getLandmarkById(a.landmarkId)?.latLng));
      const distB = parseFloat(calculateDistance(user.location, getLandmarkById(b.landmarkId)?.latLng));
      return distA - distB;
    })
    .slice(0, 5);

  const newestBusinesses = [...businesses]
    .filter(b => b.isActive && (!b.flagCount || b.flagCount < 3))
    .sort((a, b) => new Date(b.stats.created) - new Date(a.stats.created))
    .slice(0, 5);

  return (
    <div style={{ paddingBottom: '1rem' }}>
      {/* Hero / Search Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary), #fca5a5)',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem 1.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px', position: 'relative', zIndex: 1 }}>
          Hello, {user.name.split(' ')[0]}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1.25rem', position: 'relative', zIndex: 1 }}>
          What service are you looking for today?
        </p>

        <form onSubmit={handleSearch} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', fontSize: '1.1rem', display: 'flex' }}>
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 90px 12px 42px',
                borderRadius: '9999px',
                border: '1px solid var(--hero-search-border)',
                background: 'var(--hero-search-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                backdropFilter: 'blur(8px)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ position: 'absolute', right: '4px', padding: '8px 16px', fontSize: '0.8rem', borderRadius: '9999px' }}
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Categories */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Categories</h3>
        </div>
        <div style={{
          display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          alignItems: 'stretch'
        }}>
          {categories.map(c => (
            <Link
              key={c.id}
              to={`/search?category=${c.id}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                flex: 1, minWidth: '80px', minHeight: '100px', padding: '12px 6px',
                borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', textAlign: 'center',
                transition: 'all 0.2s', cursor: 'pointer',
                justifyContent: 'flex-start'
              }}
            >
              <span style={{ fontSize: '1.5rem', background: 'var(--bg-elevated)', padding: '8px', borderRadius: '50%' }}>
                {c.icon}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Nearest to You */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Nearest to You <FiMapPin style={{ color: 'var(--primary)', fontSize: '1rem' }} />
          </h3>
          <Link to="/search" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <FiArrowRight size={13} />
          </Link>
        </div>
        {nearestBusinesses.length > 0 ? (
          <CardSlider>
            {nearestBusinesses.map((b) => (
              <div key={b.id} style={{ flexShrink: 0 }}>
                <BusinessCard
                  business={b}
                  distance={calculateDistance(user.location, getLandmarkById(b.landmarkId)?.latLng)}
                  recommended={b === nearestBusinesses[0]}
                />
              </div>
            ))}
          </CardSlider>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', width: '100%', padding: '2rem 0' }}>
            No businesses found nearby.
          </p>
        )}
      </section>

      {/* Recently Added */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Recently Added</h3>
          <Link to="/search?sort=newest" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <FiArrowRight size={13} />
          </Link>
        </div>
        <CardSlider>
          {newestBusinesses.map((b) => (
            <div key={b.id} style={{ flexShrink: 0 }}>
              <BusinessCard
                business={b}
                distance={calculateDistance(user.location, getLandmarkById(b.landmarkId)?.latLng)}
              />
            </div>
          ))}
        </CardSlider>
      </section>
    </div>
  );
};

export default ResidentDashboard;
