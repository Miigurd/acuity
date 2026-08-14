import React, { createContext, useState, useContext, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;


const ToastContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 9999;
  pointer-events: none;
`;

const ToastMessage = styled.div`
  background: ${({ $type }) => ($type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : $type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')};
  color: white;
  padding: 14px 24px;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 280px;
  max-width: 400px;
  font-size: 0.95rem;
  font-weight: 500;
  animation: ${slideIn} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  pointer-events: auto;
`;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastMessage key={toast.id} $type={toast.type}>
            {toast.message}
          </ToastMessage>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};
