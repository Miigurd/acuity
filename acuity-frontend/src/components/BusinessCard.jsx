import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiCheckCircle, FiZap, FiArrowUpRight, FiAlertTriangle, FiInfo, FiTag } from 'react-icons/fi';
import { useMockData } from '../context/MockDataContext';

const BusinessCard = ({ business, distance, recommended }) => {
    const { getCategoryById, getLandmarkById, trackEvent } = useMockData();
    const [showXAI, setShowXAI] = useState(false);
    const category = getCategoryById(business.categoryId);
    const landmark = getLandmarkById(business.landmarkId);

    const isFlagged = business.flagCount >= 3;

    return (
        <Link
            to={`/business/${business.id}`}
            onClick={() => trackEvent && trackEvent({ eventType: 'click', businessName: business.name })}
            style={{ display: 'block', minWidth: '290px', maxWidth: '360px', textDecoration: 'none' }}
            className="biz-card-link card card-interactive"
        >
            {/* Header Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Pill */}
                    {category && (
                        <span className="badge badge-sky">
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                        </span>
                    )}

                    {/* Recommended Badge */}
                    {recommended && !isFlagged && (
                        <span className="badge badge-primary">
                            <FiZap size={11} /> Top Pick
                        </span>
                    )}
                </div>

                {/* Flagged Badge */}
                {isFlagged && (
                    <span className="badge badge-danger">
                        <FiAlertTriangle size={11} /> Flagged
                    </span>
                )}
            </div>

            {/* Relevance Score Badge with XAI Insights (for search results) */}
            {business.relevance_score !== undefined && (
                <div 
                    onMouseEnter={() => setShowXAI(true)}
                    onMouseLeave={() => setShowXAI(false)}
                    onClick={(e) => { e.preventDefault(); setShowXAI(!showXAI); }}
                    className="badge badge-success mb-3"
                    style={{ position: 'relative', cursor: 'help', display: 'inline-flex', width: 'fit-content' }}
                >
                    Match: {Math.round((business.final_score || business.relevance_score) * 100)}% <FiInfo size={11} />
                    
                    {showXAI && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 8px)', left: '0', zIndex: 60,
                            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
                            borderRadius: 'var(--radius-card)', padding: '14px', width: '250px',
                            boxShadow: 'var(--shadow-card-hover)', color: 'var(--text-primary)',
                            fontSize: '0.78rem', fontWeight: 400, cursor: 'default',
                            textAlign: 'left'
                        }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-deep-navy)' }}>
                                ML Recommendation Formula
                            </h4>
                            <div className="flex justify-between mb-1 text-secondary">
                                <span>TF-IDF Text Match:</span>
                                <span className="font-bold">{Math.round(business.relevance_score * 100)}%</span>
                            </div>
                            <div className="flex justify-between mb-2 text-secondary">
                                <span>Proximity ({business.distance_km != null ? business.distance_km : 'Local'} km):</span>
                                <span className="font-bold">{Math.round((business.proximity_score || 0) * 100)}%</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                <span>Final Blend:</span>
                                <span className="text-primary">{Math.round((business.final_score || business.relevance_score) * 100)}%</span>
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: '0.68rem', lineHeight: 1.3 }}>
                                Score = (TF-IDF × 0.6) + (Proximity × 0.4)
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Business Title & Verified Status */}
            <div className="mb-2">
                <h3 style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.02em'
                }}>
                    {business.name}
                </h3>

                {business.description && (
                    <p style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        {business.description}
                    </p>
                )}
            </div>

            {/* Location & Landmark Metadata */}
            <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '12px'
            }}>
                <FiMapPin style={{ color: 'var(--color-deep-navy)', flexShrink: 0 }} size={13} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {distance ? `${distance} km away` : ''} {landmark ? `• Near ${landmark.name}` : '• Brgy. Banay-Banay'}
                </span>
            </div>

            {/* Service Tags */}
            {business.tags && business.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                    {business.tags.slice(0, 3).map((tag, idx) => (
                        <span 
                            key={idx}
                            style={{
                                fontSize: '0.7rem',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-pill)',
                                color: 'var(--text-secondary)',
                                fontWeight: 500
                            }}
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Card Footer */}
            <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem'
            }}>
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <FiCheckCircle size={12} /> Community Listed
                </span>
                <span style={{ color: 'var(--color-deep-navy)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    View Profile <FiArrowUpRight size={13} />
                </span>
            </div>
        </Link>
    );
};

export default BusinessCard;
