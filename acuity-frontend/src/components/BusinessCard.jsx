import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiCheckCircle, FiZap, FiArrowUpRight, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useMockData } from '../context/MockDataContext';

const BusinessCard = ({ business, distance, recommended }) => {
    const { getCategoryById, getLandmarkById, trackEvent } = useMockData();
    const [showXAI, setShowXAI] = React.useState(false);
    const category = getCategoryById(business.categoryId);
    const landmark = getLandmarkById(business.landmarkId);

    const isFlagged = business.flagCount >= 3;

    return (
        <Link
            to={`/business/${business.id}`}
            onClick={() => trackEvent && trackEvent('business_click', { businessId: business.id, name: business.name })}
            style={{ display: 'block', minWidth: '280px', maxWidth: '340px' }}
            className="biz-card-link card glass-card animate-float-in card-interactive"
        >
            {/* Recommended Badge */}
            {recommended && !isFlagged && (
                <div className="badge badge-primary mb-3">
                    <FiZap size={12} /> Recommended for You
                </div>
            )}

            {/* Flagged Badge */}
            {isFlagged && (
                <div className="badge badge-danger mb-3 mr-2">
                    <FiAlertTriangle size={12} /> Community Warning
                </div>
            )}

            {/* Relevance Score Badge with XAI Insights */}
            {business.relevance_score !== undefined && (
                <div 
                    onMouseEnter={() => setShowXAI(true)}
                    onMouseLeave={() => setShowXAI(false)}
                    className="badge badge-success mb-3 mr-2"
                    style={{ position: 'relative', cursor: 'help' }}
                >
                    Relevance: {Math.round((business.final_score || business.relevance_score) * 100)}% <FiInfo size={12} />
                    
                    {showXAI && (
                        <div style={{
                            position: 'absolute', top: '100%', left: '0', marginTop: '8px', zIndex: 50,
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)', width: '240px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)', color: 'var(--text-primary)',
                            fontSize: 'var(--font-size-xs)', fontWeight: 400, cursor: 'default',
                            whiteSpace: 'normal', textAlign: 'left'
                        }}>
                            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: 'var(--spacing-2)', color: 'var(--primary)' }}>AI Recommendation Breakdown</h4>
                            <div className="flex justify-between mb-1">
                                <span>Text Match (TF-IDF):</span>
                                <span className="font-bold">{Math.round(business.relevance_score * 100)}%</span>
                            </div>
                            <div className="flex justify-between mb-2 text-secondary">
                                <span>Proximity ({business.distance_km != null ? business.distance_km : 'N/A'} km):</span>
                                <span className="font-bold">{Math.round((business.proximity_score || 0) * 100)}%</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                <span>Final Score:</span>
                                <span>{Math.round((business.final_score || business.relevance_score) * 100)}%</span>
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: '0.65rem' }}>
                                Formula: (Text × 0.6) + (Proximity × 0.4)
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1" style={{ minWidth: 0 }}>
                    <h3 style={{
                        fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)',
                        lineHeight: 1.3, marginBottom: 'var(--spacing-1)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {business.name}
                    </h3>
                    {category && (
                        <span className="badge badge-primary">
                            {category.icon} {category.name}
                        </span>
                    )}
                </div>
                <div style={{
                    width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(217, 45, 32, 0.08)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: 'var(--primary)', marginLeft: 'var(--spacing-3)',
                }}>
                    <FiArrowUpRight size={16} />
                </div>
            </div>

            {/* Landmark Anchor instead of raw distance */}
            <div className="flex items-center gap-2 mb-2" style={{
                fontSize: 'var(--font-size-sm)', color: isFlagged ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 500
            }}>
                <FiMapPin className={isFlagged ? 'text-danger' : 'text-primary'} style={{ flexShrink: 0 }} size={14} />
                <span>{landmark ? `In ${landmark.name}` : 'Unspecified Area'}</span>
                <span className="text-muted">·</span>
                <span className="text-muted">{business.locationType}</span>
            </div>

            {/* Description */}
            <p className="text-secondary mb-4" style={{
                fontSize: 'var(--font-size-sm)', lineHeight: 1.6,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
                {business.description}
            </p>

            {/* Service Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {business.services.slice(0, 3).map((service, idx) => (
                    <span key={idx} style={{
                        fontSize: 'var(--font-size-xs)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)', fontWeight: 500,
                    }}>
                        {service}
                    </span>
                ))}
                {business.services.length > 3 && (
                    <span style={{
                        fontSize: 'var(--font-size-xs)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                    }}>
                        +{business.services.length - 3}
                    </span>
                )}
            </div>

            {/* Footer */}
            {isFlagged ? (
                <div className="flex flex-col pt-3" style={{ borderTop: '1px solid var(--border)', gap: 'var(--spacing-1)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--danger)' }}>
                        Flagged {business.flagCount} times. Reasons:
                    </span>
                    <ul className="text-muted" style={{ margin: 0, paddingLeft: '16px', fontSize: 'var(--font-size-xs)' }}>
                        {business.flagReasons && [...new Set(business.flagReasons)].slice(0, 2).map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex flex-wrap items-center gap-2">
                        {business.verifiedContact && (
                            <span className="badge badge-success">
                                <FiCheckCircle size={12} /> Verified
                            </span>
                        )}
                        {business.communityEngaged && (
                            <span className="badge badge-secondary">
                                Community
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--primary)' }}>
                        View →
                    </span>
                </div>
            )}
        </Link>
    );
};

export default BusinessCard;
