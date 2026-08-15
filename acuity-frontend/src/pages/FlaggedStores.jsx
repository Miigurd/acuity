import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertOctagon, FiArrowLeft, FiFlag, FiShield } from 'react-icons/fi';
import { useMockData } from '../context/MockDataContext';
import BusinessCard from '../components/BusinessCard';

const FlaggedStores = () => {
    const { businesses } = useMockData();
    const flaggedBusinesses = businesses.filter(b => b.flagCount && b.flagCount >= 3);

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div className="flex items-center gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
                <Link to="/" className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
                    <FiArrowLeft size={18} /> Back
                </Link>
                <div>
                    <h2 className="font-black text-2xl flex items-center gap-2" style={{ color: 'var(--danger)', letterSpacing: '-0.02em' }}>
                        <FiAlertOctagon /> Community Warning Registry
                    </h2>
                    <p className="text-secondary text-sm mt-1">
                        These profiles have received multiple community flags for inaccurate details, nonsensical descriptions, or invalid locations. They remain publicly visible for community transparency.
                    </p>
                </div>
            </div>

            {flaggedBusinesses.length === 0 ? (
                <div className="card text-center py-12 flex-col items-center">
                    <div className="text-muted mb-4 opacity-50">
                        <FiShield size={48} style={{ color: 'var(--success)' }} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">No Flagged Stores</h3>
                    <p className="text-secondary text-sm max-w-sm">
                        All registered micro-enterprises currently meet community accuracy standards.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                    {flaggedBusinesses.map(business => (
                        <BusinessCard key={business.id} business={business} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlaggedStores;
