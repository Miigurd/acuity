import React from 'react';
import { FiEye, FiMousePointer, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';

const BusinessAnalyticsDashboard = ({ stats }) => {
  if (!stats) return null;

  const { impressions, clicks, inquiries, created } = stats;
  
  // Prevent division by zero
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : 0;
  const iqr = clicks > 0 ? ((inquiries / clicks) * 100).toFixed(1) : 0;

  return (
    <div className="analytics-dashboard" style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FiTrendingUp className="text-primary" /> Performance Metrics
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Track how community residents are interacting with your profile.
        {created && <span> Profile created on: {created}</span>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Impressions */}
        <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <FiEye className="text-blue-500" /> Total Views
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {impressions.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Times appeared in search</div>
        </div>

        {/* Clicks */}
        <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <FiMousePointer className="text-amber-500" /> Profile Clicks
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {clicks.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click-through rate: {ctr}%</div>
        </div>

        {/* Inquiries */}
        <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
            <FiMessageSquare className="text-green-500" /> Contact Info Views
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {inquiries.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conversion rate: {iqr}%</div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalyticsDashboard;
