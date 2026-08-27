import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { useAuth } from '../context/AuthContext';
import SimulationCard from '../components/SimulationCard';
import { FiSearch, FiAlertCircle } from 'react-icons/fi';

const SearchSimulation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { businesses, categories, calculateDistance, getLandmarkById, isLoading: mockDataLoading } = useMockData();
  const { user } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialCategory = queryParams.get('category') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('nearest');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [rankedData, setRankedData] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        let fetchUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/search?simulate=true&q=${encodeURIComponent(initialQuery || '')}`;
        const userLandmark = getLandmarkById(user?.landmarkId);
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
        console.error("Backend search failed", e);
        setRankedData([]);
      }
    };
    fetchRankings();
  }, [initialQuery, user?.landmarkId, getLandmarkById]);

  useEffect(() => {
    if (mockDataLoading || !rankedData) return;
    setLoading(true);
    let filtered = businesses.filter(b => b.isActive && (!b.flagCount || b.flagCount < 3));

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
  }, [rankedData, businesses, initialCategory, sortBy, initialQuery, mockDataLoading]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/search-simulation?${params.toString()}`);
  };

  return (
    <div className="container py-6">
      <div className="flex-col gap-4 mb-6 sticky top-[70px] bg-[--background] z-10 py-4 shadow-sm border-b border-[--border] -mx-4 px-4">
        <div>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Explore the <strong style={{color: 'var(--primary)'}}>Algorithm Simulation Mode</strong>. This view breaks down how the search engine retrieves and ranks businesses for you.
           </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full items-center">
          <span className="text-muted flex-shrink-0"><FiSearch size={22} /></span>
          <div className="flex-1">
            <input
              type="text"
              className="input-field w-full"
              placeholder="Search Services (Simulation Mode)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Simulate Search</button>
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
              navigate(`/search-simulation?${params.toString()}`);
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
            {initialQuery && <option value="relevance">Relevance (Default)</option>}
            <option value="nearest">Nearest</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="results-container">
        <h2 className="font-bold text-lg mb-4">
          {loading ? 'Simulating Algorithm...' : `Algorithm Results (${results.length})`}
        </h2>

        {loading ? (
          <div className="flex-col gap-4">
            <p className="text-muted">Calculating TF-IDF, running Haversine distance functions...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="flex-col gap-8">
            {results.map(b => (
              <SimulationCard 
                key={b.id} 
                business={b} 
                query={initialQuery}
                userLandmark={getLandmarkById(user?.landmarkId)}
                distance={calculateDistance(user?.location, getLandmarkById(b.landmarkId)?.latLng)} 
                getLandmarkById={getLandmarkById}
              />
            ))}
          </div>
        ) : (
          <div className="flex-col items-center justify-center py-16 text-center text-muted">
            <FiAlertCircle className="text-4xl mb-4 text-[--border]" />
            <p className="font-semibold text-lg text-secondary">No services found to simulate</p>
            <button
              className="btn btn-outline mt-6"
              onClick={() => { setQuery(''); setSelectedCategory(''); navigate('/search-simulation'); }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSimulation;
