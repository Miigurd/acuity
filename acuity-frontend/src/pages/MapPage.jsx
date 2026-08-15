import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import { FiX, FiList, FiArrowLeft, FiMapPin, FiCompass } from 'react-icons/fi';
import BanayBanayMap from '../components/BanayBanayMap';

const MapPage = () => {
  const { businesses, categories, getCategoryById } = useMockData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');

  const activeBusinesses = businesses.filter(b => b.isActive && (!b.flagCount || b.flagCount < 1) && (filterCategory ? b.categoryId === filterCategory : true));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 170px)',
      minHeight: 'min(480px, 60vh)',
      position: 'relative',
      borderRadius: 'var(--radius-card-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      marginBottom: '20px'
    }}>
      {/* Top Floating Control Bar with Clear Back Button */}
      <div style={{
        position: 'absolute', top: '14px', left: '14px', right: '14px',
        zIndex: 1000, display: 'flex', gap: '8px',
        alignItems: 'center',
        overflowX: 'auto', paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {/* Back to Directory Button (solves mobile lockup) */}
        <button
          onClick={() => navigate('/home')}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-md)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '8px 14px'
          }}
          title="Back to Home"
        >
          <FiArrowLeft size={16} /> Home
        </button>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setSelectedCluster(null); }}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            border: '1.5px solid var(--border-strong)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            fontWeight: 700,
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            flexShrink: 0,
            outline: 'none',
          }}
        >
          <option value="">All Services (Cabuyao)</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Switch to List View */}
        <button
          onClick={() => navigate('/search')}
          className="btn btn-primary btn-sm"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: 'var(--shadow-md)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '8px 16px'
          }}
        >
          <FiList size={14} /> List View
        </button>
      </div>

      {/* Interactive Map Component */}
      <div style={{ flex: 1, width: '100%', height: '100%' }}>
        <BanayBanayMap
          businesses={activeBusinesses}
          userLocation={user?.location}
          onClusterClick={(cluster) => setSelectedCluster(cluster)}
          selectedId={selectedCluster?.landmark.id}
          getCategoryById={getCategoryById}
          height="100%"
          zoom={13}
        />
      </div>

      {/* Selected Cluster Bottom Card */}
      {selectedCluster && (
        <div style={{
          position: 'absolute',
          bottom: '16px', left: '16px', right: '16px',
          maxHeight: '45vh', overflowY: 'auto',
          maxWidth: '380px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-strong)',
          padding: '18px',
          zIndex: 1000,
          animation: 'fade-in-up 0.2s ease forwards',
        }}>
          <button
            onClick={() => setSelectedCluster(null)}
            style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '4px',
            }}
          >
            <FiX size={20} />
          </button>

          <div style={{ paddingRight: '20px' }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 800,
              color: 'var(--color-deep-navy)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '4px', display: 'block',
            }}>
              📍 {selectedCluster.landmark.name}
            </span>
            <h3 style={{
              fontWeight: 900, fontSize: '1.1rem',
              color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '12px',
            }}>
              Local Stores ({selectedCluster.businesses.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCluster.businesses.map(b => (
                <div key={b.id} style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  background: 'var(--bg-elevated)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{b.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getCategoryById(b.categoryId)?.name || 'Service'}
                    </span>
                  </div>
                  <button
                    className="btn btn-navy btn-sm"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    onClick={() => navigate(`/business/${b.id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
