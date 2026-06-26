import React, { useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';

function HeldEdits() {
  const { heldEdits, approveHeldEdit, rejectHeldEdit, registry } = useAdminData();
  const [expandedItems, setExpandedItems] = useState(new Set());
  
  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const getDiff = (proposed, businessId) => {
    const current = registry.find(r => r.raw.id === businessId)?.raw;
    if (!current) return proposed;

    const diff = {};
    for (const key in proposed) {
      if (['id', 'history', 'stats', 'flagCount', 'flagReasons', 'originalIndex'].includes(key)) continue;
      
      const newVal = proposed[key];
      const oldVal = current[key];
      
      if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        diff[key] = { from: oldVal, to: newVal };
      }
    }
    
    if (Object.keys(diff).length === 0) return { _status: "No fields modified" };
    return diff;
  };

  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Review profile edits held automatically by the rate limiter due to suspicious IP activity.</p>
      
      <div className="glass-card" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Profile Name</th>
              <th>IP Address</th>
              <th>Timestamp</th>
              <th>Specific Changes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {heldEdits.map(item => {
              const isExpanded = expandedItems.has(item.id);
              const diff = getDiff(item.proposed_data, item.business_id);
              
              return (
                <tr key={item.id}>
                  <td className="font-semibold">{item.business_name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{item.ip_address}</td>
                  <td className="text-secondary">{new Date(item.timestamp).toLocaleString()}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {isExpanded ? (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          background: 'var(--bg-hover)', 
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {diff._status ? (
                            <span style={{ color: 'var(--text-muted)' }}>{diff._status}</span>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-primary)' }}>
                              {Object.entries(diff).map(([key, vals]) => {
                                const formatVal = (v) => typeof v === 'object' ? JSON.stringify(v) : String(v || 'empty');
                                return (
                                  <li key={key} style={{ marginBottom: '8px' }}>
                                    <strong style={{ textTransform: 'capitalize' }}>{key}</strong><br/>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--danger)', fontSize: '0.75rem' }}>{formatVal(vals.from)}</span>
                                    <br/>
                                    <span style={{ color: 'var(--success)', fontWeight: 500, fontSize: '0.75rem' }}>&rarr; {formatVal(vals.to)}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          <button 
                            onClick={() => toggleExpand(item.id)} 
                            style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                          >
                            Hide Review
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => toggleExpand(item.id)} 
                          className="btn"
                          style={{ 
                            padding: '0.25rem 0.75rem', 
                            fontSize: 'var(--font-size-sm)', 
                            alignSelf: 'flex-start',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                        >
                          Review Changes
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                    <button onClick={() => approveHeldEdit(item.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: 'var(--font-size-sm)', marginRight: 'var(--spacing-4)', color: 'var(--success)', borderColor: 'var(--success)' }}>Approve</button>
                    <button onClick={() => rejectHeldEdit(item.id)} style={{ color: 'var(--danger)', background: 'none', fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', border: 'none' }}>Reject</button>
                  </td>
                </tr>
              );
            })}
            {heldEdits.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No held edits pending review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HeldEdits;
