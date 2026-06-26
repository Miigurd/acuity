import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMapPin, FiLogOut, FiEdit2, FiSettings, FiPhone } from 'react-icons/fi';

const ResidentProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="container py-6 max-w-2xl mx-auto">
      <h2 className="font-bold text-2xl mb-6">My Profile</h2>

      <div className="card mb-6 flex-col items-center text-center py-8">
        <div className="w-24 h-24 bg-[--background] rounded-full flex items-center justify-center text-primary mb-4 border-4 border-[--border]">
          <FiUser size={40} />
        </div>
        <h3 className="font-bold text-xl">{user.name}</h3>
        <span className="badge badge-secondary mt-2">Resident Account</span>
      </div>

      <div className="card mb-6 p-0 divide-y divide-[--border]">
        <div className="p-4 flex items-start gap-4 hover:bg-[--background] transition-colors cursor-pointer">
          <div className="mt-1 text-primary"><FiUser /></div>
          <div className="mt-1 text-primary"><FiUser /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary">Email Address</p>
            <p className="text-primary-text">{user.email}</p>
          </div>
          <FiEdit2 className="text-muted" />
        </div>

        <div className="p-4 flex items-start gap-4 hover:bg-[--background] transition-colors cursor-pointer">
          <div className="mt-1 text-primary"><FiMapPin /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary">Home Address</p>
            <p className="text-primary-text">{user.address || 'Barangay Banay-Banay'}</p>
            <p className="text-xs text-muted mt-1">Used to calculate distance to businesses</p>
          </div>
          <FiEdit2 className="text-muted" />
        </div>

        <div className="p-4 flex items-start gap-4 hover:bg-[--background] transition-colors cursor-pointer">
          <div className="mt-1 text-primary"><FiPhone /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary">Contact Number</p>
            <p className="text-primary-text">{user.contact || 'Not provided'}</p>
          </div>
          <FiEdit2 className="text-muted" />
        </div>
      </div>

      <div className="card p-0 divide-y divide-[--border] mb-8">
        <div className="p-4 flex items-center gap-4 hover:bg-[--background] transition-colors cursor-pointer">
          <div className="text-secondary"><FiSettings /></div>
          <div className="flex-1 font-semibold">Account Settings</div>
        </div>
        <div className="p-4 flex items-center gap-4 cursor-pointer text-[--error] hover:bg-[#FFEBEE] transition-colors" onClick={logout}>
          <div><FiLogOut /></div>
          <div className="flex-1 font-semibold">Log Out</div>
        </div>
      </div>
    </div>
  );
};

export default ResidentProfile;
