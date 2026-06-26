import React from 'react';
import './styles/design-system.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MockDataProvider } from './context/MockDataContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ResidentDashboard from './pages/ResidentDashboard';
import SearchResults from './pages/SearchResults';
import FlaggedStores from './pages/FlaggedStores';
import BusinessProfileView from './pages/BusinessProfileView';
import ResidentProfile from './pages/ResidentProfile';
import EditBusinessProfile from './pages/EditBusinessProfile';
import MapPage from './pages/MapPage';

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
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="home" element={<ResidentDashboard />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="map" element={<MapPage />} />

        {/* Business Profiles & Wiki Editing */}
        <Route path="business/:id" element={<BusinessProfileView />} />
        <Route path="business/:id/edit" element={<EditBusinessProfile />} />

        {/* Transparency Feature */}
        <Route path="flagged" element={<FlaggedStores />} />

        {/* User Preferences */}
        <Route path="profile" element={<ResidentProfile />} />

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
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </MockDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
