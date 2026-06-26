import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import { FiX, FiList } from 'react-icons/fi';
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
      height: 'calc(100vh - 70px)',
      position: 'relative',
    }}>
      {/* Map Header / Filters */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px', right: '12px',
        zIndex: 1000, display: 'flex', gap: '8px',
        overflowX: 'auto', paddingBottom: '4px',
      }}>
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setSelectedCluster(null); }}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-family)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            flexShrink: 0,
            outline: 'none',
          }}
        >
          <option value="">All Services</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <button
          onClick={() => navigate('/search')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            borderRadius: '9999px',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-family)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <FiList size={14} /> List View
        </button>
      </div>

      {/* OpenStreetMap */}
      <div style={{ flex: 1 }}>
        <BanayBanayMap
          businesses={activeBusinesses}
          userLocation={user?.location}
          onClusterClick={(cluster) => setSelectedCluster(cluster)}
          selectedId={selectedCluster?.landmark.id}
          getCategoryById={getCategoryById}
          height="100%"
          zoom={16}
        />
      </div>

      {/* Selected Cluster Popup / Bottom Sheet */}
      {selectedCluster && (
        <div style={{
          position: 'absolute',
          bottom: '16px', left: '16px', right: '16px',
          maxHeight: '40vh', overflowY: 'auto',
          maxWidth: '360px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          padding: '16px',
          zIndex: 1000,
          animation: 'fade-in-up 0.3s ease forwards',
        }}>
          <button
            onClick={() => setSelectedCluster(null)}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '4px',
            }}
          >
            <FiX size={18} />
          </button>

          <div style={{ paddingRight: '24px' }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700,
              color: 'var(--primary)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '4px', display: 'block',
            }}>
              📍 In {selectedCluster.landmark.name}
            </span>
            <h3 style={{
              fontWeight: 700, fontSize: '1.05rem',
              color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '12px',
            }}>
              Businesses ({selectedCluster.businesses.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCluster.businesses.map(b => (
                <div key={b.id} style={{
                  padding: '10px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{b.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getCategoryById(b.categoryId)?.name || 'Service'}
                    </span>
                  </div>
                  <button
                    className="btn btn-primary"
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
