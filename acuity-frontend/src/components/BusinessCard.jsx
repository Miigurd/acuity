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

    const handleClick = () => {
        if (trackEvent) {
            trackEvent({
                eventType: 'click',
                businessName: business.name
            });
        }
    };

    return (
        <Link
            to={`/business/${business.id}`}
            onClick={handleClick}
            style={{
                display: 'block',
                minWidth: '280px',
                maxWidth: '340px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: 'var(--shadow-sm)', // Add a subtle default shadow
            }}
            className="biz-card-link card card-interactive"
        >
            {/* Recommended Badge */}
            {recommended && !isFlagged && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)',
                    background: 'rgba(220, 38, 38, 0.1)', padding: '4px 12px',
                    borderRadius: '9999px', marginBottom: '10px',
                }}>
                    <FiZap size={12} /> Recommended for You
                </div>
            )}

            {/* Flagged Badge */}
            {isFlagged && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)',
                    background: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px',
                    borderRadius: '9999px', marginBottom: '10px', marginRight: '6px'
                }}>
                    <FiAlertTriangle size={12} /> Community Warning
                </div>
            )}

            {/* Relevance Score Badge with XAI Insights */}
            {business.relevance_score !== undefined && (
                <div 
                    onMouseEnter={() => setShowXAI(true)}
                    onMouseLeave={() => setShowXAI(false)}
                    style={{
                        position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)',
                        background: 'rgba(34, 197, 94, 0.1)', padding: '4px 12px',
                        borderRadius: '9999px', marginBottom: '10px', marginRight: '6px',
                        cursor: 'help'
                    }}
                >
                    Relevance: {Math.round((business.final_score || business.relevance_score) * 100)}% <FiInfo size={12} />
                    
                    {showXAI && (
                        <div style={{
                            position: 'absolute', top: '100%', left: '0', marginTop: '8px', zIndex: 50,
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: '12px', width: '240px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)', color: 'var(--text-primary)',
                            fontSize: '0.75rem', fontWeight: 400, cursor: 'default'
                        }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--primary)' }}>AI Recommendation Breakdown</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>Text Match (TF-IDF):</span>
                                <strong>{Math.round(business.relevance_score * 100)}%</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                <span>Proximity ({business.distance_km != null ? business.distance_km : 'N/A'} km):</span>
                                <strong>{Math.round((business.proximity_score || 0) * 100)}%</strong>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                <span>Final Score:</span>
                                <span>{Math.round((business.final_score || business.relevance_score) * 100)}%</span>
                            </div>
                            <div style={{ marginTop: '6px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                Formula: (Text × 0.6) + (Proximity × 0.4)
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
                        lineHeight: 1.3, marginBottom: '6px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {business.name}
                    </h3>
                    {category && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.65rem', fontWeight: 600, color: 'var(--primary)',
                            background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)',
                            padding: '3px 10px', borderRadius: '9999px',
                        }}>
                            {category.icon} {category.name}
                        </span>
                    )}
                </div>
                <div style={{
                    width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(220, 38, 38, 0.08)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: 'var(--primary)', marginLeft: '10px',
                }}>
                    <FiArrowUpRight size={16} />
                </div>
            </div>

            {/* Landmark Anchor instead of raw distance */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.78rem', color: isFlagged ? 'var(--danger-light)' : 'var(--text-secondary)', fontWeight: 500, marginBottom: '8px',
            }}>
                <FiMapPin style={{ color: isFlagged ? 'var(--danger)' : 'var(--primary)', flexShrink: 0 }} size={13} />
                <span>{landmark ? `In ${landmark.name}` : 'Unspecified Area'}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>·</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{business.locationType}</span>
            </div>

            {/* Description */}
            <p style={{
                fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '10px',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
                {business.description}
            </p>

            {/* Service Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                {business.services.slice(0, 3).map((service, idx) => (
                    <span key={idx} style={{
                        fontSize: '0.65rem', padding: '3px 8px', borderRadius: '9999px',
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)', fontWeight: 500,
                    }}>
                        {service}
                    </span>
                ))}
                {business.services.length > 3 && (
                    <span style={{
                        fontSize: '0.65rem', padding: '3px 8px', borderRadius: '9999px',
                        background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                    }}>
                        +{business.services.length - 3}
                    </span>
                )}
            </div>

            {/* Footer */}
            {isFlagged ? (
                <div style={{
                    paddingTop: '10px', borderTop: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--danger)' }}>
                        Flagged {business.flagCount} times. Reasons:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {business.flagReasons && [...new Set(business.flagReasons)].slice(0, 2).map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div style={{
                    paddingTop: '10px', borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {business.verifiedContact && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.65rem', fontWeight: 600, color: 'var(--success)',
                                background: 'rgba(34, 197, 94, 0.1)', padding: '3px 8px', borderRadius: '9999px',
                            }}>
                                <FiCheckCircle size={11} /> Verified
                            </span>
                        )}
                        {business.communityEngaged && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.65rem', fontWeight: 600, color: 'var(--secondary)',
                                background: 'rgba(99, 102, 241, 0.1)', padding: '3px 8px', borderRadius: '9999px',
                            }}>
                                Community
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)' }}>
                        View →
                    </span>
                </div>
            )}
        </Link>
    );
};

export default BusinessCard;
