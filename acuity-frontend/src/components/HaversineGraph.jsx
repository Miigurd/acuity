import React, { useState } from 'react';
import GraphNodeTooltip from './GraphNodeTooltip';

const NODE_INFO = {
  locA: { title: "Resident Location", desc: "The geographic starting point or the current location of the resident searching for a service." },
  locB: { title: "Business Location", desc: "The registered geographic coordinates of the target business." },
  latlng: { title: "Coordinate Math", desc: "Extracts the exact Latitude and Longitude values and converts them to radians for spherical geometry calculations." },
  distance: { title: "Haversine Distance", desc: "The shortest over-the-earth (great-circle) distance between the two points in kilometers, accounting for the Earth's curvature." },
  proximity: { title: "Proximity Score", desc: "An inverse decay function (1 / (1 + distance)) that heavily favors nearby locations, converting raw kilometers into a 0-100% ranking weight." }
};

const HaversineGraph = ({ locA = '', locB = '', distance = 0, proximity = 0, aLat = 0, aLon = 0, bLat = 0, bLon = 0 }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const color = '#ec4899'; // Pink
  
  const truncate = (str, len) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div className="mt-4">
      <div style={{ position: 'relative', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 420 600" style={{ width: '100%', maxWidth: '420px', height: 'auto', overflow: 'visible' }}>
          <defs>
            <marker id="arrow-active-hav" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke={color} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
            </marker>
          </defs>

          {/* Paths */}
          <path id="path-hav-1" d="M126,78 L178,135" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-hav)" />
          <path id="path-hav-2" d="M294,78 L242,135" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-hav)" />
          <path id="path-hav-3" d="M210,212 L210,236" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-hav)" />
          <path id="path-hav-4" d="M210,338 L210,366" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-hav)" />

          {/* Animations */}
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M126,78 L178,135" /></circle>
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M294,78 L242,135" /></circle>
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M210,212 L210,236" /></circle>
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M210,338 L210,366" /></circle>

          {/* Node 1: Loc A */}
          <g onClick={() => setSelectedNode('locA')} style={{ cursor: 'pointer' }}>
            <circle cx="100" cy="50" r="38" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="100" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Loc A</text>
            <text x="100" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">{truncate(locA, 12)}</text>
          </g>

          {/* Node 2: Loc B */}
          <g onClick={() => setSelectedNode('locB')} style={{ cursor: 'pointer' }}>
            <circle cx="320" cy="50" r="38" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="320" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Loc B</text>
            <text x="320" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">{truncate(locB, 12)}</text>
          </g>

          {/* Node 3: Coordinate Math */}
          <g onClick={() => setSelectedNode('latlng')} style={{ cursor: 'pointer' }}>
            <circle cx="210" cy="170" r="42" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="210" y="165" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Lat/Lng</text>
            <text x="210" y="185" textAnchor="middle" fill={color} fontSize="13" fontWeight="800">Rad Math</text>
          </g>

          {/* Node 4: Distance */}
          <g onClick={() => setSelectedNode('distance')} style={{ cursor: 'pointer' }}>
            <circle cx="210" cy="290" r="48" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="210" y="280" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">Distance</text>
            <text x="210" y="302" textAnchor="middle" fill={color} fontSize="16" fontWeight="800">{(distance || 0).toFixed(2)}km</text>
          </g>

          {/* Node 5: Output */}
          <g onClick={() => setSelectedNode('proximity')} style={{ cursor: 'pointer' }}>
            <circle cx="210" cy="410" r="38" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="210" y="407" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Proximity</text>
            <text x="210" y="422" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">{((proximity || 0) * 100).toFixed(1)}%</text>
          </g>

          {/* Formula Panel */}
          <foreignObject x="20" y="470" width="380" height="120">
            <div style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Algorithm Substitution</div>
              <div style={{ fontFamily: 'monospace', letterSpacing: '-0.2px' }}>
                d = haversine({(aLat || 0).toFixed(3)}, {(aLon || 0).toFixed(3)}; {(bLat || 0).toFixed(3)}, {(bLon || 0).toFixed(3)}) = {(distance || 0).toFixed(2)}km<br/>
                Score = 1.0 / (1.0 + {(distance || 0).toFixed(2)}) = {(proximity || 0).toFixed(3)}
              </div>
            </div>
          </foreignObject>
        </svg>
        <GraphNodeTooltip info={NODE_INFO[selectedNode]} onClose={() => setSelectedNode(null)} />
      </div>
    </div>
  );
};

export default HaversineGraph;
