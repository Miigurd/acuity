import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import BusinessCard from '../components/BusinessCard';
import { FiSearch, FiAlertCircle, FiFilter, FiCheck } from 'react-icons/fi';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { businesses, categories, calculateDistance, getLandmarkById, trackEvent, isLoading: mockDataLoading } = useMockData();
  const { user } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialCategory = queryParams.get('category') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('relevance'); // 'nearest', 'newest', or 'relevance'
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [rankedData, setRankedData] = useState(null);

  useEffect(() => {
    setQuery(initialQuery);
    setSelectedCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        let fetchUrl = `http://localhost:5000/api/search?q=${encodeURIComponent(initialQuery || '')}`;
        const userLandmark = getLandmarkById ? getLandmarkById(user?.landmarkId) : null;
        if (userLandmark && userLandmark.latLng) {
          fetchUrl += `&lat=${userLandmark.latLng[0]}&lon=${userLandmark.latLng[1]}`;
        }
        
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const data = await res.json();
          setRankedData(data);
        } else {
          setRankedData([]);
        }
      } catch (e) {
        console.error("Backend search failed, fallback to local search", e);
        setRankedData([]);
      }
    };
    fetchRankings();
  }, [initialQuery, user?.landmarkId, getLandmarkById]);

  useEffect(() => {
    if (mockDataLoading) return;
    setLoading(true);
    let filtered = (businesses || []).filter(b => b && b.isActive && (!b.flagCount || b.flagCount < 3));

    // If backend provided ranking scores, map them to local items
    if (rankedData && rankedData.length > 0) {
      const matched = [];
      for (const rankItem of rankedData) {
        const localBusiness = filtered.find(b => b.name === rankItem.name || b.id === rankItem.id);
        if (localBusiness) {
          matched.push({ 
            ...localBusiness, 
            relevance_score: rankItem.relevance_score, 
            proximity_score: rankItem.proximity_score,
            distance_km: rankItem.distance_km,
            final_score: rankItem.final_score 
          });
        }
      }
      if (matched.length > 0) {
        filtered = matched;
      }
    } else if (initialQuery) {
      // Local text fallback match
      const q = initialQuery.toLowerCase();
      filtered = filtered.filter(b => 
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.services && Array.isArray(b.services) && b.services.some(s => s.toLowerCase().includes(q))) ||
        (b.tags && Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (initialCategory) {
      filtered = filtered.filter(b => b.categoryId === initialCategory);
    }

    if (sortBy === 'nearest') {
      filtered.sort((a, b) => {
        const distA = a.distance_km ?? (calculateDistance && user?.location && getLandmarkById ? calculateDistance(user.location, getLandmarkById(a.landmarkId)?.latLng) : Infinity);
        const distB = b.distance_km ?? (calculateDistance && user?.location && getLandmarkById ? calculateDistance(user.location, getLandmarkById(b.landmarkId)?.latLng) : Infinity);
        return distA - distB;
      });
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.stats?.created || 0) - new Date(a.stats?.created || 0));
    } else if (sortBy === 'relevance') {
      filtered.sort((a, b) => (b.final_score || b.relevance_score || 0) - (a.final_score || a.relevance_score || 0));
    }

    setResults(filtered);
    setLoading(false);
  }, [rankedData, businesses, initialCategory, sortBy, initialQuery, mockDataLoading, calculateDistance, getLandmarkById, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
      if (trackEvent) {
        trackEvent({ eventType: 'search', query: query });
      }
    }
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      {/* Sticky Filter Header */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 16px',
            border: '1px solid var(--border-strong)'
          }}>
            <FiSearch style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search local businesses and services in Cabuyao..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: '0.92rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '10px 24px' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const newCategory = e.target.value;
              setSelectedCategory(newCategory);
              const params = new URLSearchParams();
              if (query) params.set('q', query);
              if (newCategory) params.set('category', newCategory);
              navigate(`/search?${params.toString()}`);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">All Categories (Cabuyao)</option>
            {(categories || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              opacity: 1
            }}
          >
            <option value="relevance">Sort by: {initialQuery ? 'ML Relevance' : 'Relevance / Proximity'}</option>
            <option value="nearest">Sort by: Nearest</option>
            <option value="newest">Sort by: Newest</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          {loading ? 'Searching local directory...' : `Found ${results.length} micro-enterprises`}
        </h2>
        {initialCategory && (
          <span className="badge badge-sky">
            Filter: {(categories || []).find(c => c.id === initialCategory)?.name}
          </span>
        )}
      </div>

      {/* Grid of Business Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="card" style={{ height: '180px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '20px', width: '60%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
              <div style={{ height: '14px', width: '40%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
              <div style={{ height: '14px', width: '80%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {results.map(b => (
            <BusinessCard 
              key={b.id} 
              business={b} 
              distance={calculateDistance && user?.location && getLandmarkById ? calculateDistance(user.location, getLandmarkById(b.landmarkId)?.latLng) : null} 
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 flex-col items-center">
          <FiAlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 className="font-bold text-lg mb-2">No Matching Services Found</h3>
          <p className="text-secondary text-sm mb-6" style={{ maxWidth: '340px' }}>
            We couldn't find anything matching "{query}". Try searching for broader terms or clearing category filters.
          </p>
          <button
            className="btn btn-outline"
            onClick={() => { setQuery(''); setSelectedCategory(''); navigate('/search'); }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
