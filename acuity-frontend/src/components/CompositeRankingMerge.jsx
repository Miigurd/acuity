import React, { useState, useEffect } from 'react';

import GraphNodeTooltip from './GraphNodeTooltip';


const NODE_INFO = {
  compQuery: { title: "Search Terms", desc: "The words the user is looking for." },
  compProfile: { title: "Business Profile", desc: "All the text details we have about the business." },
  compCosine: { title: "Text Match Score", desc: "How well the business's details match the user's search terms." },
  compUserLoc: { title: "User Location", desc: "Where the user is on the map." },
  compBusLoc: { title: "Business Location", desc: "Where the business is on the map." },
  compHaversine: { title: "Location Score", desc: "How physically close the business is to the user." },
  alpha: { title: "Text Importance", desc: "How much we care about the text matching. Currently set to 60% of the final score." },
  beta: { title: "Location Importance", desc: "How much we care about physical distance. Currently set to 40% of the final score." },
  composite: { title: "Final Ranking Score", desc: "The ultimate score used to sort the results, combining both text match and location." }
};

const CompositeRankingMerge = ({ businesses = [], query = 'repair', userLoc = 'Unknown' }) => {
  const [alpha, setAlpha] = useState(0.6);
  const [selectedNode, setSelectedNode] = useState(null);
  const step = 0; 
  const isPlaying = false;
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = () => setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const beta = 1.0 - alpha; 

  const truncate = (str, len) => (str && str.length > len) ? str.substring(0, len) + '...' : (str || '');

  // Compute final scores and sort
  const scoredSamples = [...businesses]
    .map(b => ({
      ...b,
      finalScore: (b.relevance_score * alpha) + (b.proximity_score * beta)
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 3); // top 3

  // Fallback if no mock data
  if (scoredSamples.length === 0) {
    scoredSamples.push(
      { id: '1', name: "Sample A (Text Match)", relevance_score: 0.95, proximity_score: 0.2, finalScore: 0.95 * alpha + 0.2 * beta, distance_km: "2.5" },
      { id: '2', name: "Sample B (Nearby)", relevance_score: 0.40, proximity_score: 0.9, finalScore: 0.40 * alpha + 0.9 * beta, distance_km: "0.5" },
      { id: '3', name: "Sample C (Balanced)", relevance_score: 0.70, proximity_score: 0.75, finalScore: 0.70 * alpha + 0.75 * beta, distance_km: "1.2" }
    );
  }

  const selectedObj = scoredSamples.find(s => s.id === selectedId) || scoredSamples[0];
  const selectedIndex = scoredSamples.findIndex(s => s.id === selectedObj.id) !== -1 ? scoredSamples.findIndex(s => s.id === selectedObj.id) : 0;

  
  return (
    <div className="card mt-6">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
        Algorithm Integration: Weighted Merge Graph
      </h3>
      <p className="text-secondary text-sm mb-4">
        Trace the full pipeline: raw input features are computed independently, weighted, and merged to produce the final rank. Click a row to trace its specific path!
      </p>

      <div style={{ position: 'relative', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', padding: '24px 0', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* SVG Graph encompassing everything including the foreignObject list */}
        <svg viewBox="0 0 420 750" style={{ width: '100%', maxWidth: '420px', height: 'auto', overflow: 'visible' }}>
          <defs>
            <marker id="arrow-active-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
            </marker>
            <marker id="arrow-active-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="#ec4899" strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
            </marker>
            <marker id="arrow-active-primary" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
            </marker>
            <marker id="arrow-inactive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--border)" strokeWidth="1.5"/>
            </marker>
          </defs>

          {/* EDGES */}
          {/* Query -> Cosine */}
          <path id="edge-query-cosine" d="M65,85 L82,126" fill="none" stroke={(step >= 1 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth={(step >= 1 || step === 0) ? "3" : "1.5"} opacity={step >= 1 ? 1 : 0.4} markerEnd={(step >= 1 || step === 0) ? "url(#arrow-active-blue)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          {/* Profile -> Cosine */}
          <path id="edge-profile-cosine" d="M135,85 L118,126" fill="none" stroke={(step >= 1 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth={(step >= 1 || step === 0) ? "3" : "1.5"} opacity={step >= 1 ? 1 : 0.4} markerEnd={(step >= 1 || step === 0) ? "url(#arrow-active-blue)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          {/* Cosine -> Alpha */}
          <path id="edge-cosine-alpha" d="M100,212 L100,242" fill="none" stroke={(step >= 3 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth={(step >= 3 || step === 0) ? "3" : "1.5"} opacity={step >= 3 || step === 0 ? 1 : 0.4} markerEnd={(step >= 3 || step === 0) ? "url(#arrow-active-blue)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          
          {/* User Loc -> Hav */}
          <path id="edge-userloc-hav" d="M285,85 L302,126" fill="none" stroke={(step >= 2 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth={(step >= 2 || step === 0) ? "3" : "1.5"} opacity={step >= 2 ? 1 : 0.4} markerEnd={(step >= 2 || step === 0) ? "url(#arrow-active-pink)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          {/* Bus Loc -> Hav */}
          <path id="edge-busloc-hav" d="M355,85 L338,126" fill="none" stroke={(step >= 2 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth={(step >= 2 || step === 0) ? "3" : "1.5"} opacity={step >= 2 ? 1 : 0.4} markerEnd={(step >= 2 || step === 0) ? "url(#arrow-active-pink)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          {/* Hav -> Beta */}
          <path id="edge-hav-beta" d="M320,212 L320,242" fill="none" stroke={(step >= 3 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth={(step >= 3 || step === 0) ? "3" : "1.5"} opacity={step >= 3 || step === 0 ? 1 : 0.4} markerEnd={(step >= 3 || step === 0) ? "url(#arrow-active-pink)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          
          {/* Alpha -> Composite */}
          <path id="edge-alpha-comp" d="M128,321 L174,370" fill="none" stroke={(step >= 3 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth={(step >= 3 || step === 0) ? "3" : "1.5"} opacity={step >= 3 ? 1 : 0.4} markerEnd={(step >= 3 || step === 0) ? "url(#arrow-active-blue)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          
          {/* Beta -> Composite */}
          <path id="edge-beta-comp" d="M292,321 L246,370" fill="none" stroke={(step >= 3 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth={(step >= 3 || step === 0) ? "3" : "1.5"} opacity={step >= 3 ? 1 : 0.4} markerEnd={(step >= 3 || step === 0) ? "url(#arrow-active-pink)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />
          
          {/* Composite -> List */}
          <path id="edge-comp-list" d="M210,458 L210,484" fill="none" stroke={(step >= 4 || step === 0) ? 'var(--primary)' : 'var(--border)'} strokeWidth={(step >= 4 || step === 0) ? "3" : "1.5"} opacity={step >= 4 ? 1 : 0.4} markerEnd={(step >= 4 || step === 0) ? "url(#arrow-active-indigo)" : "url(#arrow-inactive)"} style={{ transition: 'stroke 0.4s, opacity 0.4s' }} />

          {/* ACTIVE-EDGE FLOW INDICATORS */}
          {!isReducedMotion && (step >= 1 || step === 0) && (
            <>
              <circle r="4" fill="#3b82f6"><animateMotion dur="1s" repeatCount="indefinite" path="M65,85 L82,126" /></circle>
              <circle r="4" fill="#3b82f6"><animateMotion dur="1s" repeatCount="indefinite" path="M135,85 L118,126" /></circle>
            </>
          )}
          {!isReducedMotion && (step >= 2 || step === 0) && (
            <>
              <circle r="4" fill="#ec4899"><animateMotion dur="1s" repeatCount="indefinite" path="M285,85 L302,126" /></circle>
              <circle r="4" fill="#ec4899"><animateMotion dur="1s" repeatCount="indefinite" path="M355,85 L338,126" /></circle>
            </>
          )}
          {!isReducedMotion && (step >= 3 || step === 0) && (
            <>
              <circle r="4" fill="#3b82f6"><animateMotion dur="1s" repeatCount="indefinite" path="M100,212 L100,242" /></circle>
              <circle r="4" fill="#3b82f6"><animateMotion dur="1s" repeatCount="indefinite" path="M128,321 L174,370" /></circle>
              <circle r="4" fill="#ec4899"><animateMotion dur="1s" repeatCount="indefinite" path="M320,212 L320,242" /></circle>
              <circle r="4" fill="#ec4899"><animateMotion dur="1s" repeatCount="indefinite" path="M292,321 L246,370" /></circle>
            </>
          )}
          {!isReducedMotion && (step >= 4 || step === 0) && (
            <circle r="4" fill="var(--primary)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M210,458 L210,484" />
            </circle>
          )}

          {/* NODES */}
          {/* Query Input */}
          <g onClick={() => setSelectedNode("compQuery")} style={{ cursor: "pointer", opacity: step >= 1 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="50" cy="50" r="38" fill="var(--bg-base)" stroke={(step >= 1 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
            <text x="50" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Query</text>
            <text x="50" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9"><title>{query}</title>{truncate(query, 12)}</text>
          </g>

          {/* Profile Input */}
          <g onClick={() => setSelectedNode("compProfile")} style={{ cursor: "pointer", opacity: step >= 1 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="150" cy="50" r="38" fill="var(--bg-base)" stroke={(step >= 1 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
            <text x="150" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Profile</text>
            <text x="150" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9"><title>{selectedObj.name}</title>{truncate(selectedObj.name, 12)}</text>
          </g>

          {/* UserLoc Input */}
          <g onClick={() => setSelectedNode("compUserLoc")} style={{ cursor: "pointer", opacity: step >= 2 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="270" cy="50" r="38" fill="var(--bg-base)" stroke={(step >= 2 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
            <text x="270" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">User Loc</text>
            <text x="270" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9"><title>{userLoc}</title>{truncate(userLoc, 8)}</text>
          </g>

          {/* BusLoc Input */}
          <g onClick={() => setSelectedNode("compBusLoc")} style={{ cursor: "pointer", opacity: step >= 2 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="370" cy="50" r="38" fill="var(--bg-base)" stroke={(step >= 2 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
            <text x="370" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Bus. Loc</text>
            <text x="370" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">{selectedObj.distance_km}km</text>
          </g>

          {/* Cosine Compute */}
          <g onClick={() => setSelectedNode("compCosine")} style={{ cursor: "pointer", opacity: step >= 1 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="100" cy="170" r="42" fill="var(--bg-base)" stroke={(step >= 1 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="100" y="165" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Cosine</text>
            <text x="100" y="185" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="800">{(selectedObj.relevance_score || 0).toFixed(2)}</text>
          </g>

          {/* Alpha Weight */}
          <g onClick={() => setSelectedNode("alpha")} style={{ cursor: "pointer", opacity: step >= 3 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="100" cy="290" r="42" fill="var(--bg-base)" stroke={(step >= 3 || step === 0) ? '#3b82f6' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="100" y="285" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Weight α</text>
            <text x="100" y="305" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="800">{(alpha * 100).toFixed(0)}%</text>
          </g>

          {/* Haversine Compute */}
          <g onClick={() => setSelectedNode("compHaversine")} style={{ cursor: "pointer", opacity: step >= 2 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="320" cy="170" r="42" fill="var(--bg-base)" stroke={(step >= 2 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="320" y="165" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Haversine</text>
            <text x="320" y="185" textAnchor="middle" fill="#ec4899" fontSize="13" fontWeight="800">{(selectedObj.proximity_score || 0).toFixed(2)}</text>
          </g>

          {/* Beta Weight */}
          <g onClick={() => setSelectedNode("beta")} style={{ cursor: "pointer", opacity: step >= 3 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="320" cy="290" r="42" fill="var(--bg-base)" stroke={(step >= 3 || step === 0) ? '#ec4899' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="320" y="285" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Weight β</text>
            <text x="320" y="305" textAnchor="middle" fill="#ec4899" fontSize="13" fontWeight="800">{(beta * 100).toFixed(0)}%</text>
          </g>

          {/* Composite Merge Node */}
          <g onClick={() => setSelectedNode("composite")} style={{ cursor: "pointer", opacity: step >= 3 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
              <circle cx="210" cy="410" r="48" fill="var(--bg-base)" stroke={(step >= 3 || step === 0) ? 'var(--primary)' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="210" y="405" textAnchor="middle" fill="var(--primary)" fontSize="12" fontWeight="bold">Composite</text>
            <text x="210" y="425" textAnchor="middle" fill="var(--primary)" fontSize="16" fontWeight="800">{(selectedObj.finalScore || 0).toFixed(2)}</text>
          </g>

          {/* Live Re-ranking HTML List embedded via foreignObject */}
          <foreignObject x="30" y="490" width="370" height="240">
            <div style={{
              width: '100%', height: '100%', padding: '12px',
              background: step >= 4 ? 'var(--bg-elevated)' : 'var(--bg-card)',
              border: step >= 4 ? '2px solid var(--primary)' : '2px dashed var(--border)',
              borderRadius: 'var(--radius-card)',
              opacity: step >= 4 || step === 0 ? 1 : 0.4,
              transition: isReducedMotion ? 'none' : 'all 0.4s ease',
              boxSizing: 'border-box'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Live Re-ranking List</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', height: '180px' }}>
                {scoredSamples.map((s, idx) => {
                  const isSelected = selectedObj.id === s.id;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      style={{
                        position: 'absolute',
                        top: `${idx * 60}px`,
                        left: 0, right: 0,
                        padding: '10px 12px',
                        background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-card)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: isReducedMotion ? 'none' : 'top 0.4s ease-in-out, border 0.2s',
                        cursor: 'pointer',
                        zIndex: 3 - idx
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{truncate(s.name, 15)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                        <span className="badge badge-sky" style={{ minWidth: '50px', textAlign: 'center' }}>
                          {(s.finalScore || 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </foreignObject>
        </svg>
        <GraphNodeTooltip info={NODE_INFO[selectedNode]} onClose={() => setSelectedNode(null)} />
      </div>

      
    </div>
  );
};

export default CompositeRankingMerge;
