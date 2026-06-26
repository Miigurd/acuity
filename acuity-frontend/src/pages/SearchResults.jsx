import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import BusinessCard from '../components/BusinessCard';
import { FiSearch, FiAlertCircle } from 'react-icons/fi';

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
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' or 'newest'
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (mockDataLoading) return;
      setLoading(true);
      let filtered = businesses.filter(b => b.isActive && (!b.flagCount || b.flagCount < 3));

      try {
        let fetchUrl = `http://localhost:5000/api/search?q=${encodeURIComponent(initialQuery || '')}`;
        const userLandmark = getLandmarkById(user.landmarkId);
        if (userLandmark && userLandmark.latLng) {
          fetchUrl += `&lat=${userLandmark.latLng[0]}&lon=${userLandmark.latLng[1]}`;
        }
        
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const rankedData = await res.json();
          const matched = [];
          for (const rankItem of rankedData) {
            const localBusiness = filtered.find(b => b.name === rankItem.name);
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
          filtered = matched;
        }
      } catch (e) {
        console.error("Backend search failed", e);
      }

      if (initialCategory) {
        filtered = filtered.filter(b => b.categoryId === initialCategory);
      }

      const activeSortBy = initialQuery ? 'relevance' : sortBy;

      if (activeSortBy === 'nearest') {
        filtered.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
      } else if (activeSortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.stats.created) - new Date(a.stats.created));
      } else if (activeSortBy === 'relevance') {
        filtered.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
      }

      setResults(filtered);
      setLoading(false);
    };

    fetchResults();
  }, [initialQuery, initialCategory, sortBy, businesses, user.location, calculateDistance, getLandmarkById, mockDataLoading]);

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
    <div className="container py-6">
      <div className="flex-col gap-4 mb-6 sticky top-[70px] bg-[--background] z-10 py-4 shadow-sm border-b border-[--border] -mx-4 px-4">
        <form onSubmit={handleSearch} className="flex gap-2 w-full items-center">
          <span className="text-muted flex-shrink-0"><FiSearch size={22} /></span>
          <div className="flex-1">
            <input
              type="text"
              className="input-field w-full"
              placeholder="Search Services"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <select
            className="input-field text-sm py-2 px-3 m-0 border border-[--border] bg-white"
            style={{ marginBottom: 0, minWidth: '140px', paddingRight: '30px' }}
            value={selectedCategory}
            onChange={(e) => {
              const newCategory = e.target.value;
              setSelectedCategory(newCategory);
              const params = new URLSearchParams();
              if (query) params.set('q', query);
              if (newCategory) params.set('category', newCategory);
              navigate(`/search?${params.toString()}`);
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className={`input-field text-sm py-2 px-3 m-0 border border-[--border] bg-white flex-shrink-0 ${initialQuery ? 'opacity-70 cursor-not-allowed' : ''}`}
            style={{ marginBottom: 0, paddingRight: '25px' }}
            value={initialQuery ? 'relevance' : sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={!!initialQuery}
          >
            {initialQuery && <option value="relevance">Relevance</option>}
            <option value="nearest">Nearest</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="results-container">
        <h2 className="font-bold text-lg mb-4">
          {loading ? 'Searching...' : `Found ${results.length} results`}
        </h2>

        {loading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="card h-48 flex-col gap-3">
                <div className="flex justify-between">
                  <div className="skeleton skeleton-text short"></div>
                  <div className="skeleton w-16 h-6 rounded-full"></div>
                </div>
                <div className="skeleton skeleton-text w-1/4"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="mt-auto skeleton h-8 rounded-full w-24"></div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {results.map(b => (
              <BusinessCard key={b.id} business={b} distance={calculateDistance(user.location, getLandmarkById(b.landmarkId)?.latLng)} />
            ))}
          </div>
        ) : (
          <div className="flex-col items-center justify-center py-16 text-center text-muted">
            <FiAlertCircle className="text-4xl mb-4 text-[--border]" />
            <p className="font-semibold text-lg text-secondary">No services found</p>
            <p className="text-sm mt-2 max-w-xs">We couldn't find anything matching your search. Try different keywords or browse all categories.</p>
            <button
              className="btn btn-outline mt-6"
              onClick={() => { setQuery(''); setSelectedCategory(''); navigate('/search'); }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
