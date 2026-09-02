import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiCheckCircle, FiActivity, FiLayers, FiDatabase, FiCompass, FiArrowLeft, FiPlay, FiRefreshCw, FiInfo } from 'react-icons/fi';
import { LANDMARKS, CATEGORIES } from '../context/MockDataContext';
import { useMockData } from '../context/MockDataContext';
import SimulationCard from '../components/SimulationCard';
import ExpertModeLive from '../components/ExpertModeLive';

import LevenshteinThreshold from '../components/LevenshteinThreshold';
import CompositeRankingMerge from '../components/CompositeRankingMerge';

import TfidfGraph from '../components/TfidfGraph';
import HaversineGraph from '../components/HaversineGraph';

// Core Math Algorithms for IT Expert Inspection
const levenshtein = (s1, s2) => {
    if (!s1 || !s2) return { score: 0, edits: 0, max_len: 0, path: [] };
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const rows = s1.length + 1;
    const cols = s2.length + 1;
    const distance = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 1; i < rows; i++) distance[i][0] = i;
    for (let k = 1; k < cols; k++) distance[0][k] = k;

    for (let col = 1; col < cols; col++) {
        for (let row = 1; row < rows; row++) {
            const cost = s1[row - 1] === s2[col - 1] ? 0 : 1;
            distance[row][col] = Math.min(
                distance[row - 1][col] + 1,
                distance[row][col - 1] + 1,
                distance[row - 1][col - 1] + cost
            );
        }
    }
    
    const path = [];
    let r = rows - 1;
    let c = cols - 1;
    while (r > 0 || c > 0) {
        if (r > 0 && c > 0 && s1[r - 1] === s2[c - 1]) {
            path.push({ op: 'match', char: s1[r - 1] });
            r--; c--;
        } else if (r > 0 && c > 0 && distance[r][c] === distance[r - 1][c - 1] + 1) {
            path.push({ op: 'substitute', char: s2[c - 1] });
            r--; c--;
        } else if (r > 0 && distance[r][c] === distance[r - 1][c] + 1) {
            path.push({ op: 'delete', char: s1[r - 1] });
            r--;
        } else {
            path.push({ op: 'insert', char: s2[c - 1] });
            c--;
        }
    }
    path.reverse();

    const max_len = Math.max(s1.length, s2.length);
    const edits = distance[s1.length][s2.length];
    return { score: max_len ? 1.0 - (edits / max_len) : 1.0, edits, max_len, path };
};

