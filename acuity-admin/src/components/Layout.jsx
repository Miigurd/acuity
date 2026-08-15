import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet, useLocation } from 'react-router-dom';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const MainContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PageContent = styled.main`
  flex: 1;
  padding: var(--spacing-8) var(--spacing-10);
  margin-top: 1px;
  overflow-y: auto;
  background-color: var(--bg-deep);

  @media (max-width: 752px) {
    padding: var(--spacing-5) var(--spacing-5);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 40;
`;

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setSidebarOpen(false);
  }

  return (
    <LayoutContainer>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <Backdrop onClick={() => setSidebarOpen(false)} />}
      <MainContentWrapper>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <PageContent>
          <Outlet />
        </PageContent>
      </MainContentWrapper>
    </LayoutContainer>
  );
}

export default Layout;
