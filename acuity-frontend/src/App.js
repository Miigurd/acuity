import React from 'react';
import './styles/design-system.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MockDataProvider } from './context/MockDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ResidentDashboard from './pages/ResidentDashboard';
import SearchResults from './pages/SearchResults';
import SearchSimulation from './pages/SearchSimulation';
import FlaggedStores from './pages/FlaggedStores';
import BusinessProfileView from './pages/BusinessProfileView';
import EditBusinessProfile from './pages/EditBusinessProfile';
import MapPage from './pages/MapPage';
import ITExpertValidation from './pages/ITExpertValidation';

const Placeholder = ({ title }) => (
  <div className="container py-4 flex-col items-center justify-center h-full">
    <h2>{title}</h2>
    <p className="text-muted mt-2">This page is under construction.</p>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Open-Access Routes (No Account Required) */}
        <Route index element={<LandingPage />} />
        <Route path="home" element={<ResidentDashboard />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="map" element={<MapPage />} />

        {/* Business Profiles & Community Wiki Editing */}
        <Route path="business/:id" element={<BusinessProfileView />} />
        <Route path="business/:id/edit" element={<EditBusinessProfile />} />

        {/* Community Transparency Safety Feature */}
        <Route path="flagged" element={<FlaggedStores />} />

        {/* IT Expert & Panelist Validation Hub */}
        <Route path="it-expert-validation" element={<ITExpertValidation />} />
        <Route path="search-simulation" element={<ITExpertValidation />} />

        {/* Fallback */}
        <Route path="*" element={<Placeholder title="404 - Page Not Found" />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MockDataProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </MockDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
