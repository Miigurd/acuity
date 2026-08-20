import React, { useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';

function FlaggedProfiles() {
  const { flagged, archiveFlaggedItem, investigateFlaggedItem, restrictFlaggedItem } = useAdminData();
  const [activeTab, setActiveTab] = useState('active');
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Active items have at least 1 active flag, or have a status of Investigating
  const activeItems = flagged
    .filter(item => item.flags > 0 || item.flag_status === 'Investigating')
    .map(item => ({ ...item, _uniqueId: `active-${item.id}` }));
  
  // Unstack archived items so each archival event is its own row
  const archivedItems = [];
  flagged.forEach(item => {
    if (item.status_history && item.status_history.length > 0) {
      const archiveEvents = item.status_history.filter(h => h.new_status.startsWith('Archived') || h.new_status.startsWith('Safe') || h.new_status.startsWith('Restricted'));
      if (archiveEvents.length > 0) {
        archiveEvents.forEach((evt, idx) => {
          let specificCount = item.allFlags;
          let specificReason = item.reason;
          let eventStatus = evt.new_status;
          if (evt.new_status.includes('|')) {
            const parts = evt.new_status.split('|');
            eventStatus = parts[0];
            specificCount = parseInt(parts[1]);
            if (parts.length > 2) {
              specificReason = parts[2];
            }
          }
          archivedItems.push({ 
            ...item, 
            flag_status: eventStatus,
            flags: specificCount, // display only the flags archived during this event
            reason: specificReason, // display the reason for these specific flags
            _uniqueId: `archived-${item.id}-${idx}`,
            archiveTimestamp: evt.timestamp
          });
        });
      } else if (item.allFlags > item.flags || item.flag_status === 'Archived') {
        archivedItems.push({ ...item, _uniqueId: `archived-legacy-${item.id}` });
      }
    } else if (item.allFlags > item.flags || item.flag_status === 'Archived') {
      archivedItems.push({ ...item, _uniqueId: `archived-legacy-${item.id}` });
    }
  });
  
  const displayItems = activeTab === 'active' ? activeItems : archivedItems;

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDisplayItems = [...displayItems].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === 'archiveTimestamp') {
      valA = new Date(valA).getTime() || 0;
      valB = new Date(valB).getTime() || 0;
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    }
    
    return sortConfig.direction === 'asc' 
      ? String(valA || '').localeCompare(String(valB || '')) 
      : String(valB || '').localeCompare(String(valA || ''));
  });

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
              <th onClick={() => handleSort('flag_status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Status {sortConfig.key === 'flag_status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              {activeTab === 'active' ? (
                <th>Actions</th>
              ) : (
                <th onClick={() => handleSort('archiveTimestamp')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Timestamp {sortConfig.key === 'archiveTimestamp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedDisplayItems.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No profiles found in this category.
                </td>
              </tr>
            ) : null}
            {sortedDisplayItems.map(item => (
              <React.Fragment key={item._uniqueId}>
                <tr>
                  <td className="font-semibold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleRow(item._uniqueId)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.25rem' }}
                      >
                        {expandedRow === item._uniqueId ? '▼' : '▶'}
                      </button>
                      {item.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                    {activeTab === 'active' ? item.flags : `${item.flags} (Total: ${item.allFlags})`}
                  </td>
                  <td className="text-secondary">{item.reason || 'N/A'}</td>
                  <td>
                    <span className={`badge ${item.flag_status === 'Restricted' ? 'badge-danger' : item.flag_status === 'Safe' || item.flag_status === 'Archived' ? 'badge-success' : 'badge-warning'}`}>
                      {item.flag_status || 'Flagged'}
                    </span>
                  </td>
                  {activeTab === 'active' ? (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {item.flag_status !== 'Investigating' ? (
                          <button onClick={() => investigateFlaggedItem(item.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-sm)' }}>
                            Investigate
                          </button>
                        ) : (
                          <>
                            <button onClick={() => restrictFlaggedItem(item.id)} style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                              Restrict
                            </button>
                            <button onClick={() => archiveFlaggedItem(item.id)} style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                              Mark Safe
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  ) : (
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.archiveTimestamp ? new Date(item.archiveTimestamp).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                  )}
                </tr>
                {expandedRow === item._uniqueId && (
                  <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <td colSpan="5" style={{ padding: '1rem' }}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Status History:</div>
                      {item.status_history && item.status_history.length > 0 ? (
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: 'var(--font-size-sm)' }}>
                          {item.status_history.map((hist, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{new Date(hist.timestamp).toLocaleString()}</span> - 
                              Admin <strong>{hist.admin_id}</strong> changed status from <strong>{hist.previous_status || 'None'}</strong> to <strong>{hist.new_status.split('|')[0]}</strong>
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
