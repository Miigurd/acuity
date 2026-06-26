import React from 'react';
import { useAdminData } from '../context/AdminDataContext';

function FlaggedProfiles() {
  const { flagged, removeFlaggedItem, investigateFlaggedItem } = useAdminData();
  
  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Manage business profiles flagged by the community for inaccuracies.</p>
      
      <div className="glass-card" style={{ padding: 0 }}>
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
            {flagged.map(item => (
              <tr key={item.id}>
                <td className="font-semibold">{item.name}</td>
                <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{item.flags}</td>
                <td className="text-secondary">{item.reason}</td>
                <td>
                  <span className="badge badge-danger">
                    {item.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => investigateFlaggedItem(item.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: 'var(--font-size-sm)', marginRight: 'var(--spacing-4)' }}>Investigate</button>
                  <button onClick={() => removeFlaggedItem(item.id)} style={{ color: 'var(--danger)', background: 'none', fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', border: 'none' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FlaggedProfiles;
