import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdListAlt, MdOutlineQueue, MdFlag, MdSecurity, MdLogout, MdOutlineScience } from 'react-icons/md';
import { useAdminData } from '../context/AdminDataContext';

const SidebarContainer = styled.aside`
  width: var(--sidebar-width);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  z-index: 50;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 1024px) {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(${props => props.open ? '0' : '-100%'});
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.2);
  }
`;

const SidebarHeader = styled.div`
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border);
`;

const LogoMark = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-deep-navy);
  color: #ffffff;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 41, 145, 0.3);
  flex-shrink: 0;
`;

const LogoText = styled.div`
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  font-family: var(--font-display);

  span {
    color: var(--color-deep-navy);
  }
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-4) var(--spacing-3);
  flex: 1;
  overflow-y: auto;
`;

const NavSection = styled.div`
  padding: var(--spacing-4) var(--spacing-3) var(--spacing-2);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: 10px 14px;
  margin-bottom: 2px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-card);
  transition: all 0.2s ease;

  svg {
    font-size: 1.1rem;
    opacity: 0.75;
    flex-shrink: 0;
  }

  &:hover {
    color: var(--color-deep-navy);
    background-color: var(--bg-hover);
    svg { opacity: 1; }
  }

  &.active {
    color: #002991;
    background: var(--color-sky-tint);
    font-weight: 700;
    svg { opacity: 1; color: #002991; }
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin: var(--spacing-2) var(--spacing-3) var(--spacing-4);
  padding: 10px 14px;
  color: var(--danger);
  background: var(--error-bg);
  border: 1px solid transparent;
  border-radius: var(--radius-card);
  font-weight: 700;
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
  cursor: pointer;
  text-align: left;

  svg {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  &:hover {
    border-color: rgba(220, 38, 38, 0.3);
    background: var(--error-bg);
  }
`;

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/', end: true, icon: <MdDashboard />, label: 'Dashboard' },
      { to: '/registry', icon: <MdListAlt />, label: 'Registry Management' },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { to: '/queue', icon: <MdOutlineQueue />, label: 'Verification Queue' },
      { to: '/flagged', icon: <MdFlag />, label: 'Flagged Profiles' },
      { to: '/held-edits', icon: <MdSecurity />, label: 'Held Edits' },
    ],
  },
  {
    label: 'Simulation',
    items: [
      { to: '/queue-simulation', icon: <MdOutlineScience />, label: 'Queue Simulation' },
    ],
  },
];

function Sidebar({ open, onClose }) {
  const { logout } = useAdminData();

  return (
    <SidebarContainer open={open}>
      <SidebarHeader>
        <LogoMark>A</LogoMark>
        <LogoText>
          Acu<span>Admin</span>
        </LogoText>
      </SidebarHeader>
      <NavList>
        {navSections.map(section => (
          <React.Fragment key={section.label}>
            <NavSection>{section.label}</NavSection>
            {section.items.map(item => (
              <NavItem
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
              >
                {item.icon}
                {item.label}
              </NavItem>
            ))}
          </React.Fragment>
        ))}
      </NavList>
      <LogoutButton onClick={() => { onClose(); logout(); }}>
        <MdLogout />
        Logout
      </LogoutButton>
    </SidebarContainer>
  );
}

export default Sidebar;
