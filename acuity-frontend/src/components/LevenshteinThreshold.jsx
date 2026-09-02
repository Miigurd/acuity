import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

// Levenshtein token-sort ratio — threshold classification
// Visualizes what happens to a token-sort ratio score after it's computed — the threshold bands that decide VERIFIED / PENDING / UNVERIFIED.
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
    if (s < 60) return { label: 'UNVERIFIED', color: 'var(--danger, #dc2626)', icon: <FiXCircle />, band: 0 };
    if (s < 80) return { label: 'PENDING', color: 'var(--warning, #f59e0b)', icon: <FiClock />, band: 1 };
    return { label: 'VERIFIED', color: 'var(--success, #16a34a)', icon: <FiCheckCircle />, band: 2 };
  };

  const status = getStatus(score);

  return (
    <div className="card mt-4">
      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>
        Threshold Classification
      </h4>
      <p className="text-secondary text-sm mb-4">
        The continuous token-sort score is mapped to a discrete verification status using strict thresholds.
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
        <div style={{ fontWeight: 'bold', width: '50px', textAlign: 'right' }}>{score.toFixed(0)}%</div>
      </div>

      {/* Threshold Scale Visualization */}
      <div style={{ position: 'relative', height: '60px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', overflow: 'hidden', display: 'flex' }}>
        
        {/* Unverified Band (0-59) */}
        <div style={{ 
          width: '60%', height: '100%', 
          background: status.band 
  === 0 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.05)',
          borderRight: '2px dashed var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: isReducedMotion ? 'none' : 'background 0.3s ease'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger, #dc2626)' }}>UNVERIFIED (&lt;60)</span>
        </div>

        {/* Pending Band (60-79) */}
        <div style={{ 
          width: '20%', height: '100%', 
          background: status.band === 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.05)',
          borderRight: '2px dashed var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: isReducedMotion ? 'none' : 'background 0.3s ease'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning, #f59e0b)' }}>PENDING (60-79)</span>
        </div>

        {/* Verified Band (80-100) */}
        <div style={{ 
          width: '20%', height: '100%', 
          background: status.band === 2 ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.05)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: isReducedMotion ? 'none' : 'background 0.3s ease'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success, #16a34a)' }}>VERIFIED (∷80)</span>
        </div>

        {/* Animated Marker */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: `${score}%`,
          transform: 'translateX(-50%)',
          height: '100%',
          width: '4px',
          background: status.color,
          boxShadow: '0 0 8px ' + status.color,
          transition: isReducedMotion ? 'none' : 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s',
          zIndex: 10
        }}>
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `8px solid ${status.color}`,
            transition: isReducedMotion ? 'none' : 'border-top-color 0.3s'
          }} />
        </div>
      </div>

      <div className="flex justify-center items-center mt-4 p-2" style={{ gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: status.color, transition: isReducedMotion ? 'none' : 'color 0.3s' }}>
        {status.icon} <span>FINAL STATUS: {status.label}</span>
      </div>
    </div>
  );
};

export default LevenshteinThreshold;