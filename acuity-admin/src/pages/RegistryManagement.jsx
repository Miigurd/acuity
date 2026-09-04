import React, { useState } from 'react';
import styled from 'styled-components';
import { useAdminData } from '../context/AdminDataContext';
import { MdClose } from 'react-icons/md';
import { useToast } from '../context/ToastContext';

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);

  h2 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
  }

  @media (max-width: 752px) {
    flex-direction: column;
    align-items: stretch;

    h2 {
      font-size: var(--font-size-xl);
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: var(--bg-surface, #ffffff);
  border-radius: var(--radius-lg, 12px);
  padding: var(--spacing-6, 1.5rem);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  animation: modal-in 0.2s ease-out;

  @keyframes modal-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

function RegistryManagement() {
  const { registry, isLoading, fetchWithAuth, unverifyBusiness, uploadProgress } = useAdminData();
  const { showToast } = useToast();
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });
  const [isUploading, setIsUploading] = useState(false);

  const filteredRegistry = registry.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          String(item.id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : item.status !== 'Restricted';
    return matchesSearch && matchesStatus;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRegistry = [...filteredRegistry].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];

    if (sortConfig.key === 'id') {
      const numA = parseInt(String(valA).replace(/\D/g, '')) || 0;
      const numB = parseInt(String(valB).replace(/\D/g, '')) || 0;
      if (numA !== numB) {
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }
    }

    if (sortConfig.key === 'status') {
      const statusOrder = { 'Verified': 1, 'Pending Verification': 2, 'Unverified': 3, 'Restricted': 4 };
      const orderA = statusOrder[valA] || 99;
      const orderB = statusOrder[valB] || 99;
      if (orderA !== orderB) {
        return sortConfig.direction === 'asc' ? orderA - orderB : orderB - orderA;
      }
    }
    
    if (sortConfig.key === 'timestamp') {
      const timeA = new Date(valA).getTime() || 0;
      const timeB = new Date(valB).getTime() || 0;
      return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
    }
    
    return sortConfig.direction === 'asc' 
      ? String(valA || '').localeCompare(String(valB || '')) 
      : String(valB || '').localeCompare(String(valA || ''));
  });

  const handleUnverify = async () => {
    if (!selectedBusiness) return;
    if (window.confirm('Are you sure you want to unverify this business and remove its BPLO mapping?')) {
      await unverifyBusiness(selectedBusiness.id);
      showToast('success', 'Business unverified and mapping removed');
      setSelectedBusiness(null);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);

    try {
      const res = await fetchWithAuth((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/bplo/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`BPLO synced! ${data.auto_verified} verified automatically, ${data.queued} sent to queue.`, 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const errorData = await res.json();
        showToast('Failed to upload BPLO data: ' + errorData.error, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while uploading', 'error');
    } finally {
      setIsUploading(false);
      event.target.value = null;
    }
  };

  return (
    <div>
      <HeaderActions>
        <h2>Extracted Business Registry</h2>
        <div>
          <input 
            type="file" 
            id="bplo-upload" 
            accept=".csv, .xlsx, .xls" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
          />
          <button 
            className="btn btn-primary full-width-mobile" 
            onClick={() => document.getElementById('bplo-upload').click()}
            disabled={isUploading}
            style={{ opacity: isUploading ? 0.7 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
          >
            {isUploading ? 'Matching Records...' : 'Upload BPLO CSV'}
          </button>
        </div>
      </HeaderActions>

      
        {uploadProgress && isUploading && (
          <div style={{ marginTop: '1rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Fuzzy Matching BPLO Registry...</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{uploadProgress.percentage}% ({uploadProgress.current} / {uploadProgress.total} profiles)</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--primary)', width: `${uploadProgress.percentage}%`, transition: 'width 0.2s ease-out' }} />
            </div>
          </div>
        )}
        
        {isLoading ? <p className="text-muted">Loading extracted data from backend...</p> : (
      <>
        <div className="stack-mobile" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            className="form-input"
            placeholder="Search by ID or Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem', flex: 1 }}
          />
          <select 
            className="form-input"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', width: 'auto', minWidth: '200px' }}
          >
            <option value="">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Unverified">Unverified</option>
            <option value="Restricted">Restricted</option>
          </select>
        </div>
        <div className="glass-card animate-float-in table-scroll" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none', width: '10%' }}>
                  ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none', width: '35%' }}>
                  Business Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none', width: '20%' }}>
                  Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer', userSelect: 'none', width: '20%' }}>
                  Timestamp {sortConfig.key === 'timestamp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRegistry.map(item => (
              <tr key={item.id}>
                <td className="text-secondary">{item.id}</td>
                <td className="font-semibold">{item.name}</td>
                <td>
                  <span className={`badge ${
                    item.status === 'Verified' ? 'badge-success' : 
                    item.status === 'Pending Verification' ? 'badge-warning' : 
                    'badge-danger'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="text-secondary">
                  {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <button 
                    onClick={() => setSelectedBusiness(item)} 
                    style={{ color: 'var(--primary-light)', background: 'none', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          {sortedRegistry.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No businesses match your filters.
            </div>
          )}
        </div>
      </>
      )}

      {selectedBusiness && (
        <Overlay onClick={() => setSelectedBusiness(null)}>
          <ModalContainer onClick={e => e.stopPropagation()}>
            <button className="text-muted" style={{position:'absolute', top: '1rem', right: '1rem', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer'}} onClick={() => setSelectedBusiness(null)}><MdClose /></button>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary-light)' }}>{selectedBusiness.name}</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>ID: {selectedBusiness.id} &bull; <span className={`badge ${
              selectedBusiness.status === 'Verified' ? 'badge-success' : 
              selectedBusiness.status === 'Pending Verification' ? 'badge-warning' : 
              'badge-danger'
            }`}>{selectedBusiness.status}</span></p>

            {selectedBusiness.raw?.bplo_match && (
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: selectedBusiness.status === 'Verified' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                border: `1px solid ${selectedBusiness.status === 'Verified' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, 
                borderRadius: '8px' 
              }}>
                <strong style={{ color: selectedBusiness.status === 'Verified' ? '#22c55e' : '#f59e0b', display: 'block', marginBottom: '0.5rem' }}>
                  {selectedBusiness.status === 'Verified' ? '✓ Verified via BPLO Match' : '⚠ Pending BPLO Match'}
                </strong>
                <p className="text-primary" style={{ margin: 0, fontSize: '0.9rem' }}>
                  <strong>BPLO Name:</strong> {selectedBusiness.raw.bplo_match.name} <br/>
                  <strong>BPLO Address:</strong> {selectedBusiness.raw.bplo_match.address || 'N/A'} <br/>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Match Confidence: {(selectedBusiness.raw.bplo_match.confidence_score * 100).toFixed(1)}%</span>
                </p>
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <strong className="text-secondary" style={{ display: 'block', fontSize: '0.875rem' }}>Address</strong>
                <span className="text-primary">{Array.isArray(selectedBusiness.raw?.locations) ? selectedBusiness.raw.locations.join(' | ') : selectedBusiness.raw?.address || 'Not extracted'}</span>
              </div>
              
              <div>
                <strong className="text-secondary" style={{ display: 'block', fontSize: '0.875rem' }}>Contact Numbers</strong>
                <span className="text-primary">{Array.isArray(selectedBusiness.raw?.phones) && selectedBusiness.raw.phones.length > 0 ? selectedBusiness.raw.phones.join(', ') : 'Not extracted'}</span>
              </div>

              <div>
                <strong className="text-secondary" style={{ display: 'block', fontSize: '0.875rem' }}>Operating Hours</strong>
                <span className="text-primary">{Array.isArray(selectedBusiness.raw?.hours) && selectedBusiness.raw.hours.length > 0 ? selectedBusiness.raw.hours.join(', ') : 'Not extracted'}</span>
              </div>

              <div>
                <strong className="text-secondary" style={{ display: 'block', fontSize: '0.875rem' }}>Extracted Categories</strong>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {Array.isArray(selectedBusiness.raw?.categories) && selectedBusiness.raw.categories.length > 0 
                    ? selectedBusiness.raw.categories.map((cat, i) => (
                        <span key={i} className="badge badge-primary">
                          {cat}
                        </span>
                      ))
                    : 'None'}
                </div>
              </div>

              <div>
                <strong className="text-secondary" style={{ display: 'block', fontSize: '0.875rem' }}>Description / Summary</strong>
                <p className="text-primary" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', background: 'var(--bg-deep)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>{selectedBusiness.raw?.description || 'No description available.'}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {selectedBusiness.status === 'Verified' && (
                <button className="btn btn-outline" onClick={handleUnverify} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                  Unverify
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedBusiness(null)}>Close</button>
            </div>
          </ModalContainer>
        </Overlay>
      )}
    </div>
  );
}

export default RegistryManagement;
