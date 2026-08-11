import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';
import RegistryManagement from './pages/RegistryManagement';
import VerificationQueue from './pages/VerificationQueue';
import VerificationQueueSimulation from './pages/VerificationQueueSimulation';
import FlaggedProfiles from './pages/FlaggedProfiles';
import HeldEdits from './pages/HeldEdits';
import Login from './pages/Login';
import { useAdminData } from './context/AdminDataContext';

function App() {
  const { token } = useAdminData();

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardHome />} />
        <Route path="registry" element={<RegistryManagement />} />
        <Route path="queue" element={<VerificationQueue />} />
        <Route path="queue-simulation" element={<VerificationQueueSimulation />} />
        <Route path="flagged" element={<FlaggedProfiles />} />
        <Route path="held-edits" element={<HeldEdits />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
