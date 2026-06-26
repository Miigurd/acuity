import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertOctagon, FiArrowLeft, FiFlag } from 'react-icons/fi';
import { useMockData } from '../context/MockDataContext';
import BusinessCard from '../components/BusinessCard';

const FlaggedStores = () => {
    const { businesses } = useMockData();
    const flaggedBusinesses = businesses.filter(b => b.flagCount && b.flagCount >= 3);

    return (
        <div className="container py-8">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-full hover:bg-[--bg-surface] text-[--text-secondary] transition-colors">
                    <FiArrowLeft size={24} />
                </Link>
                <div>
                    <h2 className="font-bold text-2xl flex items-center gap-2 text-danger">
                        <FiAlertOctagon /> Community Flagged Stores
                    </h2>
                    <p className="text-secondary text-sm mt-1">
                        These profiles have been reported by multiple residents as inaccurate, nonsensical, or invalid.
                        They remain visible for transparency so you can exercise your own judgment.
                    </p>
                </div>
            </div>

            {flaggedBusinesses.length === 0 ? (
                <div className="card text-center py-12 flex-col items-center">
                    <div className="text-muted mb-4 opacity-50">
                        <FiFlag size={48} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">No Flagged Profiles</h3>
                    <p className="text-secondary text-sm">
                        The community has not flagged any stores that reached the warning threshold.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flaggedBusinesses.map(business => (
                        <BusinessCard key={business.id} business={business} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlaggedStores;
