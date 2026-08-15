import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';

const TopbarContainer = styled.header`
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding: 0 1.5rem;
  z-index: 5;

  @media (max-width: 752px) {
    padding: 0 1rem;
  }
`;

const LeftSide = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
`;

const MenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-card);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-hover);
    color: var(--color-deep-navy);
  }

  @media (max-width: 1024px) {
    display: flex;
  }
`;

const PageTitle = styled.h2`
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PageSubtitle = styled.p`
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  flex-shrink: 0;

  @media (max-width: 752px) {
    padding: var(--spacing-1) var(--spacing-2);
    border: none;
    background: none;
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-deep-navy), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
  box-shadow: 0 2px 8px rgba(0, 41, 145, 0.3);
  flex-shrink: 0;
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

  @media (max-width: 752px) {
    display: none;
  }
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

function Topbar({ onMenuClick }) {
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/registry': return 'Registry Management';
      case '/queue': return 'Pending Profile Review Queue';
      case '/flagged': return 'Flagged Profiles';
      case '/held-edits': return 'Held Edits';
      case '/queue-simulation': return 'Verification Queue Simulation';
      default: return 'Administrator Dashboard';
    }
  };

  const getSubtitle = () => {
    switch (location.pathname) {
      case '/': return 'BPLO business intelligence at a glance';
      case '/registry': return 'Manage verified and extracted business records';
      case '/queue': return 'Review extracted profiles against the BPLO registry';
      case '/flagged': return 'Resolve community-flagged business profiles';
      case '/held-edits': return 'Approve or reject edits held by the rate limiter';
      case '/queue-simulation': return 'Step-through the Levenshtein matching algorithm';
      default: return 'City of Cabuyao, Laguna';
    }
  };

  return (
    <TopbarContainer className="glass-panel" style={{ borderTop: 'none', borderRight: 'none', borderLeft: 'none' }}>
      <LeftSide>
        <MenuButton onClick={onMenuClick} aria-label="Toggle navigation">
          <FiMenu size={20} />
        </MenuButton>
        <TitleWrap>
          <PageTitle>{getTitle()}</PageTitle>
          <PageSubtitle className="hide-mobile">{getSubtitle()}</PageSubtitle>
        </TitleWrap>
      </LeftSide>

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
