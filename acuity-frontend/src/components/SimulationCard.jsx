import React, { useState } from 'react';
import './SimulationCard.css';

const calculateCosineSimilarity = (query, doc) => {
    if (!query) return { sim: 1, angle: 0 };
    const STOP_WORDS = new Set(["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"]);
    
    const getTokens = (str) => {
        let tokens = (str||"").toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
        return tokens.filter(t => !STOP_WORDS.has(t));
    };
    
    const qTokens = getTokens(query);
    const dTokens = getTokens(doc);
    
    const getTf = (count) => count > 0 ? 1.0 + Math.log(count) : 0;
    
    let dotProduct = 0;
    let magQ = 0;
    let magD = 0;
    
    const tokenBreakdown = [];
    const uniqueTokens = Array.from(new Set([...qTokens, ...dTokens]));
    uniqueTokens.forEach(t => {
        const isMatch = (token, vocabTerm) => token === vocabTerm || (token.length >= 3 && (vocabTerm.startsWith(token) || token.startsWith(vocabTerm)));
        
        const qCount = qTokens.filter(x => isMatch(x, t)).length;
        const dCount = dTokens.filter(x => isMatch(x, t)).length;
        
        const qTf = getTf(qCount);
        const dTf = getTf(dCount);
        
        if (qTf > 0 || dTf > 0) {
            tokenBreakdown.push({ term: t, qTf, dTf });
        }
        
        dotProduct += (qTf * dTf);
        magQ += (qTf * qTf);
        magD += (dTf * dTf);
    });
    
    tokenBreakdown.sort((a, b) => {
        const aInQuery = a.qTf > 0;
        const bInQuery = b.qTf > 0;
        if (aInQuery && !bInQuery) return -1;
        if (!aInQuery && bInQuery) return 1;
        return (b.qTf + b.dTf) - (a.qTf + a.dTf);
    });
    
    magQ = Math.sqrt(magQ);
    magD = Math.sqrt(magD);
    
    const sim = (magQ && magD) ? (dotProduct / (magQ * magD)) : 0;
    const angle = Math.acos(Math.min(1, Math.max(-1, sim))) * (180 / Math.PI);
    return { sim, angle: isNaN(angle) ? 90 : angle, tokenBreakdown: tokenBreakdown.slice(0, 8) };
};

