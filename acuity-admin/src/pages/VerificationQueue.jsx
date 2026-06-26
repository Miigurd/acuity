import React from 'react';
import styled from 'styled-components';

const QueueCard = styled.div`
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
  display: flex;
  gap: var(--spacing-8);
  position: relative;
  
  &:hover {
    z-index: 10;
  }
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

const InfoTooltip = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  width: 250px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 400;
  text-align: left;
  z-index: 50;
  display: none;
  cursor: default;

  h4 {
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--warning);
    text-transform: none;
    letter-spacing: normal;
  }
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
  
  &:hover ${InfoTooltip} {
    display: block;
  }
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
          </ProfileSection>
          
          <ProfileSection>
            <h4>Best BPLO Match</h4>
            <p><strong className="text-secondary">Name:</strong> {item.registry.name}</p>
            <div style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>
              <TooltipContainer>
                <span className="badge badge-warning" style={{ fontSize: 'var(--font-size-sm)', cursor: 'help' }}>Fuzzy Match Score: {item.score}</span>
                <InfoTooltip>
                  <h4>Levenshtein Distance</h4>
                  <p style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Calculated via custom dynamic programming matrix.</p>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>This measures the minimum number of single-character edits required to change the extracted name into the official BPLO name.</p>
                  <div style={{ background: 'var(--bg-deep)', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Longest Name:</span> <strong>{item.max_len} chars</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Edits Required:</span> <strong>{item.edits}</strong></div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <em>1 - ({item.edits} / {item.max_len}) = <strong>{item.score}</strong></em>
                    </div>
                  </div>
                </InfoTooltip>
              </TooltipContainer>
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
