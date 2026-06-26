import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdListAlt, MdOutlineQueue, MdFlag, MdSecurity } from 'react-icons/md';

const SidebarContainer = styled.aside`
  width: var(--sidebar-width);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border-right: 1px solid var(--border);
  z-index: 10;
`;

const SidebarHeader = styled.div`
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--border);
  font-weight: 800;
  font-size: var(--font-size-xl);
  letter-spacing: -0.02em;
  color: var(--text-primary);
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-6) 0;
  flex: 1;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-6);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
  border-left: 3px solid transparent;

  svg {
    margin-right: var(--spacing-4);
    font-size: var(--font-size-xl);
    opacity: 0.7;
  }

  &:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
    svg { opacity: 1; color: var(--primary-light); }
  }

  &.active {
    color: var(--primary);
    background-color: rgba(220, 38, 38, 0.05); /* primary slightly tinted bg */
    border-left-color: var(--primary);
    svg { opacity: 1; color: var(--primary); }
  }
`;

function Sidebar() {
  return (
    <SidebarContainer>
      <SidebarHeader>
        Acu<span style={{ color: 'var(--primary)' }}>Admin</span>
      </SidebarHeader>
      <NavList>
        <NavItem to="/" end>
          <MdDashboard />
          Dashboard
        </NavItem>
        <NavItem to="/registry">
          <MdListAlt />
          Registry Management
        </NavItem>
        <NavItem to="/queue">
          <MdOutlineQueue />
          Verification Queue
        </NavItem>
        <NavItem to="/flagged">
          <MdFlag />
          Flagged Profiles
        </NavItem>
        <NavItem to="/held-edits">
          <MdSecurity />
          Held Edits
        </NavItem>
      </NavList>
    </SidebarContainer>
  );
}

export default Sidebar;
