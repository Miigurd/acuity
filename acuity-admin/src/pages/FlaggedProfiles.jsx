import React, { useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';

function FlaggedProfiles() {
  const { flagged, archiveFlaggedItem, investigateFlaggedItem, restrictFlaggedItem } = useAdminData();
  const [activeTab, setActiveTab] = useState('active');
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Filter active vs archived
  // We consider it "archived" if its flag_status is Archived OR (it has no active flags but has allFlags, meaning it was resolved)
  const isResolved = (item) => item.flag_status === 'Archived' || (item.flags === 0 && item.allFlags > 0);
  
  const activeItems = flagged.filter(item => !isResolved(item));
  const archivedItems = flagged.filter(item => isResolved(item));
  
  const displayItems = activeTab === 'active' ? activeItems : archivedItems;
  
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  
  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Manage business profiles flagged by the community for inaccuracies.</p>
      
      <div className="flex-wrap" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('active')}
          className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem' }}
        >
          Active ({activeItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('archived')}
          className={`btn ${activeTab === 'archived' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem 1rem' }}
        >
          Archived ({archivedItems.length})
        </button>
      </div>

      <div className="glass-card animate-float-in table-scroll" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Profile Name</th>
              <th>Flag Count</th>
              <th>Common Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No profiles found in this category.
                </td>
              </tr>
            ) : null}
            {displayItems.map(item => (
              <React.Fragment key={item.id}>
                <tr>
                  <td className="font-semibold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleRow(item.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.25rem' }}
                      >
                        {expandedRow === item.id ? '▼' : '▶'}
                      </button>
                      {item.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                    {activeTab === 'active' ? item.flags : `${item.flags} (Total: ${item.allFlags})`}
                  </td>
                  <td className="text-secondary">{item.reason || 'N/A'}</td>
                  <td>
                    <span className={`badge ${item.flag_status === 'Restricted' ? 'badge-danger' : item.flag_status === 'Archived' ? 'badge-success' : 'badge-warning'}`}>
                      {item.flag_status || 'Flagged'}
                    </span>
                  </td>
                  <td>
                    {activeTab === 'active' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {item.flag_status !== 'Investigating' && (
                          <button onClick={() => investigateFlaggedItem(item.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-sm)' }}>
                            Investigate
                          </button>
                        )}
                        <button onClick={() => restrictFlaggedItem(item.id)} style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          Restrict
                        </button>
                        <button onClick={() => archiveFlaggedItem(item.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-sm)' }}>
                          Archive
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedRow === item.id && (
                  <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <td colSpan="5" style={{ padding: '1rem' }}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Status History:</div>
                      {item.status_history && item.status_history.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: 'var(--font-size-sm)' }}>
                          {item.status_history.map((hist, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{new Date(hist.timestamp).toLocaleString()}</span> - 
                              Admin <strong>{hist.admin_id}</strong> changed status from <strong>{hist.previous_status || 'None'}</strong> to <strong>{hist.new_status}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>No status history available.</div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FlaggedProfiles;
