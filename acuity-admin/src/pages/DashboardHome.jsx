import React from 'react';
import styled from 'styled-components';
import { MdStore, MdWarning, MdPendingActions, MdCheckCircle, MdVisibility, MdTouchApp, MdTrendingUp, MdInfo, MdPhoneInTalk } from 'react-icons/md';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-5);
  margin-bottom: var(--spacing-8);

  @media (max-width: 752px) {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--spacing-4);
  }
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  cursor: pointer;
  color: var(--text-muted);
  
  &:hover {
    color: var(--primary);
  }
`;

const TooltipContent = styled.div`
  position: absolute;
  bottom: 130%;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background-color: var(--bg-elevated);
  color: var(--text-secondary);
  text-align: center;
  border-radius: var(--radius-md);
  padding: 10px;
  font-size: 13px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 100;
  font-weight: normal;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -6px;
    border-width: 6px;
    border-style: solid;
    border-color: var(--bg-elevated) transparent transparent transparent;
  }
`;

const InfoTooltip = ({ text }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <TooltipContainer onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
      <MdInfo size={16} />
      {open && (
        <React.Fragment>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
          <TooltipContent onClick={(e) => e.stopPropagation()}>{text}</TooltipContent>
        </React.Fragment>
      )}
    </TooltipContainer>
  );
};

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
  let totalInquiries = 0;
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
      totalInquiries += (b.stats.inquiries || 0);
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
        <StatCard className="glass-card animate-float-in" style={{ animationDelay: '0ms' }}>
          <IconWrapper bg="rgba(0, 41, 145, 0.1)" color="var(--primary)" shadow="var(--primary-glow)">
            <MdStore />
          </IconWrapper>
          <StatInfo>
            <span className="label">Total Extracted Profiles</span>
            <span className="value">{registry.length}</span>
          </StatInfo>
        </StatCard>
        
        <StatCard className="glass-card animate-float-in" style={{ animationDelay: '100ms' }}>
          <IconWrapper bg="rgba(217, 119, 6, 0.1)" color="var(--warning)" shadow="rgba(217, 119, 6, 0.15)">
            <MdPendingActions />
          </IconWrapper>
          <StatInfo>
            <span className="label">Pending in Queue</span>
            <span className="value">{queue.length}</span>
          </StatInfo>
        </StatCard>

        <StatCard className="glass-card animate-float-in" style={{ animationDelay: '200ms' }}>
          <IconWrapper bg="rgba(220, 38, 38, 0.1)" color="var(--danger)" shadow="rgba(220, 38, 38, 0.15)">
            <MdWarning />
          </IconWrapper>
          <StatInfo>
            <span className="label">Flagged Profiles</span>
            <span className="value">{flagged.length}</span>
          </StatInfo>
        </StatCard>
        
        <StatCard className="glass-card animate-float-in" style={{ animationDelay: '300ms' }}>
          <IconWrapper bg="rgba(5, 150, 105, 0.1)" color="var(--success)" shadow="rgba(5, 150, 105, 0.15)">
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
          <StatCard className="glass-card animate-float-in" style={{ animationDelay: '400ms' }}>
            <IconWrapper bg="rgba(99, 102, 241, 0.1)" color="var(--secondary)" shadow="rgba(99, 102, 241, 0.15)">
              <MdVisibility />
            </IconWrapper>
            <StatInfo>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span className="label" style={{ marginBottom: 0 }}>Total Search Impressions</span>
                <InfoTooltip text="Total times businesses have appeared in search results." />
              </div>
              <span className="value">{totalImpressions}</span>
            </StatInfo>
          </StatCard>
          
          <StatCard className="glass-card animate-float-in" style={{ animationDelay: '500ms' }}>
            <IconWrapper bg="rgba(16, 185, 129, 0.1)" color="var(--success)" shadow="rgba(16, 185, 129, 0.15)">
              <MdTouchApp />
            </IconWrapper>
            <StatInfo>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span className="label" style={{ marginBottom: 0 }}>Total Profile Clicks</span>
                <InfoTooltip text="Total times users clicked on a business profile from search results." />
              </div>
              <span className="value">{totalClicks}</span>
            </StatInfo>
          </StatCard>



          <StatCard className="glass-card animate-float-in" style={{ animationDelay: '700ms' }}>
            <IconWrapper bg="rgba(236, 72, 153, 0.1)" color="#ec4899" shadow="rgba(236, 72, 153, 0.15)">
              <MdTrendingUp />
            </IconWrapper>
            <StatInfo>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span className="label" style={{ marginBottom: 0 }}>Global Click-Through Rate</span>
                <InfoTooltip text="Percentage of search impressions that result in a profile click." />
              </div>
              <span className="value">{ctr}%</span>
            </StatInfo>
          </StatCard>
        </Grid>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
          <div className="glass-card animate-float-in" style={{ padding: 'var(--spacing-6)', animationDelay: '800ms' }}>
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

          <div className="glass-card animate-float-in" style={{ padding: 'var(--spacing-6)', animationDelay: '900ms' }}>
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
