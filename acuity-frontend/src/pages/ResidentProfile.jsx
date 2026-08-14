import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMapPin, FiLogOut, FiEdit2, FiSettings, FiPhone, FiShield } from 'react-icons/fi';

const ResidentProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
        Resident Account
      </h2>

      {/* Avatar Card */}
      <div className="card mb-6 flex-col items-center text-center py-8">
        <div style={{
          width: '80px', height: '80px',
          borderRadius: '50%',
          background: 'var(--color-sky-tint)',
          color: 'var(--color-deep-navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', marginBottom: '12px',
          border: '2px solid var(--border)'
        }}>
          <FiUser />
        </div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{user.name}</h3>
        <span className="badge badge-sky mt-2">
          <FiShield size={12} /> Verified Banay-Banay Resident
        </span>
      </div>

      {/* Profile Details Card */}
      <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ color: 'var(--color-deep-navy)' }}><FiUser size={18} /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>EMAIL ADDRESS</p>
            <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</p>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ color: 'var(--color-deep-navy)' }}><FiMapPin size={18} /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HOME ADDRESS & PROXIMITY ANCHOR</p>
            <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.address || 'Barangay Banay-Banay, Cabuyao'}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Used for privacy-first Haversine geographic distance calculations</p>
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ color: 'var(--color-deep-navy)' }}><FiPhone size={18} /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CONTACT NUMBER</p>
            <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.contact || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div 
          onClick={logout}
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem'
          }}
        >
          <FiLogOut size={18} />
          <span>Sign Out</span>
        </div>
      </div>
    </div>
  );
};

export default ResidentProfile;
