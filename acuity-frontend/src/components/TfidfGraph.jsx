import React, { useState } from 'react';
import GraphNodeTooltip from './GraphNodeTooltip';

const NODE_INFO = {
  query: { title: "Search Query", desc: "The raw text input provided by the user in the search bar." },
  doc: { title: "Document Profile", desc: "The combined text representation of a business, including its name, tags, and description." },
  vector: { title: "TF-IDF Vector Space", desc: "Transforms text into mathematical vectors by evaluating Term Frequency (how often a word appears) and Inverse Document Frequency (how unique the word is across all businesses)." },
  angle: { title: "Cosine Angle (θ)", desc: "The geometric angle between the Query vector and the Document vector in multi-dimensional space." },
  similarity: { title: "Cosine Similarity", desc: "The cosine of the angle between the two vectors, representing how contextually relevant the document is to the query (1.0 = perfect match)." }
};

const TfidfGraph = ({ query = '', document = '', angle = 0, similarity = 0 }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const color = '#3b82f6'; // Blue
  
  const truncate = (str, len) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div className="mt-4">
      <div style={{ position: 'relative', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-card)', padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 420 600" style={{ width: '100%', maxWidth: '420px', height: 'auto', overflow: 'visible' }}>
          <defs>
            <marker id="arrow-active-tfidf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 1L8 5L1 9" fill="none" stroke={color} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
            </marker>
          </defs>

          {/* Paths */}
          <path id="path-tfidf-1" d="M126,78 L178,135" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-tfidf)" />
          <path id="path-tfidf-2" d="M294,78 L242,135" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-tfidf)" />
          <path id="path-tfidf-3" d="M210,212 L210,236" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-tfidf)" />
          <path id="path-tfidf-4" d="M210,338 L210,366" fill="none" stroke={color} strokeWidth="3" markerEnd="url(#arrow-active-tfidf)" />

          {/* Animations */}
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M126,78 L178,135" /></circle>
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M294,78 L242,135" /></circle>
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M210,212 L210,236" /></circle>
          <circle r="4" fill={color}><animateMotion dur="1s" repeatCount="indefinite" path="M210,338 L210,366" /></circle>

          {/* Node 1: Query */}
          <g onClick={() => setSelectedNode('query')} style={{ cursor: 'pointer' }}>
            <circle cx="100" cy="50" r="38" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="100" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Query</text>
            <text x="100" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">{truncate(query, 12)}</text>
          </g>

          {/* Node 2: Document */}
          <g onClick={() => setSelectedNode('doc')} style={{ cursor: 'pointer' }}>
            <circle cx="320" cy="50" r="38" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="320" y="47" textAnchor="middle" fill="var(--text-main)" fontSize="10" fontWeight="bold">Doc</text>
            <text x="320" y="62" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">{truncate(document, 12)}</text>
          </g>

          {/* Node 3: Vectorize */}
          <g onClick={() => setSelectedNode('vector')} style={{ cursor: 'pointer' }}>
            <circle cx="210" cy="170" r="42" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="210" y="165" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Vector Space</text>
            <text x="210" y="185" textAnchor="middle" fill={color} fontSize="13" fontWeight="800">TF-IDF</text>
          </g>

          {/* Node 4: Angle */}
          <g onClick={() => setSelectedNode('angle')} style={{ cursor: 'pointer' }}>
            <circle cx="210" cy="290" r="48" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="210" y="280" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">Angle &theta;</text>
            <text x="210" y="302" textAnchor="middle" fill={color} fontSize="16" fontWeight="800">{(angle || 0).toFixed(1)}&deg;</text>
          </g>

          {/* Node 5: Output */}
          <g onClick={() => setSelectedNode('similarity')} style={{ cursor: 'pointer' }}>
            <circle cx="210" cy="410" r="38" fill="var(--bg-base)" stroke={color} strokeWidth="2" />
            <text x="210" y="407" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">Cosine</text>
            <text x="210" y="422" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">{((similarity || 0) * 100).toFixed(1)}%</text>
          </g>

          {/* Formula Panel */}
          <foreignObject x="20" y="470" width="380" height="120">
            <div style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Algorithm Substitution (Q=Query, D=Doc)</div>
              <div style={{ fontFamily: 'monospace' }}>
                Cosine Sim = (Q &middot; D) / (||Q|| &middot; ||D||)<br/>
                cos({(angle || 0).toFixed(1)}&deg;) = {(similarity || 0).toFixed(3)}
              </div>
            </div>
          </foreignObject>
        </svg>
        <GraphNodeTooltip info={NODE_INFO[selectedNode]} onClose={() => setSelectedNode(null)} />
      </div>
    </div>
  );
};

export default TfidfGraph;
