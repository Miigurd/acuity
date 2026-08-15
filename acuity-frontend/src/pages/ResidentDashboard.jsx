import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import BusinessCard from '../components/BusinessCard';
import { FiSearch, FiArrowRight, FiMapPin, FiChevronLeft, FiChevronRight, FiGrid, FiClock, FiCompass } from 'react-icons/fi';

/* ─── Reusable horizontal card slider with smooth pill arrows ─── */
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
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const arrowBase = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    zIndex: 10, width: '38px', height: '38px', borderRadius: '50%',
    background: 'var(--bg-surface)',
    border: '1.5px solid var(--border-strong)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-primary)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    padding: 0,
  };

  return (
    <div style={{ position: 'relative' }}>
      {canLeft && (
        <button
          onClick={() => slide(-1)}
          className="hidden-mobile"
          style={{ ...arrowBase, left: '-12px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-deep-navy)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          aria-label="Scroll left"
        >
          <FiChevronLeft size={18} />
        </button>
      )}

      <div
        ref={trackRef}
        style={{
          display: 'flex', gap: '16px',
          overflowX: 'auto', paddingBottom: '14px',
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x proximity',
        }}
      >
        {children}
      </div>

      {canRight && (
        <button
          onClick={() => slide(1)}
          className="hidden-mobile"
          style={{ ...arrowBase, right: '-12px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-deep-navy)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          aria-label="Scroll right"
        >
          <FiChevronRight size={18} />
        </button>
      )}

      <div style={{ height: '3px', borderRadius: '9999px', background: 'var(--bg-elevated)', marginTop: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '9999px',
          background: 'var(--color-deep-navy)',
          width: `${Math.max(progress * 100, 10)}%`,
          transition: 'width 0.15s ease',
        }} />
      </div>
    </div>
  );
};

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const { businesses, categories, calculateDistance, getLandmarkById, trackEvent } = useMockData();
  const [searchQuery, setSearchQuery] = useState('');
  const categoryTrackRef = useRef(null);

  const scrollCategoryTrack = (dir) => {
    if (categoryTrackRef.current) {
      categoryTrackRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' });
    }
  };

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

  // Open directory listing (no user login required)
  const activeBusinesses = businesses.filter(b => b.isActive && (!b.flagCount || b.flagCount < 3));

  const nearestBusinesses = [...activeBusinesses]
    .slice(0, 6);

  const newestBusinesses = [...activeBusinesses]
    .sort((a, b) => new Date(b.stats?.created || 0) - new Date(a.stats?.created || 0))
    .slice(0, 6);

  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      {/* Search Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-hero-sky) 0%, var(--color-sky-tint) 100%)',
        borderRadius: 'var(--radius-card-lg)',
        padding: '2.5rem 2rem',
        marginBottom: '2.25rem',
        border: '1px solid rgba(0, 41, 145, 0.12)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#ffffff',
            padding: '4px 12px', borderRadius: 'var(--radius-pill)',
            fontSize: '0.75rem', fontWeight: 700, color: '#000000', marginBottom: '10px'
          }}>
            <span>📍 City of Cabuyao Directory</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 900,
            color: '#000000',
            letterSpacing: '-0.03em',
            marginBottom: '6px'
          }}>
            Explore Local Services in Cabuyao
          </h2>

          <p style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: 500, marginBottom: '1.25rem' }}>
            What neighborhood store, repair technician, or food hub are you looking for today?
          </p>

          <form onSubmit={handleSearch}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 8px 6px 18px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <FiSearch style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search sari-sari, vulcanizing, carinderia, laundry, tailor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  fontSize: '0.92rem',
                  color: '#000000'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 20px', borderRadius: 'var(--radius-pill)' }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Service Categories (Scrollable on Desktop & Mobile) */}
      <section style={{ marginBottom: '2.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiGrid style={{ color: 'var(--color-deep-navy)' }} /> Service Categories
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => scrollCategoryTrack(-1)}
              className="category-arrow-btn hidden-mobile"
              style={{ width: '32px', height: '32px' }}
              aria-label="Scroll categories left"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollCategoryTrack(1)}
              className="category-arrow-btn hidden-mobile"
              style={{ width: '32px', height: '32px' }}
              aria-label="Scroll categories right"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={categoryTrackRef}
          style={{
            display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px',
            scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >
          {categories.map(c => (
            <Link
              key={c.id}
              to={`/search?category=${c.id}`}
              className="chip"
              style={{ flexShrink: 0, textDecoration: 'none', padding: '10px 18px' }}
            >
              <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Enterprises in Cabuyao */}
      <section style={{ marginBottom: '2.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Featured Micro-Enterprises <FiCompass style={{ color: 'var(--color-deep-navy)' }} />
          </h3>
          <Link to="/search" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All Directory <FiArrowRight size={13} />
          </Link>
        </div>

        {nearestBusinesses.length > 0 ? (
          <CardSlider>
            {nearestBusinesses.map((b, idx) => (
              <div key={b.id} style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 'min(290px, 82vw)' }}>
                <BusinessCard
                  business={b}
                  recommended={idx === 0}
                />
              </div>
            ))}
          </CardSlider>
        ) : (
          <div className="card text-center py-8">
            <p className="text-muted">No businesses registered yet in this area.</p>
          </div>
        )}
      </section>

      {/* Recently Added to the Directory */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Recently Added <FiClock style={{ color: 'var(--color-deep-navy)' }} />
          </h3>
          <Link to="/search?sort=newest" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Newest <FiArrowRight size={13} />
          </Link>
        </div>

        <CardSlider>
          {newestBusinesses.map((b) => (
            <div key={b.id} style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 'min(290px, 82vw)' }}>
              <BusinessCard
                business={b}
              />
            </div>
          ))}
        </CardSlider>
      </section>
    </div>
  );
};

export default ResidentDashboard;
