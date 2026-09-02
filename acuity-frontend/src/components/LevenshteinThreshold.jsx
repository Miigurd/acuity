import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

const LevenshteinThreshold = ({ currentScore, stringA = 'Kuya Jun Vulcanizing', stringB = 'Kuya Juns Vulcanizing Shop', edits = 6 }) => {
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

  const truncate = (str, len) => str.length > len ? str.substring(0, len) + '...' : str;

  return (
    <div className="card mt-4">
      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>
        End-to-End Classification Flow
      </h4>
      <p className="text-secondary text-sm mb-4">
        Follow the journey from raw input strings, through edit distance computation, to a continuous match score, and finally a discrete verification status.
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
        <svg viewBox="0 0 420 480" style={{ width: '100%', maxWidth: '420px', height: 'auto', overflow: 'visible' }}>
          <defs>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke={status.color} strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
            </marker>
            <marker id="arrow-inactive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke="var(--border)" strokeWidth="1.5"/>
            </marker>
          </defs>

          {/* EDGES */}
          {/* Input A to Edit */}
          <path id="path-a-edit" d="M126,78 L178,135" fill="none" stroke={status.color} strokeWidth="3" markerEnd="url(#arrow-active)" style={{ transition: 'stroke 0.4s' }} />
          {/* Input B to Edit */}
          <path id="path-b-edit" d="M294,78 L242,135" fill="none" stroke={status.color} strokeWidth="3" markerEnd="url(#arrow-active)" style={{ transition: 'stroke 0.4s' }} />
          {/* Edit to Score */}
          <path id="path-edit-score" d="M210,212 L210,236" fill="none" stroke={status.color} strokeWidth="3" markerEnd="url(#arrow-active)" style={{ transition: 'stroke 0.4s' }} />
          
          {/* Score to Unverified */}
          <path id="path-score-unv" d="M176,324 L121,379"
                stroke={status.band === 0 ? 'var(--danger, #dc2626)' : 'var(--border)'}
                strokeWidth={status.band === 0 ? "3" : "1.5"}
                opacity={status.band === 0 ? 1 : 0.4}
                markerEnd={status.band === 0 ? "url(#arrow-active)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />
                
          {/* Score to Pending */}
          <path id="path-score-pen" d="M210,338 L210,366"
                stroke={status.band === 1 ? 'var(--warning, #f59e0b)' : 'var(--border)'}
                strokeWidth={status.band === 1 ? "3" : "1.5"}
                opacity={status.band === 1 ? 1 : 0.4}
                markerEnd={status.band === 1 ? "url(#arrow-active)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />
                
          {/* Score to Verified */}
          <path id="path-score-ver" d="M244,324 L299,379"
                stroke={status.band === 2 ? 'var(--success, #16a34a)' : 'var(--border)'}
                strokeWidth={status.band === 2 ? "3" : "1.5"}
                opacity={status.band === 2 ? 1 : 0.4}
                markerEnd={status.band === 2 ? "url(#arrow-active)" : "url(#arrow-inactive)"}
                fill="none" style={{ transition: 'stroke 0.4s, opacity 0.4s, stroke-width 0.4s' }} />

          {/* ACTIVE-EDGE FLOW INDICATORS */}
          {!isReducedMotion && (
            <>
              <circle r="4" fill={status.color} style={{ transition: 'fill 0.4s' }}>
                <animateMotion dur="1s" repeatCount="indefinite" path="M126,78 L178,135" />
              </circle>
              <circle r="4" fill={status.color} style={{ transition: 'fill 0.4s' }}>
                <animateMotion dur="1s" repeatCount="indefinite" path="M294,78 L242,135" />
              </circle>
              <circle r="4" fill={status.color} style={{ transition: 'fill 0.4s' }}>
                <animateMotion dur="1s" repeatCount="indefinite" path="M210,212 L210,236" />
              </circle>
            </>
          )}

          {!isReducedMotion && status.band === 0 && (
            <circle r="4" fill="var(--danger, #dc2626)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M176,324 L121,379" />
            </circle>
          )}
          {!isReducedMotion && status.band === 1 && (
            <circle r="4" fill="var(--warning, #f59e0b)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M210,338 L210,366" />
            </circle>
          )}
          {!isReducedMotion && status.band === 2 && (
            <circle r="4" fill="var(--success, #16a34a)">
              <animateMotion dur="1s" repeatCount="indefinite" path="M244,324 L299,379" />
            </circle>
          )}

          {/* NODES */}
          {/* Input A */}
          <circle cx="100" cy="50" r="38" fill="var(--bg-base)" stroke={status.color} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
          <text x="100" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Input A</text>
          <text x="100" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">
            <title>{stringA}</title>
            {truncate(stringA, 12)}
          </text>

          {/* Input B */}
          <circle cx="320" cy="50" r="38" fill="var(--bg-base)" stroke={status.color} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
          <text x="320" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Input B</text>
          <text x="320" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">
            <title>{stringB}</title>
            {truncate(stringB, 12)}
          </text>

          {/* Compute Edit Distance */}
          <circle cx="210" cy="170" r="42" fill="var(--bg-surface)" stroke={status.color} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
          <text x="210" y="185" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Edit Dist.</text>
          <text x="210" y="185" textAnchor="middle" fill="var(--text-secondary)" fontSize="13" fontWeight="800">{edits} edits</text>

          {/* Score Node */}
          <circle cx="210" cy="290" r="48" fill="var(--bg-elevated)" stroke={status.color} strokeWidth="3" style={{ transition: 'stroke 0.4s' }} />
          <text x="210" y="280" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">Match Score</text>
          <text x="210" y="302" textAnchor="middle" fill={status.color} fontSize="16" fontWeight="800" style={{ transition: 'fill 0.4s' }}>{score.toFixed(0)}%</text>

          {/* DESTINATION NODES */}
          <g style={{ opacity: status.band === 0 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="90" cy="410" r="38" fill={status.band === 0 ? 'rgba(220, 38, 38, 0.15)' : 'var(--bg-base)'} stroke={status.band === 0 ? 'var(--danger, #dc2626)' : 'var(--border)'} strokeWidth="2" />
            <text x="90" y="407" textAnchor="middle" fill="var(--danger, #dc2626)" fontSize="11" fontWeight="bold">Unverified</text>
            <text x="90" y="422" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">&lt;60</text>
          </g>

          <g style={{ opacity: status.band === 1 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="210" cy="410" r="38" fill={status.band === 1 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-base)'} stroke={status.band === 1 ? 'var(--warning, #f59e0b)' : 'var(--border)'} strokeWidth="2" />
            <text x="210" y="407" textAnchor="middle" fill="var(--warning, #f59e0b)" fontSize="11" fontWeight="bold">Pending</text>
            <text x="210" y="422" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">60-79</text>
          </g>

          <g style={{ opacity: status.band === 2 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
            <circle cx="330" cy="410" r="38" fill={status.band === 2 ? 'rgba(22, 163, 74, 0.15)' : 'var(--bg-base)'} stroke={status.band === 2 ? 'var(--success, #16a34a)' : 'var(--border)'} strokeWidth="2" />
            <text x="330" y="407" textAnchor="middle" fill="var(--success, #16a34a)" fontSize="11" fontWeight="bold">Verified</text>
            <text x="330" y="422" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">&gt;=80</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LevenshteinThreshold;

