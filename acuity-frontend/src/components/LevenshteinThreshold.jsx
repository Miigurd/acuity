
import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

// Levenshtein token-sort ratio - threshold classification
// Visualizes how the continuous score is routed to a threshold boundary.
const LevenshteinThreshold = ({ currentScore }) => {
  const [score, setScore] = useState(currentScore || 85);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (currentScore !== undefined && currentScore !== null && !isNaN(currentScore)) {
      setScore(currentScore * 100);
    }
  }, [currentScore]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = () => setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const getStatus = (s) => {
    if (s < 60) return { label: 'UNVERIFIED (<60)', color: 'var(--danger, #dc2626)', icon: <FiXCircle />, band: 0 };
    if (s < 80) return { label: 'PENDING (60-79)', color: 'var(--warning, #f59e0b)', icon: <FiClock />, band: 1 };
    return { label: 'VERIFIED (>=80)', color: 'var(--success, #16a34a)', icon: <FiCheckCircle />, band: 2 };
  };

  const status = getStatus(score);

  return (
    <div className="card mt-4">
      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>
        Threshold Classification Flow
      </h4>
      <p className="text-secondary text-sm mb-4">
        The continuous token-sort score is routed to a discrete verification status using strict thresholds.
      </p>

      {/* Interactive Slider */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label htmlFor="scoreSlider" style={{ fontWeight: 600, minWidth: '100px' }}>Adjust Score:</label>
        <input
          id="scoreSlider"
          type="range"
          min="0"
          max="100"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          style={{ flexGrow: 1, accentColor: status.color }}
          aria-label="Adjust Levenshtein score"
        />
      </div>

      {/* Flow Diagram */}
      <div style={{ padding: '24px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', position: 'relative' }}>
        
        {/* Source Node */}
        <div style={{
          margin: '0 auto 50px auto',
          width: '200px',
          padding: '12px',
          background: 'var(--bg-card)',
          border: `2px solid ${status.color}`,
          borderRadius: 'var(--radius-card)',
          textAlign: 'center',
          zIndex: 2,
          position: 'relative',
          boxShadow: `0 0 10px ${status.color}44`,
          transition: isReducedMotion ? 'none' : 'all 0.4s ease'
        }}>
          <h4 style={{ fontWeight: 800, marginBottom: '4px', fontSize: '0.9rem' }}>Match Score</h4>
          <div style={{
            fontWeight: 800, fontSize: '1.4rem', color: status.color,
            transition: isReducedMotion ? 'none' : 'color 0.4s ease'
          }}>
            {score.toFixed(0)}%
          </div>
        </div>

        {/* Animated Edges */}
        <div style={{ position: 'absolute', top: '70px', left: '0', right: '0', height: '50px', pointerEvents: 'none' }}>
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Edge to Unverified (Left) */}
            <path d="M 50% 0 C 50% 40, 16.6% 40, 16.6% 60" fill="none" 
              stroke={status.band === 0 ? 'var(--danger, #dc2626)' : 'var(--border)'} 
              strokeWidth="3" 
              strokeDasharray={status.band === 0 && !isReducedMotion ? "8,8" : "none"} 
              strokeLinecap="round"
              style={{ transition: 'stroke 0.4s ease' }}>
              {status.band === 0 && !isReducedMotion && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />}
            </path>
            
            {/* Edge to Pending (Center) */}
            <path d="M 50% 0 L 50% 60" fill="none" 
              stroke={status.band === 1 ? 'var(--warning, #f59e0b)' : 'var(--border)'} 
              strokeWidth="3" 
              strokeDasharray={status.band === 1 && !isReducedMotion ? "8,8" : "none"} 
              strokeLinecap="round"
              style={{ transition: 'stroke 0.4s ease' }}>
              {status.band === 1 && !isReducedMotion && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />}
            </path>

            {/* Edge to Verified (Right) */}
            <path d="M 50% 0 C 50% 40, 83.4% 40, 83.4% 60" fill="none" 
              stroke={status.band === 2 ? 'var(--success, #16a34a)' : 'var(--border)'} 
              strokeWidth="3" 
              strokeDasharray={status.band === 2 && !isReducedMotion ? "8,8" : "none"} 
              strokeLinecap="round"
              style={{ transition: 'stroke 0.4s ease' }}>
              {status.band === 2 && !isReducedMotion && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />}
            </path>
          </svg>
        </div>

        {/* Destination Nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', position: 'relative', zIndex: 2 }}>
          {/* Unverified */}
          <div style={{ 
            flex: 1, padding: '10px',
            background: status.band === 0 ? 'rgba(220, 38, 38, 0.15)' : 'var(--bg-card)',
            border: status.band === 0 ? '2px solid var(--danger, #dc2626)' : '2px dashed var(--border)',
            borderRadius: 'var(--radius-card)',
            textAlign: 'center',
            opacity: status.band === 0 ? 1 : 0.4,
            boxShadow: status.band === 0 ? '0 0 15px rgba(220, 38, 38, 0.3)' : 'none',
            transition: isReducedMotion ? 'none' : 'all 0.4s ease'
          }}>
            <div style={{ color: 'var(--danger, #dc2626)', fontSize: '1.2rem', marginBottom: '4px' }}><FiXCircle /></div>
            <div style={{ color: 'var(--danger, #dc2626)', fontWeight: 800, fontSize: '0.85rem' }}>UNVERIFIED</div>
            <div className="text-xs text-secondary">(&lt;60)</div>
          </div>

          {/* Pending */}
          <div style={{ 
            flex: 1, padding: '10px',
            background: status.band === 1 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
            border: status.band === 1 ? '2px solid var(--warning, #f59e0b)' : '2px dashed var(--border)',
            borderRadius: 'var(--radius-card)',
            textAlign: 'center',
            opacity: status.band === 1 ? 1 : 0.4,
            boxShadow: status.band === 1 ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none',
            transition: isReducedMotion ? 'none' : 'all 0.4s ease'
          }}>
            <div style={{ color: 'var(--warning, #f59e0b)', fontSize: '1.2rem', marginBottom: '4px' }}><FiClock /></div>
            <div style={{ color: 'var(--warning, #f59e0b)', fontWeight: 800, fontSize: '0.85rem' }}>PENDING</div>
            <div className="text-xs text-secondary">(60-79)</div>
          </div>

          {/* Verified */}
          <div style={{ 
            flex: 1, padding: '10px',
            background: status.band === 2 ? 'rgba(22, 163, 74, 0.15)' : 'var(--bg-card)',
            border: status.band === 2 ? '2px solid var(--success, #16a34a)' : '2px dashed var(--border)',
            borderRadius: 'var(--radius-card)',
            textAlign: 'center',
            opacity: status.band === 2 ? 1 : 0.4,
            boxShadow: status.band === 2 ? '0 0 15px rgba(22, 163, 74, 0.3)' : 'none',
            transition: isReducedMotion ? 'none' : 'all 0.4s ease'
          }}>
            <div style={{ color: 'var(--success, #16a34a)', fontSize: '1.2rem', marginBottom: '4px' }}><FiCheckCircle /></div>
            <div style={{ color: 'var(--success, #16a34a)', fontWeight: 800, fontSize: '0.85rem' }}>VERIFIED</div>
            <div className="text-xs text-secondary">(&gt;=80)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevenshteinThreshold;
