import React, { useState, useEffect } from 'react';
import { FiPlay, FiRefreshCw } from 'react-icons/fi';

const CompositeRankingMerge = () => {
  const [alpha, setAlpha] = useState(0.6);
  const [step, setStep] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = () => setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const beta = 1.0 - alpha; 

  const samples = [
    { name: "Sample A (Text Match)", textScore: 0.95, distScore: 0.2 },
    { name: "Sample B (Nearby)", textScore: 0.40, distScore: 0.9 },
    { name: "Sample C (Balanced)", textScore: 0.70, distScore: 0.75 }
  ];

  const scoredSamples = samples.map(s => ({
    ...s,
    finalScore: (s.textScore * alpha) + (s.distScore * beta)
  })).sort((a, b) => b.finalScore - a.finalScore);

  const playWalkthrough = () => {
    setIsPlaying(true);
    setStep(0);
    setTimeout(() => setStep(1), 1000); 
    setTimeout(() => setStep(2), 2500); 
    setTimeout(() => setStep(3), 4000); 
    setTimeout(() => setStep(4), 5500);
    setTimeout(() => setIsPlaying(false), 7000);
  };

  return (
    <div className="card mt-6">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
        Algorithm Integration: Weighted Merge Graph
      </h3>
      <p className="text-secondary text-sm mb-4">
        The composite ranking is not a standalone algorithm, but a merge point combining NLP relevance and geographic proximity. Adjust the weights (α + β = 1) to see how shifting priority changes the final ranking.
      </p>

      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', padding: '24px 0', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* SVG Graph */}
        <svg viewBox="0 0 420 320" style={{ width: '100%', maxWidth: '420px', height: 'auto', overflow: 'visible' }}>
          <defs>
            <marker id="arrow-active-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="#3b82f6" strokeWidth="2"/>
            </marker>
            <marker id="arrow-active-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="#ec4899" strokeWidth="2"/>
            </marker>
            <marker id="arrow-active-primary" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--primary)" strokeWidth="2"/>
            </marker>
            <marker id="arrow-inactive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--border)" strokeWidth="1.5"/>
            </marker>
          </defs>

          {/* EDGES */}
          {/* Cosine -> Composite */}
          <path id="edge-cosine" d="M120,90 C120,150 210,130 210,192"
                stroke={step >= 3 ? '#3b82f6' : 'var(--border)'}
                strokeWidth={step >= 3 ? "3" : "1.5"}
                opacity={step >= 3 ? 1 : 0.4}
                markerEnd={step >= 3 ? "url(#arrow-active-blue)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />

          {/* Haversine -> Composite */}
          <path id="edge-haversine" d="M300,90 C300,150 210,130 210,192"
                stroke={step >= 3 ? '#ec4899' : 'var(--border)'}
                strokeWidth={step >= 3 ? "3" : "1.5"}
                opacity={step >= 3 ? 1 : 0.4}
                markerEnd={step >= 3 ? "url(#arrow-active-pink)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />

          {/* Composite -> Ranking Output */}
          <path id="edge-output" d="M210,270 L210,330"
                stroke={step >= 4 ? 'var(--primary)' : 'var(--border)'}
                strokeWidth={step >= 4 ? "3" : "1.5"}
                opacity={step >= 4 ? 1 : 0.4}
                markerEnd={step >= 4 ? "url(#arrow-active-primary)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />

          {/* ACTIVE-EDGE FLOW INDICATORS */}
          {/* We only run the flow animations if not reduced motion and during the respective steps */}
          {!isReducedMotion && step === 3 && (
            <>
              <circle r="4" fill="#3b82f6">
                <animateMotion dur="1s" repeatCount="indefinite" path="M120,90 C120,150 210,130 210,192" />
              </circle>
              <circle r="4" fill="#ec4899">
                <animateMotion dur="1s" repeatCount="indefinite" path="M300,90 C300,150 210,130 210,192" />
              </circle>
            </>
          )}

          {!isReducedMotion && step === 4 && (
            <circle r="4" fill="var(--primary)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M210,270 L210,330" />
            </circle>
          )}

          {/* NODES */}
          {/* Cosine Source Node */}
          <g style={{ opacity: step >= 1 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="120" cy="50" r="40" fill={step >= 1 ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)'} stroke={step >= 1 ? '#3b82f6' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="120" y="45" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">Cosine</text>
            <text x="120" y="65" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="800">α = {(alpha * 100).toFixed(0)}%</text>
          </g>

          {/* Haversine Source Node */}
          <g style={{ opacity: step >= 2 || step === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="300" cy="50" r="40" fill={step >= 2 ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-card)'} stroke={step >= 2 ? '#ec4899' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="300" y="45" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">Haversine</text>
            <text x="300" y="65" textAnchor="middle" fill="#ec4899" fontSize="14" fontWeight="800">β = {(beta * 100).toFixed(0)}%</text>
          </g>

          {/* Composite Merge Node */}
          <g style={{ opacity: step >= 3 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="210" cy="230" r="40" fill={step >= 3 ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)'} stroke={step >= 3 ? 'var(--primary)' : 'var(--border)'} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
            <text x="210" y="225" textAnchor="middle" fill="var(--primary)" fontSize="12" fontWeight="bold">Composite</text>
            <text x="210" y="240" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">α + β merge</text>
          </g>
        </svg>

        {/* Live Re-ranking HTML output directly attached below SVG */}
        <div style={{
          width: '90%', maxWidth: '420px', padding: '16px', marginTop: '10px',
          background: step >= 4 ? 'var(--bg-elevated)' : 'var(--bg-card)',
          border: step >= 4 ? '2px solid var(--primary)' : '2px dashed var(--border)',
          borderRadius: 'var(--radius-card)',
          opacity: step >= 4 || step === 0 ? 1 : 0.4,
          transition: isReducedMotion ? 'none' : 'all 0.4s ease',
          position: 'relative', zIndex: 2
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>Live Re-ranking List</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', height: '190px' }}>
            {scoredSamples.map((s, idx) => (
              <div 
                key={s.name}
                style={{
                  position: 'absolute',
                  top: `${idx * 60}px`,
                  left: 0, right: 0,
                  padding: '12px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: isReducedMotion ? 'none' : 'top 0.4s ease-in-out',
                  zIndex: 3 - idx
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                  <span className="text-secondary">Score: </span>
                  <span className="badge badge-sky" style={{ minWidth: '60px', textAlign: 'center' }}>
                    {s.finalScore.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600 }}>
            <span style={{ color: '#3b82f6' }}>Text (α): {(alpha * 100).toFixed(0)}%</span>
            <span style={{ color: '#ec4899' }}>Prox (β): {(beta * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={alpha * 100} 
            onChange={(e) => setAlpha(parseInt(e.target.value) / 100)}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
            disabled={isPlaying}
            aria-label="Adjust composite ranking weights"
          />
        </div>
        
        <button 
          className="btn btn-primary btn-sm" 
          onClick={playWalkthrough} 
          disabled={isPlaying}
          aria-label="Play step-by-step walkthrough"
        >
          {isPlaying ? <FiRefreshCw className="spin" /> : <FiPlay />} 
          {isPlaying ? 'Running...' : 'Step-by-step Walkthrough'}
        </button>
      </div>
    </div>
  );
};

export default CompositeRankingMerge;
