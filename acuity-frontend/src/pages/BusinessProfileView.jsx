import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { FiArrowLeft, FiMapPin, FiClock, FiPhoneCall, FiMessageCircle, FiCheckCircle, FiInfo, FiFlag, FiAlertTriangle, FiEdit2, FiX, FiRotateCcw, FiShield } from 'react-icons/fi';
import BanayBanayMap from '../components/BanayBanayMap';
import { useToast } from '../context/ToastContext';

const BusinessProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCategoryById, getLandmarkById, flagBusiness, trackEvent } = useMockData();
  const { showToast } = useToast();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFlagSection, setShowFlagSection] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [showFullMap, setShowFullMap] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (showFullMap) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    }
  }, [showFullMap]);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/businesses/${id}`);
        if (!response.ok) {
          throw new Error('Business not found');
        }
        const data = await response.json();
        setBusiness(data);
        
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-12 flex-col items-center justify-center text-center" style={{ minHeight: '50vh' }}>
        <p className="text-muted font-medium">Loading store profile...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="container py-12 flex-col items-center justify-center text-center" style={{ minHeight: '50vh' }}>
        <h2 className="font-bold text-2xl mb-4">Business Not Found</h2>
        <p className="text-muted mb-6">The business you are looking for does not exist in the Cabuyao directory or has been removed.</p>
        <Link to="/search" className="btn btn-primary">Back to Directory</Link>
      </div>
    );
  }

  const category = getCategoryById(business.categoryId);
  const landmark = getLandmarkById(business.landmarkId);
  const isFlagged = business.flagCount >= 3;

  const handleFlagSubmit = () => {
    if (!flagReason) return;
    if (!window.confirm("Are you sure you want to flag this business? This action will alert the community.")) return;
    flagBusiness(business.id, flagReason);
    setShowFlagSection(false);
    setFlagReason('');
    showToast('Thank you for reporting. The community has been alerted.', 'success');
  };

  const handleRollback = async (timestamp) => {
    const confirmRollback = window.confirm("Are you sure you want to rollback to this version? All newer edits will be undone permanently.");
    if (confirmRollback) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/businesses/${business.id}/rollback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp })
        });
        
        if (response.ok) {
          showToast('Successfully rolled back to previous version.', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast('Failed to rollback. Please try again.', 'error');
        }
      } catch (error) {
        console.error("Error rolling back:", error);
      }
    }
  };

  const handleClaim = async () => {
    if (!window.confirm("Are you the owner? A secure verification PIN will be sent to the contact number on this profile.")) return;
    setClaiming(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/businesses/${business.id}/claim`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setBusiness(prev => ({ ...prev, pin_locked: true }));
      } else {
        showToast(data.error || 'Failed to claim profile.', 'error');
      }
    } catch (err) {
      showToast('Network error while claiming.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Back navigation & Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-hero-sky) 0%, var(--color-deep-navy) 100%)',
        borderRadius: 'var(--radius-card-lg)',
        padding: '2.5rem 2rem',
        marginBottom: '1.5rem',
        color: '#ffffff',
        position: 'relative',
        boxShadow: 'var(--shadow-card)'
      }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-sm"
          style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', marginBottom: '1.25rem' }}
        >
          <FiArrowLeft size={16} /> Back
        </button>

        <div>
          {category && (
            <span className="badge" style={{ background: '#ffffff', color: 'var(--color-deep-navy)', marginBottom: '10px' }}>
              {category.icon} {category.name}
            </span>
          )}
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {business.name}
          </h1>
          <div className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 600, flexWrap: 'wrap' }}>
            <FiMapPin />
            <span>{landmark ? `In ${landmark.name}, City of Cabuyao` : 'City of Cabuyao, Laguna'}</span>
            <span>•</span>
            <span>{business.locationType || 'Local Store'}</span>
          </div>
        </div>
      </div>

      {/* Community Warning Banner */}
      {isFlagged && (
        <div style={{
          background: 'var(--error-bg)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '12px'
        }}>
          <FiAlertTriangle style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} size={22} />
          <div>
            <h3 style={{ fontWeight: 800, color: 'var(--danger)' }}>Community Safety Warning</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              This profile has been flagged {business.flagCount} times by residents for inaccurate info or invalid location. Please exercise caution.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons: Call & Message */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {((business.phones && business.phones.length > 0) || business.contact_info || business.contact) ? (
          <a 
            href={`tel:${(business.phones && business.phones.length > 0) ? business.phones[0] : (business.contact_info || business.contact)}`} 
            onClick={() => trackEvent && trackEvent({ eventType: 'inquiry', businessName: business.name })}
            className="btn btn-primary flex-1"
            style={{ padding: '14px 20px', fontSize: '1rem' }}
          >
            <FiPhoneCall size={18} /> Call Business
          </a>
        ) : (
          <button disabled className="btn btn-secondary flex-1" style={{ opacity: 0.6, cursor: 'not-allowed', padding: '14px 20px' }}>
            <FiPhoneCall size={18} /> No Phone Listed
          </button>
        )}

        {business.facebookUrl ? (
          <a 
            href={business.facebookUrl} 
            target="_blank" 
            rel="noreferrer" 
            onClick={() => trackEvent && trackEvent({ eventType: 'inquiry', businessName: business.name })}
            className="btn btn-outline flex-1"
            style={{ padding: '14px 20px', fontSize: '1rem' }}
          >
            <FiMessageCircle size={18} /> Send Message
          </a>
        ) : (
          <button disabled className="btn btn-outline flex-1" style={{ opacity: 0.6, cursor: 'not-allowed', padding: '14px 20px' }}>
            <FiMessageCircle size={18} /> No Facebook Page
          </button>
        )}
      </div>

      {/* Quick Action Pills: Edit, Claim, Flag */}
      <div className="card mb-6 flex justify-between items-center flex-wrap gap-4" style={{ padding: '14px 20px' }}>
        <Link to={`/business/${business.id}/edit`} className="chip" style={{ textDecoration: 'none' }}>
          <FiEdit2 /> Edit / Suggest Update
        </Link>
        
        {!business.pin_locked ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="chip"
            style={{ color: 'var(--success)' }}
          >
            <FiCheckCircle /> {claiming ? 'Verifying...' : 'Claim as Store Owner'}
          </button>
        ) : (
          <span className="badge badge-success">
            <FiCheckCircle /> Owner Verified
          </span>
        )}

        <button
          onClick={() => {
            setShowFlagSection(true);
            setTimeout(() => document.getElementById('flag-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}
          className="chip"
          style={{ color: 'var(--danger)' }}
        >
          <FiFlag /> Report Store
        </button>
      </div>

      {/* Information Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
        {/* About & Hours */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiInfo style={{ color: 'var(--color-deep-navy)' }} /> About Enterprise
          </h3>
          <p className="text-secondary text-sm mb-4" style={{ lineHeight: 1.6 }}>
            {business.description || 'No detailed description available yet.'}
          </p>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex items-start gap-3">
              <FiClock className="text-navy" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>OPERATING HOURS</span>
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {(business.hours && business.hours.length > 0) ? business.hours.join(', ') : (business.operatingHours || 'Schedule not specified')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FiPhoneCall className="text-navy" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>CONTACT DETAILS</span>
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {(business.phones && business.phones.length > 0) ? business.phones.join(', ') : (business.contact_info || business.contact || 'No contact on file')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services & Community Trust */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px' }}>
            Services & Trust Status
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {business.services && business.services.length > 0 ? (
              business.services.map((service, idx) => (
                <span key={idx} className="badge badge-sky">
                  {service}
                </span>
              ))
            ) : (
              <span className="text-muted text-sm italic">General merchandise & community services.</span>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              COMMUNITY TRUST SIGNALS
            </span>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <FiCheckCircle style={{ color: 'var(--success)' }} /> Verified in City of Cabuyao Registry
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FiShield style={{ color: 'var(--color-deep-navy)' }} /> Anchored to {landmark ? landmark.name : 'Barangay Landmark'}
            </div>
            {business.verifiedContact && (
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <FiCheckCircle style={{ color: 'var(--success)' }} /> Verified Contact Number
              </div>
            )}
            {business.communityEngaged && (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FiCheckCircle style={{ color: 'var(--success)' }} /> Active Community Member
              </div>
            )}
          </div>

          <button onClick={() => setShowFullMap(true)} className="btn btn-outline btn-sm mt-4" style={{ width: '100%' }}>
            <FiMapPin /> Open on Map
          </button>
        </div>
      </div>

      {/* Edit History Section */}
      {business.history && business.history.length > 0 && (
        <div className="card mt-6" style={{ background: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiClock className="text-primary" /> Edit History Log
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border)' }}></div>
            {business.history.map((entry, index) => (
              <div key={index} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--color-sky-tint)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-deep-navy)' }}>
                  <FiEdit2 size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {new Date((entry.timestamp && !entry.timestamp.endsWith('Z') && !entry.timestamp.includes('+')) ? entry.timestamp + 'Z' : entry.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <button
                      onClick={() => handleRollback(entry.timestamp)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      title="Undo this edit and all newer edits"
                    >
                      <FiRotateCcw size={12} style={{ marginRight: '4px' }} /> Rollback
                    </button>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', border: `1px solid var(--border)`, padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {entry.previous_data ? (() => {
                      const ALLOWED_HISTORY_FIELDS = [
                        'name', 'business_name', 'categories', 'category_id', 'categoryId',
                        'locationType', 'description', 'services', 'phones', 'contact_info',
                        'contact', 'facebookUrl', 'landmarkId', 'landmark_id', 'hours', 'operatingHours'
                      ];
                      
                      const nextState = index === 0 ? business : business.history[index - 1].previous_data;
                      
                      const changedFields = Object.entries(entry.previous_data)
                        .filter(([field]) => ALLOWED_HISTORY_FIELDS.includes(field))
                        .map(([field, oldVal]) => {
                          const newVal = nextState[field] || nextState.raw?.[field] || nextState[field.replace('_', '')] || "None";
                          return { field, oldVal, newVal };
                        })
                        .filter(({ oldVal, newVal }) => {
                          const formatVal = (v) => {
                            if (Array.isArray(v)) return v.join(', ');
                            if (typeof v === 'boolean') return v ? 'Yes' : 'No';
                            if (v && typeof v === 'object') return JSON.stringify(v);
                            return String(v || 'None');
                          };
                          return formatVal(oldVal) !== formatVal(newVal);
                        });

                      if (changedFields.length === 0) {
                        return (
                          <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>Snapshot Saved</span>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>A complete database backup of the profile was captured.</p>
                          </div>
                        );
                      }

                      return changedFields.map(({ field, oldVal }) => {
                        const formatVal = (v) => {
                          if (Array.isArray(v)) return v.join(', ');
                          if (typeof v === 'boolean') return v ? 'Yes' : 'No';
                          if (v && typeof v === 'object') return JSON.stringify(v);
                          return v || 'None';
                        };
                        return (
                          <div key={field} style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--color-deep-navy)' }}>
                              Previous {field.replace(/([A-Z_])/g, ' $1').replace('_', '').trim()}:
                            </span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                              {formatVal(oldVal)}
                            </span>
                          </div>
                        );
                      });
                    })() : (
                      <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-deep-navy)' }}>Snapshot Saved</span>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>A complete database backup of the profile was captured.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flag Report Section */}
      {showFlagSection && (
        <div id="flag-section" className="card mt-6" style={{ border: '1px solid rgba(220, 38, 38, 0.3)', background: 'var(--error-bg)' }}>
          <div className="flex justify-between items-center mb-3">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiFlag /> Report an Issue with this Profile
            </h3>
            <button onClick={() => setShowFlagSection(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
              <FiX size={20} />
            </button>
          </div>
          <p className="text-secondary text-sm mb-4">
            Help keep the Cabuyao micro-enterprise directory accurate. Select the reason for your report:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {['Inaccurate location or barangay', 'Invalid contact number', 'Store is permanently closed', 'Spam or fake profile'].map(reason => (
              <label
                key={reason}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: 'var(--radius-card)',
                  background: flagReason === reason ? '#ffffff' : 'var(--bg-surface)',
                  border: `1.5px solid ${flagReason === reason ? 'var(--danger)' : 'var(--border)'}`,
                  cursor: 'pointer', fontSize: '0.88rem', fontWeight: flagReason === reason ? 700 : 500
                }}
              >
                <input
                  type="radio"
                  name="flagReason"
                  value={reason}
                  checked={flagReason === reason}
                  onChange={(e) => setFlagReason(e.target.value)}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
          <button
            disabled={!flagReason}
            onClick={handleFlagSubmit}
            className="btn btn-primary btn-sm"
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: '#ffffff' }}
          >
            Submit Report
          </button>
        </div>
      )}

      {/* Map Modal */}
      {showFullMap && createPortal(
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' 
          }}
        >
          <div 
            style={{ 
              width: '90vw', maxWidth: '1000px', height: '80vh',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card-lg)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
            }}
          >
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--border)', gap: '12px' }}>
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <FiMapPin className="text-navy" style={{ flexShrink: 0 }} /> Map Location: {business.name}
              </h3>
              <button 
                onClick={() => setShowFullMap(false)}
                className="btn btn-secondary btn-sm"
              >
                <FiX size={20} /> Close
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <BanayBanayMap 
                businesses={[business]} 
                interactive={true} 
                showControls={true}
                selectedId={business.landmarkId}
                height="100%"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BusinessProfileView;
