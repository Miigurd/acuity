import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

const TopbarContainer = styled.header`
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 5;
`;

const PageTitle = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border);
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
  box-shadow: 0 2px 8px var(--primary-glow);
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  
  span.name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  span.role {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
`;

function Topbar() {
  const location = useLocation();
  
  // Mapping paths to titles
  const getTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/registry': return 'Registry Management';
      case '/queue': return 'Pending Profile Review Queue';
      case '/flagged': return 'Flagged Profiles';
      default: return 'Administrator Dashboard';
    }
  };

  return (
    <TopbarContainer className="glass-panel" style={{ borderTop: 'none', borderRight: 'none', borderLeft: 'none' }}>
      <PageTitle>{getTitle()}</PageTitle>
      
      <UserProfile>
        <UserInfo>
          <span className="name">Municipal Admin</span>
          <span className="role">BPLO Department</span>
        </UserInfo>
        <Avatar>MA</Avatar>
      </UserProfile>
    </TopbarContainer>
  );
}

export default Topbar;