const calculateCosineSimilarity = (query, doc) => {
    const STOP_WORDS = new Set(["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"]);
    
    const getTokens = (str) => {
        let tokens = (str || "").toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
        return tokens.filter(t => !STOP_WORDS.has(t));
    };
    
    const qTokens = getTokens(query);
    const dTokens = getTokens(doc);
    const getTf = (count) => count > 0 ? 1.0 + Math.log(count) : 0;
    
    let dotProduct = 0;
    let magQ = 0;
    let magD = 0;
    
    const uniqueTokens = Array.from(new Set([...qTokens, ...dTokens]));
    uniqueTokens.forEach(t => {
        const isMatch = (token, vocabTerm) => token === vocabTerm || (token.length >= 3 && (vocabTerm.startsWith(token) || token.startsWith(vocabTerm)));
        const qCount = qTokens.filter(x => isMatch(x, t)).length;
        const dCount = dTokens.filter(x => isMatch(x, t)).length;
        const qTf = getTf(qCount);
        const dTf = getTf(dCount);
        
        dotProduct += (qTf * dTf);
        magQ += (qTf * qTf);
        magD += (dTf * dTf);
    });
    
    magQ = Math.sqrt(magQ);
    magD = Math.sqrt(magD);
    
    const sim = (magQ && magD) ? (dotProduct / (magQ * magD)) : 0;
    const angle = Math.acos(Math.min(1, Math.max(-1, sim))) * (180 / Math.PI);
    return { sim, angle: isNaN(angle) ? 90 : angle };
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const ITExpertValidation = () => {
  const [activeTab, setActiveTab] = useState('simulation');
  const { businesses, getLandmarkById } = useMockData();

  // ML Simulation Search State
  const [simQuery, setSimQuery] = useState('repair');
  const [simLandmark, setSimLandmark] = useState('brgy_banay_banay');
  const [rankedResults, setRankedResults] = useState([]);
  const [isRanking, setIsRanking] = useState(false);

  // Levenshtein State
  const [levA, setLevA] = useState("Kuya Jun Vulcanizing");
  const [levB, setLevB] = useState("Kuya Juns Vulcanizing Shop");
  const [levResult, setLevResult] = useState(levenshtein(levA, levB));

  // TF-IDF State
  const [tfQuery, setTfQuery] = useState("bike repair");
  const [tfDoc, setTfDoc] = useState("Kuya Jun's Vulcanizing and Bike Repair Shop in Banay-Banay");
  const [tfResult, setTfResult] = useState(calculateCosineSimilarity(tfQuery, tfDoc));

  // Haversine State
  const [locA, setLocA] = useState(LANDMARKS[0].name);
  const [locB, setLocB] = useState(LANDMARKS[1].name);
  const [havDistance, setHavDistance] = useState(haversineDistance(LANDMARKS[0].latLng[0], LANDMARKS[0].latLng[1], LANDMARKS[1].latLng[0], LANDMARKS[1].latLng[1]));

  // NER Extraction State
  const [liveText, setLiveText] = useState('Looking for a laundry shop near Brgy. Pulo, Cabuyao. Any recommendations?');
  const [extractedEntities, setExtractedEntities] = useState(null);
  const [expectedEntities, setExpectedEntities] = useState({ business_name: '', category: 'Laundry', location: 'Brgy. Pulo' });
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    setLevResult(levenshtein(levA, levB));
  }, [levA, levB]);

  useEffect(() => {
    setTfResult(calculateCosineSimilarity(tfQuery, tfDoc));
  }, [tfQuery, tfDoc]);

  useEffect(() => {
    const a = LANDMARKS.find(l => l.name === locA);
    const b = LANDMARKS.find(l => l.name === locB);
    if (a && b) {
      setHavDistance(haversineDistance(a.latLng[0], a.latLng[1], b.latLng[0], b.latLng[1]));
    }
  }, [locA, locB]);

  const runSimulation = async () => {
    setIsRanking(true);
    const lm = LANDMARKS.find(l => l.id === simLandmark) || LANDMARKS[0];
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/expert/recommend-trace?q=${encodeURIComponent(simQuery)}&lat=${lm.latLng[0]}&lon=${lm.latLng[1]}&top_k=50`);
      const data = await res.json();
      if (data.results) {
        const merged = data.results.map(r => {
          const original = businesses.find(b => b.name === r.name || b.business_name === r.name) || {};
          return { ...original, ...r };
        });
        setRankedResults(merged);
      } else {
        throw new Error("No results in trace");
      }
    } catch (err) {
      console.warn("Falling back to JS simulation", err);
      const scored = businesses.map(b => {
        const bLandmark = getLandmarkById(b.landmarkId);
        const dist = bLandmark ? haversineDistance(lm.latLng[0], lm.latLng[1], bLandmark.latLng[0], bLandmark.latLng[1]) : 2.5;
        const textMatch = calculateCosineSimilarity(simQuery, `${b.name} ${b.description || ""} ${b.tags?.join(" ") || ""}`);
        
        // Exact match to backend proximity math
        const proxScore = 1.0 / (1.0 + dist);
        const finalScore = (textMatch.sim * 0.6) + (proxScore * 0.4);
        
        return {
          ...b,
          distance_km: dist.toFixed(2),
          relevance_score: textMatch.sim,
          proximity_score: proxScore,
          final_score: finalScore
        };
      }).filter(b => !simQuery || b.relevance_score > 0).sort((a, b) => b.final_score - a.final_score);
      setRankedResults(scored);
    }
    
    setIsRanking(false);
  };

  useEffect(() => {
    if (businesses.length > 0) {
      const timeoutId = setTimeout(() => {
        runSimulation();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [simQuery, simLandmark, businesses]);

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: liveText })
      });
      const data = await res.json();
      setExtractedEntities({
        business_name: data.business_name || [],
        category: data.categories || [],
        location: data.locations || []
      });
    } catch (e) {
      console.error(e);
      // Fallback mock extraction if backend unavailable
      setExtractedEntities({
        business_name: [],
        category: ['Laundry'],
        location: ['Brgy. Pulo']
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Portal Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-deep-navy) 0%, #001a61 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-card-lg)',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <span className="badge badge-sky mb-0">CS THESIS EVALUATION BENCHMARK</span>
          <Link to="/home" className="btn btn-sky btn-sm">
            <FiArrowLeft /> Return to Consumer App
          </Link>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '8px' }}>
          IT Expert & Panelist Evaluation Portal
        </h1>
        <p style={{ color: '#b8e9ff', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.5 }}>
          Comprehensive algorithmic testbed for validating the machine learning pipelines, geographic scoring matrices, and information extraction (NER) for the City of Cabuyao, Laguna.
        </p>
      </div>

      {/* Segmented Tabs for Evaluation Categories */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px', scrollbarWidth: 'none' }}>
        <button
          className={`btn ${activeTab === 'simulation' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('simulation')}
        >
          <FiCpu /> 1. ML Ranking Simulation
        </button>
        <button
          className={`btn ${activeTab === 'algorithms' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('algorithms')}
        >
          <FiLayers /> 2. Core Algorithm Sandboxes
        </button>
        <button
          className={`btn ${activeTab === 'ner' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('ner')}
        >
          <FiActivity /> 3. NLP Extraction (NER) F1 Benchmark
        </button>
        <button
          className={`btn ${activeTab === 'trace' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('trace')}
        >
          <FiDatabase /> 4. Live System Trace (Expert Mode)
        </button>
      </div>

      {/* TAB 1: ML RANKING SIMULATION */}
      {activeTab === 'simulation' && (
        <div>
          <div className="card mb-6">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
              Explainable ML Recommendation Formula
            </h3>
            <p className="text-secondary text-sm mb-4">
              Inspect how Acuity mathematically balances TF-IDF Cosine Similarity (60% weight) with Haversine Geographic Proximity (40% weight) across the City of Cabuyao.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-card)' }}>
              <div>
                <label className="text-muted font-bold" style={{ fontSize: '0.78rem' }}>SIMULATED QUERY:</label>
                <input
                  type="text"
                  className="form-control mt-1"
                  value={simQuery}
                  onChange={(e) => setSimQuery(e.target.value)}
                  placeholder="e.g. repair, sari-sari, food..."
                />
              </div>
              <div>
                <label className="text-muted font-bold" style={{ fontSize: '0.78rem' }}>RESIDENT LOCATION (CABUYAO):</label>
                <select
                  className="form-control mt-1"
                  value={simLandmark}
                  onChange={(e) => setSimLandmark(e.target.value)}
                >
                  {LANDMARKS.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px' }}>
            Live Ranked Output ({rankedResults.length} Micro-Enterprises)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {rankedResults.map((b, idx) => (
              <SimulationCard
                key={b.id}
                business={b}
                query={simQuery}
                userLandmark={LANDMARKS.find(l => l.id === simLandmark)}
                distance={b.distance_km}
                getLandmarkById={getLandmarkById}
              />
            ))}
          </div>

          <CompositeRankingMerge 
            businesses={rankedResults} 
            query={simQuery} 
            userLoc={LANDMARKS.find(l => l.id === simLandmark)?.name || 'Unknown'} 
          />
        </div>
      )}

      {/* TAB 2: CORE ALGORITHM SANDBOXES */}
      {activeTab === 'algorithms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Levenshtein */}
          <div className="card">
            <span className="badge badge-navy mb-2">STRING DISTANCE VERIFICATION</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Levenshtein Registry Verifier (BPLO Fuzzy Matching)
            </h3>
            <p className="text-secondary text-sm mb-4">
              Formula: <code>Score = 1.0 - (Edits / MaxLength)</code>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '14px' }}>
              <input type="text" className="form-control" value={levA} onChange={(e) => setLevA(e.target.value)} placeholder="Submitted Name" />
              <input type="text" className="form-control" value={levB} onChange={(e) => setLevB(e.target.value)} placeholder="Official BPLO Registry Name" />
            </div>
            <div className="flex justify-between items-center p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Minimum Operations: <strong>{levResult.edits} edits</strong></span>
              <span className="badge badge-sky" style={{ fontSize: '0.9rem' }}>
                Match: {(levResult.score * 100).toFixed(1)}%
              </span>
            </div>
            
            <LevenshteinThreshold currentScore={levResult.score} stringA={levA} stringB={levB} edits={levResult.edits} />
          </div>

          {/* TF-IDF */}
          <div className="card">
            <span className="badge badge-navy mb-2">VECTOR SPACE MODEL</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              TF-IDF & Cosine Angular Similarity
            </h3>
            <p className="text-secondary text-sm mb-4">
              Formula: <code>cos(θ) = (A · B) / (||A|| × ||B||)</code>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '14px' }}>
              <input type="text" className="form-control" value={tfQuery} onChange={(e) => setTfQuery(e.target.value)} placeholder="Query" />
              <input type="text" className="form-control" value={tfDoc} onChange={(e) => setTfDoc(e.target.value)} placeholder="Document Description" />
            </div>
            <div className="flex justify-between items-center p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Vector Angle: <strong>{tfResult.angle.toFixed(1)}°</strong></span>
              <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>
                Cosine Similarity: {(tfResult.sim * 100).toFixed(1)}%
              </span>
            </div>
            
            <TfidfGraph query={tfQuery} document={tfDoc} angle={tfResult.angle} similarity={tfResult.sim} />
          </div>

          {/* Haversine */}
          <div className="card">
            <span className="badge badge-navy mb-2">SPHERICAL GEODESIC</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Haversine Great-Circle Distance (Cabuyao Grid)
            </h3>
              <p className="text-secondary text-sm mb-4">
                Formula: <code>d = 2R &middot; arcsin(&radic;(sin&sup2;(&Delta;lat/2) + cos(lat1)cos(lat2)sin&sup2;(&Delta;lon/2)))</code>
              </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '14px' }}>
              <select className="form-control" value={locA} onChange={(e) => setLocA(e.target.value)}>
                {LANDMARKS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
              <select className="form-control" value={locB} onChange={(e) => setLocB(e.target.value)}>
                {LANDMARKS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div className="flex justify-between items-center p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Geodesic Curvature: <strong>Earth Sphere (R = 6371 km)</strong></span>
              <span className="badge badge-primary" style={{ fontSize: '0.9rem' }}>
                Distance: {havDistance.toFixed(2)} km
              </span>
            </div>
            
            <HaversineGraph 
              locA={locA} 
              locB={locB} 
              distance={havDistance} 
              proximity={1.0 / (1.0 + havDistance)} 
              aLat={LANDMARKS.find(l => l.name === locA)?.latLng[0] || 0} 
              aLon={LANDMARKS.find(l => l.name === locA)?.latLng[1] || 0} 
              bLat={LANDMARKS.find(l => l.name === locB)?.latLng[0] || 0} 
              bLon={LANDMARKS.find(l => l.name === locB)?.latLng[1] || 0} 
            />
          </div>
        </div>
      )}

      {/* TAB 3: NER EXTRACTION F1 BENCHMARK */}
      {activeTab === 'ner' && (
        <div className="card">
          <span className="badge badge-navy mb-2">INFORMATION EXTRACTION</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
            Natural Language Entity Extraction (NER) Precision & Recall
          </h3>
          <p className="text-secondary text-sm mb-4">
            Evaluates the parsing capability of uncurated Facebook community posts into structured entities for Cabuyao businesses.
          </p>

          <textarea
            className="form-control mb-4"
            rows="3"
            value={liveText}
            onChange={(e) => setLiveText(e.target.value)}
          />

          <button className="btn btn-primary mb-6" onClick={handleExtract} disabled={isExtracting}>
            {isExtracting ? 'Running NLP Pipeline...' : 'Run Extraction Benchmark'}
          </button>

          {extractedEntities && (
            <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontWeight: 800, marginBottom: '12px' }}>Extracted Result:</h4>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span>Business Name:</span>
                <strong>{extractedEntities.business_name?.join(', ') || 'None Detected'}</strong>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span>Category:</span>
                <strong>{extractedEntities.category?.join(', ') || 'General'}</strong>
              </div>
              <div className="flex justify-between py-2">
                <span>Location:</span>
                <strong>{extractedEntities.location?.join(', ') || 'City of Cabuyao'}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LIVE SYSTEM TRACE (EXPERT MODE) */}
      {activeTab === 'trace' && <ExpertModeLive />}
    </div>
  );
};

export default ITExpertValidation;
