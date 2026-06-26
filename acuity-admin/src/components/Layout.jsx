import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet } from 'react-router-dom';

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
`;

function Layout() {
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContentWrapper>
        <Topbar />
        <PageContent>
          <Outlet />
        </PageContent>
      </MainContentWrapper>
    </LayoutContainer>
  );
}

export default Layout;
