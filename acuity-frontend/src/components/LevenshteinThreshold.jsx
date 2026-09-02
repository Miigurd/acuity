import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

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
    if (s < 60) return { label: 'Unverified', color: 'var(--danger, #dc2626)', band: 0 };
    if (s < 80) return { label: 'Pending', color: 'var(--warning, #f59e0b)', band: 1 };
    return { label: 'Verified', color: 'var(--success, #16a34a)', band: 2 };
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

      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 420 320" style={{ width: '100%', maxWidth: '420px', height: 'auto', overflow: 'visible' }}>
          <defs>
            <marker id="arrow-active-0" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--danger, #dc2626)" strokeWidth="2"/>
            </marker>
            <marker id="arrow-active-1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--warning, #f59e0b)" strokeWidth="2"/>
            </marker>
            <marker id="arrow-active-2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--success, #16a34a)" strokeWidth="2"/>
            </marker>
            <marker id="arrow-inactive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--border)" strokeWidth="1.5"/>
            </marker>
          </defs>

          {/* EDGES */}
          <path id="edge-unverified" d="M210,90 C160,150 120,190 90,212"
                stroke={status.band === 0 ? 'var(--danger, #dc2626)' : 'var(--border)'}
                strokeWidth={status.band === 0 ? "3" : "1.5"}
                opacity={status.band === 0 ? 1 : 0.4}
                markerEnd={status.band === 0 ? "url(#arrow-active-0)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />
                
          <path id="edge-pending" d="M210,90 L210,212"
                stroke={status.band === 1 ? 'var(--warning, #f59e0b)' : 'var(--border)'}
                strokeWidth={status.band === 1 ? "3" : "1.5"}
                opacity={status.band === 1 ? 1 : 0.4}
                markerEnd={status.band === 1 ? "url(#arrow-active-1)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />
                
          <path id="edge-verified" d="M210,90 C260,150 300,190 330,212"
                stroke={status.band === 2 ? 'var(--success, #16a34a)' : 'var(--border)'}
                strokeWidth={status.band === 2 ? "3" : "1.5"}
                opacity={status.band === 2 ? 1 : 0.4}
                markerEnd={status.band === 2 ? "url(#arrow-active-2)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />

          {/* ACTIVE-EDGE FLOW INDICATOR */}
          {!isReducedMotion && status.band === 0 && (
            <circle r="4" fill="var(--danger, #dc2626)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M210,90 C160,150 120,190 90,212" />
            </circle>
          )}
          {!isReducedMotion && status.band === 1 && (
            <circle r="4" fill="var(--warning, #f59e0b)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M210,90 L210,212" />
            </circle>
          )}
          {!isReducedMotion && status.band === 2 && (
            <circle r="4" fill="var(--success, #16a34a)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M210,90 C260,150 300,190 330,212" />
            </circle>
          )}

          {/* SOURCE NODE */}
          <circle cx="210" cy="70" r="42" fill="var(--bg-card)" stroke={status.color} strokeWidth="3" style={{ transition: 'stroke 0.4s' }} />
          <text x="210" y="65" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">Score</text>
          <text x="210" y="85" textAnchor="middle" fill={status.color} fontSize="18" fontWeight="800" style={{ transition: 'fill 0.4s' }}>{score.toFixed(0)}%</text>

          {/* DESTINATION NODES */}
          <g style={{ opacity: status.band === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="90" cy="250" r="38" fill={status.band === 0 ? 'rgba(220, 38, 38, 0.15)' : 'var(--bg-card)'} stroke={status.band === 0 ? 'var(--danger, #dc2626)' : 'var(--border)'} strokeWidth="2" />
            <text x="90" y="255" textAnchor="middle" fill="var(--danger, #dc2626)" fontSize="12" fontWeight="bold">Unverified</text>
            <text x="90" y="270" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">&lt;60</text>
          </g>

          <g style={{ opacity: status.band === 1 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="210" cy="250" r="38" fill={status.band === 1 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)'} stroke={status.band === 1 ? 'var(--warning, #f59e0b)' : 'var(--border)'} strokeWidth="2" />
            <text x="210" y="255" textAnchor="middle" fill="var(--warning, #f59e0b)" fontSize="12" fontWeight="bold">Pending</text>
            <text x="210" y="270" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">60-79</text>
          </g>

          <g style={{ opacity: status.band === 2 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="330" cy="250" r="38" fill={status.band === 2 ? 'rgba(22, 163, 74, 0.15)' : 'var(--bg-card)'} stroke={status.band === 2 ? 'var(--success, #16a34a)' : 'var(--border)'} strokeWidth="2" />
            <text x="330" y="255" textAnchor="middle" fill="var(--success, #16a34a)" fontSize="12" fontWeight="bold">Verified</text>
            <text x="330" y="270" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">&gt;=80</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LevenshteinThreshold;
