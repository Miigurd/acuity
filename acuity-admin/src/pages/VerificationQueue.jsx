import React from 'react';
import styled from 'styled-components';

const QueueCard = styled.div`
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
  display: flex;
  gap: var(--spacing-8);
`;

const ProfileSection = styled.div`
  flex: 1;
  border-right: ${props => props.divider ? '1px solid var(--border)' : 'none'};
  padding-right: ${props => props.divider ? 'var(--spacing-8)' : '0'};

  h4 {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  justify-content: center;
  min-width: 150px;
`;

import { useAdminData } from '../context/AdminDataContext';

function VerificationQueue() {
  const { queue, isLoading, approveQueueItem, rejectQueueItem } = useAdminData();

  return (
    <div>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Review profiles extracted by the system against the official BPLO registry.</p>
      
      {isLoading ? <p className="text-muted">Loading extracted data from backend...</p> : queue.length === 0 ? <p className="text-muted">No items in queue.</p> : queue.map(item => (
        <QueueCard key={item.id} className="glass-card">
          <ProfileSection divider>
            <h4>Extracted Profile</h4>
            <p><strong className="text-secondary">Name:</strong> {item.extracted.name}</p>
            <p><strong className="text-secondary">Address:</strong> {item.extracted.address}</p>
          </ProfileSection>
          
          <ProfileSection>
            <h4>Best BPLO Match</h4>
            <p><strong className="text-secondary">Name:</strong> {item.registry.name}</p>
            <p><strong className="text-secondary">Address:</strong> {item.registry.address}</p>
            <div style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>
               <span className="badge badge-warning" style={{ fontSize: 'var(--font-size-sm)' }}>Fuzzy Match Score: {item.score}</span>
            </div>
          </ProfileSection>
          
          <ActionButtons>
            <button className="btn btn-primary btn-full" onClick={() => approveQueueItem(item.id)}>Approve Match</button>
            <button className="btn btn-outline btn-full" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => rejectQueueItem(item.id)}>Reject</button>
          </ActionButtons>
        </QueueCard>
      ))}
    </div>
  );
}

export default VerificationQueue;
