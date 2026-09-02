
import React, { useState, useEffect } from 'react';
import { FiPlay, FiRefreshCw, FiArrowDown } from 'react-icons/fi';

// Composite ranking / Algorithm - weighted merge
// Visualizes how the composite score is a merge point between the cosine similarity output and the Haversine distance output.
const CompositeRankingMerge = () => {
  const [alpha, setAlpha] = useState(0.6);
  const [step, setStep] = useState(0); // 0: initial, 1: text score, 2: dist score, 3: merge, 4: output
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = () => setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const beta = 1.0 - alpha; // Constrained weights

  // For visualization, use 3 samples
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
    setTimeout(() => setStep(1), 800);
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 3200);
    setTimeout(() => setStep(4), 4500);
    setTimeout(() => setIsPlaying(false), 5800);
  };

  return (
    <div className="card mt-6">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
        Algorithm Integration: Weighted Merge Graph
      </h3>
      <p className="text-secondary text-sm mb-4">
        The composite ranking is not a standalone algorithm, but a merge point combining NLP relevance and geographic proximity. Adjust the weights (α + β = 1) to see how shifting priority changes the final ranking.
      </p>

      {/* Flow Diagram */}
      <div style={{ padding: '24px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>

          {/* Cosine Node */}
          <div style={{
            width: '40%', padding: '16px', background: step >= 1 ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
            border: step >= 1 ? '2px solid #3b82f6' : '2px dashed var(--border)',
            borderRadius: 'var(--radius-card)', textAlign: 'center',
            opacity: step >= 1 ? 1 : 0.4,
            transition: isReducedMotion ? 'none' : 'border 0.3s, box-shadow 0.3s, background 0.3s, opacity 0.3s',
            boxShadow: step >= 1 ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'none',
            zIndex: 2
          }}>
            <h4 style={{ color: '#3b82f6', fontWeight: 800, marginBottom: '4px', fontSize: '0.9rem' }}>Cosine Similarity</h4>
            <div className="text-xs text-secondary">Text Relevance (NLP)</div>
            <div style={{ marginTop: '8px', fontWeight: 700, fontSize: '1.2rem' }}>
              Weight (α): {(alpha * 100).toFixed(0)}%
            </div>
          </div>

          {/* Haversine Node */}
          <div style={{
            width: '40%', padding: '16px', background: step >= 2 ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-card)',
            border: step >= 2 ? '2px solid #ec4899' : '2px dashed var(--border)',
            borderRadius: 'var(--radius-card)', textAlign: 'center',
            opacity: step >= 2 ? 1 : 0.4,
            transition: isReducedMotion ? 'none' : 'border 0.3s, box-shadow 0.3s, background 0.3s, opacity 0.3s',
            boxShadow: step >= 2 ? '0 0 15px rgba(236, 72, 153, 0.3)' : 'none',
            zIndex: 2
          }}>
            <h4 style={{ color: '#ec4899', fontWeight: 800, marginBottom: '4px', fontSize: '0.9rem' }}>Haversine Distance</h4>
            <div className="text-xs text-secondary">Geographic Proximity</div>
            <div style={{ marginTop: '8px', fontWeight: 700, fontSize: '1.2rem' }}>
              Weight (β): {(beta * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Animated Arrows Container (Rows 1-2) */}
        <div style={{ position: 'absolute', top: '112px', left: '0', right: '0', height: '60px', pointerEvents: 'none' }}>
           <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
             {/* Left Arrow Path */}
             <path d="M 25% 0 C 25% 40, 50% 40, 50% 60" fill="none" stroke={step >= 3 ? '#3b82f6' : 'var(--border)'} strokeWidth="3" strokeDasharray={step >= 3 && !isReducedMotion ? "8,8" : "none"} strokeLinecap="round">
               {step >= 3 && !isReducedMotion && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />}
             </path>
             {/* Right Arrow Path */}
             <path d="M 75% 0 C 75% 40, 50% 40, 50% 60" fill="none" stroke={step >= 3 ? '#ec4899' : 'var(--border)'} strokeWidth="3" strokeDasharray={step >= 3 && !isReducedMotion ? "8,8" : "none"} strokeLinecap="round">
               {step >= 3 && !isReducedMotion && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />}
             </path>
           </svg>
        </div>

        {/* Composite Node */}
        <div style={{ 
          width: '55%', margin: '0 auto 40px auto', padding: '16px', 
          background: step >= 3 ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(236, 72, 153, 0.15))' : 'var(--bg-card)', 
          border: step >= 3 ? '2px solid var(--primary)' : '2px dashed var(--border)',
          borderRadius: 'var(--radius-card)', textAlign: 'center',
          opacity: step >= 3 ? 1 : 0.4,
          transition: isReducedMotion ? 'none' : 'all 0.4s ease',
          boxShadow: step >= 3 ? '0 0 20px rgba(99, 102, 241, 0.2)' : 'none',
          position: 'relative', zIndex: 2
        }}>
          <h4 style={{ color: 'var(--primary)', fontWeight: 800, marginBottom: '4px' }}>Composite Score</h4>
          <code className="text-xs text-secondary" style={{ background: 'transparent' }}>(Text × α) + (Prox × β)</code>
        </div>

        {/* Animated Arrows Container (Rows 2-3) */}
        <div style={{ position: 'absolute', top: '268px', left: '0', right: '0', height: '40px', pointerEvents: 'none' }}>
           <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
             <path d="M 50% 0 L 50% 100%" fill="none" stroke={step >= 4 ? 'var(--primary)' : 'var(--border)'} strokeWidth="3" strokeDasharray={step >= 4 && !isReducedMotion ? "8,8" : "none"} strokeLinecap="round">
               {step >= 4 && !isReducedMotion && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />}
             </path>
           </svg>
        </div>

        {/* Ranking Output Node */}
        <div style={{
          width: '100%', margin: '0 auto', padding: '16px',
          background: step >= 4 ? 'var(--bg-elevated)' : 'var(--bg-card)',
          border: step >= 4 ? '2px solid var(--primary)' : '2px dashed var(--border)',
          borderRadius: 'var(--radius-card)',
          opacity: step >= 4 ? 1 : 0.4,
          transition: isReducedMotion ? 'none' : 'all 0.4s ease',
          position: 'relative', zIndex: 2
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>Live Re-ranking Example</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', height: '190px' }}>
            {scoredSamples.map((s, idx) => (
              <div 
                key={s.name}
                style={{
                  position: 'absolute',
                  top: `${idx * 60}px`,
                  left: 0, right: 0,
                  padding: '12px 16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: isReducedMotion ? 'none' : 'top 0.4s ease-in-out, box-shadow 0.2s',
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
                  <span className="text-secondary">Text: {s.textScore.toFixed(2)}</span>
                  <span className="text-secondary">Prox: {s.distScore.toFixed(2)}</span>
                  <span className="badge badge-sky" style={{ minWidth: '80px', textAlign: 'center' }}>
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
