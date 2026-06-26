import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';
import RegistryManagement from './pages/RegistryManagement';
import VerificationQueue from './pages/VerificationQueue';
import FlaggedProfiles from './pages/FlaggedProfiles';
import HeldEdits from './pages/HeldEdits';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardHome />} />
        <Route path="registry" element={<RegistryManagement />} />
        <Route path="queue" element={<VerificationQueue />} />
        <Route path="flagged" element={<FlaggedProfiles />} />
        <Route path="held-edits" element={<HeldEdits />} />
      </Route>
    </Routes>
  );
}

export default App;
