import React from 'react';
import styled from 'styled-components';
import { MdStore, MdWarning, MdPendingActions, MdCheckCircle, MdVisibility, MdTouchApp, MdTrendingUp } from 'react-icons/md';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-8);
`;

const StatCard = styled.div`
  padding: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
`;

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  background-color: ${props => props.bg || 'var(--bg-elevated)'};
  color: ${props => props.color || 'var(--primary)'};
  box-shadow: 0 4px 15px ${props => props.shadow || 'transparent'};
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  
  span.label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  span.value {
    font-size: var(--font-size-3xl);
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
    letter-spacing: -0.02em;
  }
`;

import { useAdminData } from '../context/AdminDataContext';

function DashboardHome() {
  const { registry, queue, flagged } = useAdminData();

  let totalImpressions = 0;
  let totalClicks = 0;
  const businessesWithStats = registry.map(b => b.raw);

  const uniqueBusinesses = [];
  const seenNames = new Set();
  businessesWithStats.forEach(b => {
    const name = b.name || b.business_name;
    // Filter out 'None' or invalid names as well
    if (name && name !== 'None' && !seenNames.has(name)) {
      seenNames.add(name);
      uniqueBusinesses.push(b);
    }
  });

  uniqueBusinesses.forEach(b => {
    if (b.stats) {
      totalImpressions += (b.stats.impressions || 0);
      totalClicks += (b.stats.clicks || 0);
    }
  });

  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

  const topSearched = [...uniqueBusinesses]
    .filter(b => b.stats && b.stats.impressions > 0)
    .sort((a, b) => (b.stats?.impressions || 0) - (a.stats?.impressions || 0))
    .slice(0, 5);

  const topClicked = [...uniqueBusinesses]
    .filter(b => b.stats && b.stats.clicks > 0)
    .sort((a, b) => (b.stats?.clicks || 0) - (a.stats?.clicks || 0))
    .slice(0, 5);

  return (
    <div>
      <Grid>
        <StatCard className="glass-card">
          <IconWrapper bg="rgba(220, 38, 38, 0.15)" color="var(--primary)" shadow="var(--primary-glow)">
            <MdStore />
          </IconWrapper>
          <StatInfo>
            <span className="label">Total Extracted Profiles</span>
            <span className="value">{registry.length}</span>
          </StatInfo>
        </StatCard>
        
        <StatCard className="glass-card">
          <IconWrapper bg="rgba(245, 158, 11, 0.15)" color="var(--warning)" shadow="rgba(245, 158, 11, 0.2)">
            <MdPendingActions />
          </IconWrapper>
          <StatInfo>
            <span className="label">Pending in Queue</span>
            <span className="value">{queue.length}</span>
          </StatInfo>
        </StatCard>

        <StatCard className="glass-card">
          <IconWrapper bg="rgba(239, 68, 68, 0.15)" color="var(--error)" shadow="rgba(239, 68, 68, 0.2)">
            <MdWarning />
          </IconWrapper>
          <StatInfo>
            <span className="label">Flagged Profiles</span>
            <span className="value">{flagged.length}</span>
          </StatInfo>
        </StatCard>
        
        <StatCard className="glass-card">
          <IconWrapper bg="rgba(34, 197, 94, 0.15)" color="var(--success)" shadow="rgba(34, 197, 94, 0.2)">
            <MdCheckCircle />
          </IconWrapper>
          <StatInfo>
            <span className="label">Recent Approvals (Last 7d)</span>
            <span className="value">0</span>
          </StatInfo>
        </StatCard>
      </Grid>
      
      <div style={{ marginTop: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--spacing-4)', color: 'var(--text-primary)' }}>Business Analytics Dashboard</h2>
        
        <Grid>
          <StatCard className="glass-card">
            <IconWrapper bg="rgba(99, 102, 241, 0.15)" color="var(--secondary)" shadow="rgba(99, 102, 241, 0.2)">
              <MdVisibility />
            </IconWrapper>
            <StatInfo>
              <span className="label">Total Search Impressions</span>
              <span className="value">{totalImpressions}</span>
            </StatInfo>
          </StatCard>
          
          <StatCard className="glass-card">
            <IconWrapper bg="rgba(34, 197, 94, 0.15)" color="var(--success)" shadow="rgba(34, 197, 94, 0.2)">
              <MdTouchApp />
            </IconWrapper>
            <StatInfo>
              <span className="label">Total Profile Clicks</span>
              <span className="value">{totalClicks}</span>
            </StatInfo>
          </StatCard>

          <StatCard className="glass-card">
            <IconWrapper bg="rgba(236, 72, 153, 0.15)" color="#ec4899" shadow="rgba(236, 72, 153, 0.2)">
              <MdTrendingUp />
            </IconWrapper>
            <StatInfo>
              <span className="label">Global Click-Through Rate</span>
              <span className="value">{ctr}%</span>
            </StatInfo>
          </StatCard>
        </Grid>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-6)' }}>
          <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--spacing-4)' }}>Top Searched Services</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: 'var(--spacing-2) 0' }}>Business Name</th>
                  <th style={{ padding: 'var(--spacing-2) 0', textAlign: 'right' }}>Impressions</th>
                </tr>
              </thead>
              <tbody>
                {topSearched.length > 0 ? topSearched.map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 'var(--spacing-3) 0', fontWeight: 600 }}>{b.name || b.business_name}</td>
                    <td style={{ padding: 'var(--spacing-3) 0', textAlign: 'right', fontWeight: 700, color: 'var(--secondary)' }}>{b.stats.impressions}</td>
                  </tr>
                )) : <tr><td colSpan="2" style={{ padding: 'var(--spacing-4) 0', textAlign: 'center', color: 'var(--text-muted)' }}>No impressions logged yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--spacing-4)' }}>Most Clicked Profiles</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: 'var(--spacing-2) 0' }}>Business Name</th>
                  <th style={{ padding: 'var(--spacing-2) 0', textAlign: 'right' }}>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {topClicked.length > 0 ? topClicked.map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 'var(--spacing-3) 0', fontWeight: 600 }}>{b.name || b.business_name}</td>
                    <td style={{ padding: 'var(--spacing-3) 0', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{b.stats.clicks}</td>
                  </tr>
                )) : <tr><td colSpan="2" style={{ padding: 'var(--spacing-4) 0', textAlign: 'center', color: 'var(--text-muted)' }}>No clicks logged yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
