import React, { useState } from 'react';
import styled from 'styled-components';
import { useAdminData } from '../context/AdminDataContext';
import { MdClose } from 'react-icons/md';

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);

  h2 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
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
  const { registry, isLoading } = useAdminData();
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/bplo/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        alert(`BPLO synced! ${data.auto_verified} verified automatically, ${data.queued} sent to queue.`);
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert('Failed to upload BPLO data: ' + errorData.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while uploading');
    }
    // reset input
    event.target.value = null;
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
          <button className="btn btn-primary" onClick={() => document.getElementById('bplo-upload').click()}>
            Upload BPLO CSV
          </button>
        </div>
      </HeaderActions>

      {isLoading ? <p className="text-muted">Loading extracted data from backend...</p> : (
      <div className="glass-card" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Business Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registry.map(item => (
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
      </div>
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
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
               <button className="btn btn-secondary" onClick={() => setSelectedBusiness(null)}>Close</button>
            </div>
          </ModalContainer>
        </Overlay>
      )}
    </div>
  );
}

export default RegistryManagement;
