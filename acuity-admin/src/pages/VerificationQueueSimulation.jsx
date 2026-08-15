import React from 'react';
import styled from 'styled-components';
import LevenshteinSimulation from '../components/LevenshteinSimulation';

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

function VerificationQueueSimulation() {
  const { queue, isLoading } = useAdminData();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Review profiles extracted by the system against the official BPLO registry. <strong style={{color: 'var(--primary)'}}>(Simulation Mode Active)</strong></p>
      </div>
      
      {isLoading ? <p className="text-muted">Loading extracted data from backend...</p> : queue.length === 0 ? <p className="text-muted">No items in queue.</p> : queue.map(group => (
        <QueueCard key={group.business_id} className="glass-card animate-float-in" style={{ flexDirection: 'column' }}>
          <div className="queue-row">
            <ProfileSection divider className="queue-section" style={{ flex: '0 0 300px' }}>
              <h4>Extracted Profile</h4>
              <p><strong className="text-secondary">Name:</strong> {group.extracted.name}</p>
            </ProfileSection>
            
            <div style={{ flex: 1 }}>
              <h4>Ranked BPLO Matches</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {group.matches.map((match, index) => (
                  <div key={match.match_id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}><span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>#{index + 1}</span>{match.registry.name}</p>
                        
                        <div style={{ marginTop: '0.5rem' }}>
                          <TooltipContainer>
                            <span className="badge badge-warning" style={{ fontSize: 'var(--font-size-sm)', cursor: 'help' }}>Score: {match.score}</span>
                            <InfoTooltip>
                              <h4>Levenshtein Distance</h4>
                              <p style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Calculated via custom dynamic programming matrix.</p>
                              <p style={{ color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>This measures the minimum number of single-character edits required to change the extracted name into the official BPLO name.</p>
                              <div style={{ background: 'var(--bg-deep)', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Longest Name:</span> <strong>{match.max_len} chars</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Edits Required:</span> <strong>{match.edits}</strong></div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                  <em>1 - ({match.edits} / {match.max_len}) = <strong>{Math.round((match.max_len - match.edits) / match.max_len * 100)}%</strong></em>
                                </div>
                              </div>
                            </InfoTooltip>
                          </TooltipContainer>
                        </div>
                      </div>
                    </div>
                    
                    {/* Algorithm Simulation Section */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
                      <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Algorithm Simulation (How we got this score)</h4>
                      <LevenshteinSimulation sourceText={group.extracted.name} targetText={match.registry.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </QueueCard>
      ))}
    </div>
  );
}

export default VerificationQueueSimulation;
