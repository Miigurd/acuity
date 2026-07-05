import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AdminDataProvider } from './context/AdminDataContext';
import { ToastProvider } from './context/ToastContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AdminDataProvider>
          <App />
        </AdminDataProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