const SimulationCard = ({ business, query, userLandmark, distance, getLandmarkById }) => {
    const [simStep, setSimStep] = useState(0);

    const runSimulation = () => {
        setSimStep(1);
        setTimeout(() => setSimStep(2), 1200);
        setTimeout(() => setSimStep(3), 2400);
        setTimeout(() => setSimStep(4), 3600);
    };

    const bizLandmark = getLandmarkById(business.landmarkId);
    
    // Fallback description to generic services if not present
    const docString = business.description + " " + (business.services || []).join(" ");
    const tfResult = calculateCosineSimilarity(query || "service", docString);
    
    // Simulate coordinates on globe UI for Haversine
    // Map latitude and longitude for visualization
    const normalizeCoord = (val, isLat) => {
        if (!val) return 50;
        // Pseudo-normalization to keep pins within 20% to 80% bounds of the globe UI
        if (isLat) return Math.max(20, Math.min(80, 80 - ((val - 14.0) / 0.5) * 60));
        return Math.max(20, Math.min(80, 20 + ((val - 121.0) / 0.5) * 60));
    };
    
    const userY = normalizeCoord(userLandmark?.latLng?.[0], true);
    const userX = normalizeCoord(userLandmark?.latLng?.[1], false);
    const bizY = normalizeCoord(bizLandmark?.latLng?.[0], true);
    const bizX = normalizeCoord(bizLandmark?.latLng?.[1], false);
    
    // Get precalculated scores from backend if they exist, otherwise simulate them visually
    const relevanceScore = business.relevance_score !== undefined ? business.relevance_score : (query ? tfResult.sim : 1);
    const proximityScore = business.proximity_score !== undefined ? business.proximity_score : Math.max(0, 1 - (distance / 5)); // simulated 5km max
    const finalScore = Number((business.final_score !== undefined && business.final_score !== null) ? business.final_score : (relevanceScore * 0.6) + (proximityScore * 0.4));

    return (
        <div className="card glass-card animate-float-in flex-col" style={{ gap: 'var(--spacing-6)', width: '100%', marginBottom: 'var(--spacing-8)', overflow: 'visible', animationDelay: `${(business.id % 5) * 100}ms` }}>
            <div className="flex justify-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--spacing-4)' }}>
                <div>
                    <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>{business.name}</h3>
                    <p className="text-secondary mt-1" style={{ fontSize: 'var(--font-size-sm)' }}>{bizLandmark?.name} · {business.locationType}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {simStep === 4 ? (
                        <>
                            <div className="animate-fade-in-up" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--primary)' }}>
                                {Math.round(finalScore * 100)}%
                            </div>
                            <div className="animate-fade-in-up text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Composite Score</div>
                        </>
                    ) : (
                        <div className="text-muted mt-2" style={{ fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                            Score Hidden
                        </div>
                    )}
                </div>
            </div>

            {simStep === 0 ? (
                <div className="p-6 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <button className="btn btn-primary" onClick={runSimulation}>▶ Run Algorithm Simulation</button>
                    <p className="text-muted mt-4" style={{ fontSize: 'var(--font-size-sm)' }}>Watch how the AI computes relevance and proximity in real-time.</p>
                </div>
            ) : (
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {/* TF-IDF SIMULATION */}
                    <div className="animate-fade-in-up p-4" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-4 font-semibold text-primary">
                        <span className="badge badge-primary" style={{ width: '24px', height: '24px', padding: 0 }}>1</span>
                        TF-IDF & Cosine Similarity
                    </div>
                    <div className="text-secondary mb-6" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Calculates text relevance between query "<strong className="text-primary">{query || "None"}</strong>" and the business profile vector.
                        <div className="mt-2 p-2 text-center" style={{ fontFamily: 'monospace', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            cos(θ) = (A · B) / (||A|| × ||B||)
                            <div className="flex flex-col gap-1 text-left mt-2 pt-1 text-muted" style={{ fontSize: 'var(--font-size-xs)', borderTop: '1px solid var(--border)' }}>
                                <span><strong>A</strong> = Query Vector</span>
                                <span><strong>B</strong> = Profile Vector</span>
                                <span><strong>A · B</strong> = Overlapping Terms</span>
                                <span><strong>||x||</strong> = Magnitude</span>
                            </div>
                        </div>
                    </div>
                    <div className="sim-vector-viz" style={{ marginBottom: '1.5rem' }}>
                        <div className="sim-vector-line sim-query-vector" style={{ transform: `rotate(${Math.min(90, Math.max(0, 45 - tfResult.angle/2))}deg)` }}>
                            <span className="sim-vector-label">Query</span>
                        </div>
                        <div className="sim-vector-line sim-profile-vector" style={{ transform: `rotate(${Math.min(90, Math.max(0, 45 + tfResult.angle/2))}deg)` }}>
                            <span className="sim-vector-label">Profile</span>
                        </div>
                        <div className="sim-vector-angle">θ = {tfResult.angle.toFixed(1)}°</div>
                    </div>

                    {tfResult.tokenBreakdown && tfResult.tokenBreakdown.length > 0 && (
                        <div className="mb-6 overflow-hidden" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            <div className="text-center text-secondary p-2" style={{ fontSize: 'var(--font-size-xs)', borderBottom: '1px solid var(--border)' }}>Term Frequencies (TF Matrix)</div>
                            <div style={{ maxHeight: '110px', overflowY: 'auto' }}>
                                <table className="w-full text-center" style={{ width: '100%', fontSize: 'var(--font-size-xs)', borderCollapse: 'collapse' }}>
                                    <thead className="text-muted" style={{ background: 'var(--bg-elevated)' }}>
                                        <tr>
                                            <th className="font-medium text-left px-3 py-1" style={{ borderBottom: '1px solid var(--border)' }}>Term</th>
                                            <th className="font-medium text-primary py-1" style={{ borderBottom: '1px solid var(--border)' }}>Vector A</th>
                                            <th className="font-medium text-secondary py-1" style={{ borderBottom: '1px solid var(--border)' }}>Vector B</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tfResult.tokenBreakdown.map((t, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td className="text-left font-semibold px-3 py-1" style={{ color: 'var(--text-primary)' }}>{t.term}</td>
                                                <td className="py-1" style={{ color: t.qTf > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>{t.qTf.toFixed(2)}</td>
                                                <td className="py-1" style={{ color: t.dTf > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>{t.dTf.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    <div className="text-center p-2 rounded" style={{ background: 'var(--bg-surface)', fontSize: 'var(--font-size-sm)', border: '1px solid var(--border)' }}>
                        Relevance Score: <strong>{Math.round(relevanceScore * 100)}%</strong>
                    </div>
                </div>

                {/* HAVERSINE SIMULATION */}
                {simStep >= 2 ? (
                    <div className="animate-fade-in-up p-4" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <span className="badge badge-success" style={{ width: '24px', height: '24px', padding: 0 }}>2</span>
                        Haversine Geographic Distance
                    </div>
                    <div className="text-secondary mb-6" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Calculates Great-Circle distance between user location ({userLandmark?.name}) and business ({bizLandmark?.name}).
                        <div className="mt-2 p-2 text-center" style={{ fontFamily: 'monospace', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            d = 2r × arcsin(√a)
                            <div className="flex flex-col gap-1 text-left mt-2 pt-1 text-muted" style={{ fontSize: 'var(--font-size-xs)', borderTop: '1px solid var(--border)' }}>
                                <span><strong>d</strong> = Distance (km)</span>
                                <span><strong>r</strong> = Earth radius (6,371km)</span>
                                <span><strong>a</strong> = Chord length squared</span>
                            </div>
                        </div>
                    </div>
                    {userLandmark?.latLng && bizLandmark?.latLng && (
                        <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ padding: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>Coordinate Values (Haversine Inputs)</div>
                            <table style={{ width: '100%', fontSize: '0.7rem', textAlign: 'center', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                    <tr>
                                        <th style={{ padding: '4px', borderBottom: '1px solid var(--border)', textAlign: 'left', paddingLeft: '8px', fontWeight: 'normal' }}>Point</th>
                                        <th style={{ padding: '4px', borderBottom: '1px solid var(--border)', fontWeight: 'normal' }}>Latitude</th>
                                        <th style={{ padding: '4px', borderBottom: '1px solid var(--border)', fontWeight: 'normal' }}>Longitude</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '4px 8px', textAlign: 'left', fontWeight: '600', color: 'var(--primary)' }}>Point 1 (User)</td>
                                        <td style={{ padding: '4px' }}>{userLandmark.latLng[0].toFixed(5)}°</td>
                                        <td style={{ padding: '4px' }}>{userLandmark.latLng[1].toFixed(5)}°</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '4px 8px', textAlign: 'left', fontWeight: '600', color: 'var(--secondary)' }}>Point 2 (Profile)</td>
                                        <td style={{ padding: '4px' }}>{bizLandmark.latLng[0].toFixed(5)}°</td>
                                        <td style={{ padding: '4px' }}>{bizLandmark.latLng[1].toFixed(5)}°</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 8px', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Delta (Δ)</td>
                                        <td style={{ padding: '4px', color: 'var(--text-muted)' }}>{Math.abs(userLandmark.latLng[0] - bizLandmark.latLng[0]).toFixed(5)}°</td>
                                        <td style={{ padding: '4px', color: 'var(--text-muted)' }}>{Math.abs(userLandmark.latLng[1] - bizLandmark.latLng[1]).toFixed(5)}°</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div style={{ paddingBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                        <div className="sim-globe">
                            <div className="sim-globe-lat"></div>
                            <div className="sim-globe-lon"></div>
                            <div className="sim-globe-pin" style={{ left: `${userX}%`, top: `${userY}%` }}>📍</div>
                            <div className="sim-globe-pin" style={{ left: `${bizX}%`, top: `${bizY}%` }}>🏪</div>
                            {distance > 0 && (
                                <svg className="sim-globe-curve" viewBox="0 0 100 100" style={{ pointerEvents: 'none' }}>
                                    <path d={`M ${userX} ${userY} Q ${50} ${20} ${bizX} ${bizY}`} fill="transparent" stroke="var(--primary)" strokeWidth="2" strokeDasharray="3 3" />
                                </svg>
                            )}
                            <div className="sim-globe-distance">d = {Number(distance || 0).toFixed(2)} km</div>
                        </div>
                    </div>

                    <div className="text-center p-2 rounded mt-4" style={{ background: 'var(--bg-surface)', fontSize: 'var(--font-size-sm)', border: '1px solid var(--border)' }}>
                        Proximity Score: <strong>{Math.round(proximityScore * 100)}%</strong>
                    </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center p-4 text-muted" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        Waiting for vector calculations...
                    </div>
                )}
                           {/* COMPOSITE SCORE SIMULATION */}
                {simStep >= 3 ? (
                    <div className="animate-fade-in-up p-4 flex flex-col justify-center" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <span className="badge badge-warning" style={{ width: '24px', height: '24px', padding: 0 }}>3</span>
                        Composite Ranking Algorithm
                    </div>
                    <div className="text-secondary mb-6" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Blends text relevance and geographical proximity to determine final feed placement.
                    </div>
                    
                    <div className="p-4" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                        <div className="mb-2 text-muted" style={{ fontSize: 'var(--font-size-xs)' }}># Mathematical Formula</div>
                        <div className="mb-4 text-primary" style={{ fontSize: 'var(--font-size-sm)' }}>
                            Score = (W₁ * TFIDF) + (W₂ * PROX)
                        </div>
                        <div className="flex justify-between mb-1" style={{ fontSize: 'var(--font-size-sm)' }}>
                            <span>Weight 1 (Text): 0.6</span>
                            <span className="text-primary">{(relevanceScore * 0.6).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between pb-2" style={{ fontSize: 'var(--font-size-sm)', borderBottom: '1px dashed var(--border)' }}>
                            <span>Weight 2 (Dist): 0.4</span>
                            <span className="text-success">{(proximityScore * 0.4).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 text-primary" style={{ fontSize: 'var(--font-size-lg)' }}>
                            <span>Final Rank Score:</span>
                            <span>{finalScore.toFixed(3)}</span>
                        </div>
                    </div>
                </div>
                ) : (
                    <div className="flex items-center justify-center p-4 text-muted" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        Waiting for geospatial data...
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default SimulationCard;
