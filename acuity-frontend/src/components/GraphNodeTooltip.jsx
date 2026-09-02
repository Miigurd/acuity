import React from 'react';

const GraphNodeTooltip = ({ info, onClose }) => {
  if (!info) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(3px)', borderRadius: 'var(--radius-card)', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <div className="shadow-xl" style={{ maxWidth: '300px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ position: 'absolute', top: '8px', right: '12px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
          aria-label="Close"
        >&times;</button>
        <h4 style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)', fontSize: '1rem', paddingRight: '16px' }}>{info.title}</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {info.desc}
        </p>
      </div>
    </div>
  );
};

export default GraphNodeTooltip;
