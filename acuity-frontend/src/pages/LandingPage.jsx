import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiCpu, FiDatabase, FiEye, FiCheckCircle, FiTrendingUp, FiUsers, FiZap, FiSearch } from 'react-icons/fi';
import { LANDMARKS } from '../context/MockDataContext';
import './LandingPage.css';

// ===== INTERACTIVE ALGORITHMS =====
const levenshtein = (s1, s2) => {
    if (!s1 || !s2) return { score: 0, edits: 0, max_len: 0 };
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
                distance[row - 1][col] + 1,      // deletion
                distance[row][col - 1] + 1,      // insertion
                distance[row - 1][col - 1] + cost // substitution
            );
        }
    }
    
    // Backtrace
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
        let tokens = str.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
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
        // Bi-directional prefix matching simulation for query terms
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
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const LandingPage = () => {
    const [visibleStats, setVisibleStats] = useState(false);
    const [activeTab, setActiveTab] = useState('levenshtein');

    // Interactive State
    const [levA, setLevA] = useState("TechCorp Inc");
    const [levB, setLevB] = useState("Tech Corporation Inc.");
    const [levResult, setLevResult] = useState(levenshtein(levA, levB));
    
    // Levenshtein Simulation State
    const [simFrame, setSimFrame] = useState(-1);
    const [isSimulating, setIsSimulating] = useState(false);

    const startSimulation = () => {
        if (isSimulating || !levResult.path || !levResult.path.length) return;
        setIsSimulating(true);
        setSimFrame(0);
    };

    const [tfQuery, setTfQuery] = useState("repair");
    const [tfDoc, setTfDoc] = useState("Kuya Jun's Vulcanizing and Bike Repair");
    const [tfResult, setTfResult] = useState(calculateCosineSimilarity(tfQuery, tfDoc));

    const [locA, setLocA] = useState(LANDMARKS[0].name);
    const [locB, setLocB] = useState(LANDMARKS[1].name);
    const [havDistance, setHavDistance] = useState(haversineDistance(LANDMARKS[0].latLng[0], LANDMARKS[0].latLng[1], LANDMARKS[1].latLng[0], LANDMARKS[1].latLng[1]));

    // Effect hooks to update math live
    useEffect(() => {
        setLevResult(levenshtein(levA, levB));
    }, [levA, levB]);

    useEffect(() => {
        let timer;
        if (isSimulating && simFrame >= 0 && simFrame < levResult.path.length) {
            timer = setTimeout(() => {
                setSimFrame(prev => prev + 1);
            }, 600);
        } else if (simFrame === levResult.path.length) {
            setIsSimulating(false);
        }
        return () => clearTimeout(timer);
    }, [isSimulating, simFrame, levResult.path]);

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

    useEffect(() => {
        const timer = setTimeout(() => setVisibleStats(true), 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="landing-page">
            {/* ===== HERO ===== */}
            <section className="hero-section">
                <div className="hero-bg-effects">
                    <div className="glow-orb" style={{ width: '500px', height: '500px', background: 'var(--primary)', top: '-10%', right: '-5%' }}></div>
                    <div className="glow-orb" style={{ width: '400px', height: '400px', background: 'var(--secondary)', bottom: '-15%', left: '-10%' }}></div>
                    <div className="grid-overlay"></div>
                </div>

                <div className="container hero-content">
                    <div className="hero-badge animate-fade-in-up">
                        <div className="pulse-dot"></div>
                        <span>Machine Learning × Community Impact</span>
                    </div>

                    <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Empowering Local<br />
                        Micro-Enterprises through<br />
                        <span className="gradient-text">Intelligent Discovery</span>
                    </h1>

                    <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Acuity bridges the digital divide for neighborhood businesses using recommendation
                        algorithms, helping sari-sari stores, home-based services, and local vendors
                        gain visibility within their residential communities.
                    </p>

                    <div className="hero-cta animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <Link to="/home" className="btn btn-primary btn-lg">
                            Explore Directory <FiArrowRight />
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className={`stats-row ${visibleStats ? 'visible' : ''}`}>
                        <div className="stat-item">
                            <span className="stat-number">4</span>
                            <span className="stat-label">Registered Micro-Enterprises</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">7</span>
                            <span className="stat-label">Service Categories</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-number">619</span>
                            <span className="stat-label">Profile Impressions</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS — ML Pipeline ===== */}
            <section className="pipeline-section">
                <div className="container">
                    <div className="section-header">
                        <span className="badge badge-teal mb-4">The ML Pipeline</span>
                        <h2 className="section-heading">How Acuity Works</h2>
                        <p className="section-subtext">
                            A three-stage recommendation engine that transforms raw micro-enterprise data
                            into personalized, proximity-aware suggestions for residents.
                        </p>
                    </div>

                    <div className="pipeline-cards stagger-children">
                        <div className="pipeline-card glass-card">
                            <div className="pipeline-step-number">01</div>
                            <div className="pipeline-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--primary)' }}>
                                <FiDatabase size={28} />
                            </div>
                            <h3>Data Aggregation</h3>
                            <p>Business owners register their micro-enterprise details — services, location coordinates, contact info, and operating schedule — creating a structured local dataset.</p>
                            <div className="pipeline-tags">
                                <span>Profile Input</span>
                                <span>Geo-Coordinates</span>
                                <span>Service Tags</span>
                            </div>
                        </div>

                        <div className="pipeline-connector">
                            <div className="connector-line"></div>
                            <FiArrowRight className="connector-arrow" />
                        </div>

                        <div className="pipeline-card glass-card">
                            <div className="pipeline-step-number">02</div>
                            <div className="pipeline-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)' }}>
                                <FiCpu size={28} />
                            </div>
                            <h3>Algorithmic Processing</h3>
                            <p>The recommendation engine processes proximity data, service relevance, and community engagement signals to rank and score each enterprise for each user.</p>
                            <div className="pipeline-tags">
                                <span>Proximity Score</span>
                                <span>Relevance Matrix</span>
                                <span>Trust Signals</span>
                            </div>
                        </div>

                        <div className="pipeline-connector">
                            <div className="connector-line"></div>
                            <FiArrowRight className="connector-arrow" />
                        </div>

                        <div className="pipeline-card glass-card">
                            <div className="pipeline-step-number">03</div>
                            <div className="pipeline-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)' }}>
                                <FiEye size={28} />
                            </div>
                            <h3>Digital Visibility</h3>
                            <p>Residents receive personalized, location-aware business recommendations — bridging the gap between hidden local services and the community members who need them.</p>
                            <div className="pipeline-tags">
                                <span>Ranked Feed</span>
                                <span>Business Profiles</span>
                                <span>Map Pins</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ALGORITHM SHOWCASE ===== */}
            <section className="algorithm-showcase-section">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'center' }}>
                        <span className="badge badge-teal mb-4">Academic Validation</span>
                        <h2 className="section-heading">Algorithm Showcase</h2>
                        <p className="section-subtext" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            Acuity is powered by three mathematical engines that work together to bridge the gap between unstructured social data and hyperlocal discovery.
                        </p>
                    </div>

                    <div className="algo-tabs-container">
                        <div className="algo-tabs">
                            <button className={`algo-tab ${activeTab === 'levenshtein' ? 'active' : ''}`} onClick={() => setActiveTab('levenshtein')}>
                                1. Levenshtein Distance
                            </button>
                            <button className={`algo-tab ${activeTab === 'tfidf' ? 'active' : ''}`} onClick={() => setActiveTab('tfidf')}>
                                2. TF-IDF & Cosine Similarity
                            </button>
                            <button className={`algo-tab ${activeTab === 'haversine' ? 'active' : ''}`} onClick={() => setActiveTab('haversine')}>
                                3. Haversine Formula
                            </button>
                        </div>

                        <div className="algo-content glass-card">
                            {activeTab === 'levenshtein' && (
                                <div className="algo-panel animate-fade-in-up">
                                    <div className="algo-text">
                                        <h3>Levenshtein Distance</h3>
                                        <p>Used to verify informally extracted business names against the official municipal BPLO registry.</p>
                                        <div className="algo-math">Score = 1 - (Edits / MaxLength)</div>
                                        <ul className="algo-list">
                                            <li><FiCheckCircle className="text-teal" /> Pure character-by-character distance.</li>
                                            <li><FiCheckCircle className="text-teal" /> Calculates minimum edits (insertions, deletions, substitutions).</li>
                                            <li><FiCheckCircle className="text-teal" /> Punishes length discrepancies and mismatched words.</li>
                                        </ul>
                                    </div>
                                    <div className="algo-visual">
                                        <div className="mock-terminal">
                                            <div className="terminal-header">Interactive Python Simulator</div>
                                            <div className="terminal-body">
                                                <div className="terminal-inputs" style={{ marginBottom: '1rem' }}>
                                                    <input type="text" className="terminal-input" value={levA} onChange={(e) => { setLevA(e.target.value); setSimFrame(-1); setIsSimulating(false); }} placeholder="Input A" disabled={isSimulating} />
                                                    <input type="text" className="terminal-input" value={levB} onChange={(e) => { setLevB(e.target.value); setSimFrame(-1); setIsSimulating(false); }} placeholder="Input B" disabled={isSimulating} />
                                                </div>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <div className="terminal-line" style={{ flex: 1, height: '24px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                                        {simFrame === -1 || simFrame === levResult.path.length ? (
                                                            <span><span className="text-muted">Result:</span> {levResult.path.length > 0 && simFrame === levResult.path.length ? (levB || "").toLowerCase() : (levA || "").toLowerCase()}</span>
                                                        ) : (
                                                            <span style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
                                                                <span className="text-muted">Anim: </span>
                                                                <span style={{ color: '#e2e8f0' }}>
                                                                    {/* Prefix */}
                                                                    {levResult.path.slice(0, simFrame).filter(p => p.op !== 'delete').map(p => p.char).join('')}
                                                                    {/* Active */}
                                                                    {(() => {
                                                                        const active = levResult.path[simFrame];
                                                                        if (!active) return null;
                                                                        if (active.op === 'match') return <span className="char-match">{active.char}</span>;
                                                                        if (active.op === 'substitute') return <span className="char-substitute">{active.char}</span>;
                                                                        if (active.op === 'insert') return <span className="char-insert">{active.char}</span>;
                                                                        if (active.op === 'delete') return <span className="char-delete">{active.char}</span>;
                                                                        return null;
                                                                    })()}
                                                                    {/* Suffix */}
                                                                    {(() => {
                                                                        const consumed = levResult.path.slice(0, simFrame + 1).filter(p => p.op !== 'insert').length;
                                                                        return (levA || "").toLowerCase().substring(consumed);
                                                                    })()}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button className="btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: isSimulating ? 'not-allowed' : 'pointer', fontSize: '0.75rem', opacity: isSimulating ? 0.5 : 1 }} onClick={startSimulation} disabled={isSimulating}>
                                                        Simulate
                                                    </button>
                                                </div>

                                                <div className="terminal-line">Max Length: {levResult.max_len}</div>
                                                <div className="terminal-line">Edits Required: {simFrame >= 0 ? levResult.path.slice(0, Math.min(simFrame, levResult.path.length)).filter(p => p.op !== 'match').length : levResult.edits} / {levResult.edits}</div>
                                                <div className={`terminal-line ${levResult.score >= 0.8 ? 'text-success' : levResult.score >= 0.6 ? 'text-warning' : 'text-danger'}`}>
                                                    Final Score: {(levResult.score * 100).toFixed(2)}% {levResult.score >= 0.8 ? '(Auto-Verified)' : levResult.score >= 0.6 ? '(Manual Review)' : '(Mismatch)'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tfidf' && (
                                <div className="algo-panel animate-fade-in-up">
                                    <div className="algo-text">
                                        <h3>TF-IDF & Cosine Similarity</h3>
                                        <p>Transforms both user search queries and business descriptions into mathematical vectors to find the most contextually relevant services.</p>
                                        <div className="algo-math">cos(θ) = (A · B) / (||A|| × ||B||)</div>
                                        <ul className="algo-list">
                                            <li><FiCheckCircle className="text-teal" /> TF: Rewards keywords used often in a profile.</li>
                                            <li><FiCheckCircle className="text-teal" /> IDF: Penalizes common stopwords across the corpus.</li>
                                            <li><FiCheckCircle className="text-teal" /> Cosine Similarity: Measures the geometric angle between the query vector and the business vector.</li>
                                        </ul>
                                    </div>
                                    <div className="algo-visual" style={{ flexDirection: 'column' }}>
                                        <div className="algo-inputs" style={{ marginBottom: '2rem', width: '100%', maxWidth: '350px' }}>
                                            <input type="text" className="form-control mb-2" value={tfQuery} onChange={(e) => setTfQuery(e.target.value)} placeholder="Search Query" />
                                            <input type="text" className="form-control" value={tfDoc} onChange={(e) => setTfDoc(e.target.value)} placeholder="Business Profile" />
                                        </div>
                                        <div className="vector-viz">
                                            <div className="vector-axis y-axis"></div>
                                            <div className="vector-axis x-axis"></div>
                                            <div className="vector-line query-vector" style={{ transform: `rotate(${Math.min(90, Math.max(0, 45 - tfResult.angle/2))}deg)` }}>
                                                <span className="vector-label">Query</span>
                                            </div>
                                            <div className="vector-line profile-vector" style={{ transform: `rotate(${Math.min(90, Math.max(0, 45 + tfResult.angle/2))}deg)` }}>
                                                <span className="vector-label">Profile</span>
                                            </div>
                                            <div className="vector-angle">θ = {tfResult.angle.toFixed(1)}°</div>
                                            <div style={{ position: 'absolute', bottom: '-40px', left: '0', right: '0', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
                                                Cosine Sim: {(tfResult.sim * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'haversine' && (
                                <div className="algo-panel animate-fade-in-up">
                                    <div className="algo-text">
                                        <h3>Haversine Geographic Distance</h3>
                                        <p>Calculates the spherical Great-Circle distance between the resident's selected community landmark and the business's location.</p>
                                        <div className="algo-math">d = 2r × arcsin(√a)</div>
                                        <ul className="algo-list">
                                            <li><FiCheckCircle className="text-teal" /> Privacy-First: No real-time GPS tracking required.</li>
                                            <li><FiCheckCircle className="text-teal" /> Anchored to well-known community landmarks.</li>
                                            <li><FiCheckCircle className="text-teal" /> Proximity is mathematically blended with TF-IDF similarity to produce the final composite recommendation score.</li>
                                        </ul>
                                    </div>
                                    <div className="algo-visual flex-center" style={{ flexDirection: 'column' }}>
                                        <div className="algo-inputs" style={{ marginBottom: '2rem', width: '100%', maxWidth: '350px' }}>
                                            <select className="form-control mb-2" value={locA} onChange={(e) => setLocA(e.target.value)}>
                                                {LANDMARKS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                            </select>
                                            <select className="form-control" value={locB} onChange={(e) => setLocB(e.target.value)}>
                                                {LANDMARKS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="haversine-viz">
                                            <div className="globe">
                                                <div className="globe-lat"></div>
                                                <div className="globe-lon"></div>
                                                <div className="globe-pin resident-pin">📍 A</div>
                                                <div className="globe-pin biz-pin">🏪 B</div>
                                                {havDistance > 0 && (
                                                    <svg className="globe-curve" viewBox="0 0 100 100">
                                                        <path d="M 25 65 Q 50 30 75 45" fill="transparent" stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 4" />
                                                    </svg>
                                                )}
                                                <div className="globe-distance">d = {havDistance.toFixed(2)} km</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== RECOMMENDATION FEED PREVIEW ===== */}
            <section className="feed-section">
                <div className="container">
                    <div className="feed-layout">
                        <div className="feed-info">
                            <span className="badge badge-teal mb-4">Recommendation Feed</span>
                            <h2 className="section-heading">Personalized for<br /><span className="gradient-text">Every Resident</span></h2>
                            <p className="section-subtext">
                                Acuity surfaces relevant micro-enterprises based on your location,
                                search patterns, and community engagement — not paid promotions.
                            </p>
                            <div className="feed-features">
                                <div className="feed-feature">
                                    <FiMapPin className="feed-feature-icon" />
                                    <div>
                                        <strong>Proximity-First</strong>
                                        <span>Results sorted by distance from your home address</span>
                                    </div>
                                </div>
                                <div className="feed-feature">
                                    <FiCheckCircle className="feed-feature-icon" />
                                    <div>
                                        <strong>Trust Verified</strong>
                                        <span>Community engagement badges and verified contacts</span>
                                    </div>
                                </div>
                                <div className="feed-feature">
                                    <FiTrendingUp className="feed-feature-icon" />
                                    <div>
                                        <strong>Smart Ranking</strong>
                                        <span>ML-driven relevance scoring per user context</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="feed-preview">
                            {/* Mock Recommendation Cards */}
                            <div className="rec-card glass-card animate-fade-in-up">
                                <div className="rec-header">
                                    <span className="rec-label">
                                        <FiZap /> Top Pick for Your Area
                                    </span>
                                    <span className="rec-score">96% match</span>
                                </div>
                                <h4>Aling Nena's Sari-Sari Store</h4>
                                <p className="rec-meta"><FiMapPin /> 0.3 km away · Sari-Sari / Convenience</p>
                                <div className="rec-tags">
                                    <span>Groceries</span><span>Load</span><span>Ice</span>
                                </div>
                                <div className="rec-footer">
                                    <div className="rec-verified"><FiCheckCircle /> Verified Contact</div>
                                </div>
                            </div>

                            <div className="rec-card glass-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                                <div className="rec-header">
                                    <span className="rec-label secondary">
                                        <FiUsers /> Community Favorite
                                    </span>
                                    <span className="rec-score">89% match</span>
                                </div>
                                <h4>Maria's Home Kitchen</h4>
                                <p className="rec-meta"><FiMapPin /> 0.8 km away · Food & Beverages</p>
                                <div className="rec-tags">
                                    <span>Silog Meals</span><span>Pancit Bilao</span>
                                </div>
                                <div className="rec-footer">
                                    <div className="rec-verified"><FiCheckCircle /> Active Community Member</div>
                                </div>
                            </div>

                            <div className="rec-card glass-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                <div className="rec-header">
                                    <span className="rec-label">
                                        <FiSearch /> Matches "repair"
                                    </span>
                                    <span className="rec-score">82% match</span>
                                </div>
                                <h4>Kuya Jun's Vulcanizing</h4>
                                <p className="rec-meta"><FiMapPin /> 1.1 km away · Repair Services</p>
                                <div className="rec-tags">
                                    <span>Vulcanizing</span><span>Bike Repair</span>
                                </div>
                                <div className="rec-footer">
                                    <div className="rec-verified"><FiCheckCircle /> Verified Contact</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== INTERACTIVE MAP PREVIEW ===== */}
            <section className="map-preview-section">
                <div className="container">
                    <div className="section-header">
                        <span className="badge badge-teal mb-4">Barangay Map</span>
                        <h2 className="section-heading">Visualize Business Density</h2>
                        <p className="section-subtext">
                            An internal coordinate-based map helps residents discover nearby enterprises
                            without requiring external API dependencies.
                        </p>
                    </div>

                    <div className="map-preview-container glass-card">
                        <div className="map-grid">
                            {/* Simulated heat zones */}
                            <div className="heat-zone" style={{ left: '30%', top: '40%', width: '120px', height: '120px', background: 'rgba(220, 38, 38, 0.15)' }}></div>
                            <div className="heat-zone" style={{ left: '60%', top: '25%', width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.12)' }}></div>
                            <div className="heat-zone" style={{ left: '45%', top: '70%', width: '100px', height: '100px', background: 'rgba(245, 158, 11, 0.1)' }}></div>

                            {/* Pins */}
                            <div className="map-demo-pin" style={{ left: '40%', top: '55%' }}>
                                <span className="pin-dot teal"></span>
                                <span className="pin-label">🛒 Sari-Sari</span>
                            </div>
                            <div className="map-demo-pin" style={{ left: '70%', top: '30%' }}>
                                <span className="pin-dot indigo"></span>
                                <span className="pin-label">🔧 Repair</span>
                            </div>
                            <div className="map-demo-pin" style={{ left: '50%', top: '80%' }}>
                                <span className="pin-dot amber"></span>
                                <span className="pin-label">🍔 Food</span>
                            </div>
                            <div className="map-demo-pin" style={{ left: '30%', top: '65%' }}>
                                <span className="pin-dot teal"></span>
                                <span className="pin-label">🧺 Laundry</span>
                            </div>

                            {/* Your location */}
                            <div className="map-demo-pin user-pin" style={{ left: '45%', top: '60%' }}>
                                <span className="pin-you"></span>
                                <span className="pin-label you-label">📍 You</span>
                            </div>
                        </div>

                        <div className="map-legend">
                            <div className="legend-item"><span className="legend-dot teal"></span> Convenience</div>
                            <div className="legend-item"><span className="legend-dot indigo"></span> Repair</div>
                            <div className="legend-item"><span className="legend-dot amber"></span> Food</div>
                            <div className="legend-item"><span className="legend-dot blue"></span> Your Location</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-box gradient-border">
                        <div className="cta-inner">
                            <h2>Ready to Discover Your Neighborhood?</h2>
                            <p>Whether you're a resident seeking services or a business owner aiming for visibility — Acuity connects you.</p>
                            <div className="cta-buttons">
                                <Link to="/home" className="btn btn-primary btn-lg">
                                    Start Discovering <FiArrowRight />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <p>© 2026 Acuity — A CS Thesis Project · Barangay Banay-Banay, Cabuyao, Laguna</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
