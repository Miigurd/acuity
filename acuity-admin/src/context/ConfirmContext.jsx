import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    resolve: null,
  });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (modalState.resolve) modalState.resolve(true);
    setModalState({ isOpen: false, message: '', resolve: null });
  };

  const handleCancel = () => {
    if (modalState.resolve) modalState.resolve(false);
    setModalState({ isOpen: false, message: '', resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {modalState.isOpen && (
        <div
          onClick={handleCancel}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            animation: 'fade-in-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface, #fff)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 'var(--radius-xl, 1rem)',
              padding: '2.5rem 2rem',
              maxWidth: '380px', width: '100%',
              boxShadow: 'var(--shadow-lg), 0 0 60px var(--primary-glow, rgba(220, 38, 38, 0.15))',
              textAlign: 'center',
              animation: 'modal-in 0.35s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.12)',
              border: '2px solid rgba(220, 38, 38, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 30px var(--primary-glow, rgba(220, 38, 38, 0.2))',
            }}>
              <FiAlertCircle size={36} style={{ color: 'var(--primary, #dc2626)' }} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #111)', marginBottom: '0.5rem' }}>
              Confirm Action
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #4b5563)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {modalState.message}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border, #d1d5db)',
                  background: 'transparent',
                  color: 'var(--text-secondary, #374151)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onMouseOver={e => {
                  e.target.style.background = 'var(--bg-elevated, #f3f4f6)';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--primary, #dc2626)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ConfirmContext.Provider>
  );
};
