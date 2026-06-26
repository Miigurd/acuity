import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { FiSave, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const EditBusinessProfile = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const { categories, landmarks, updateBusiness } = useMockData();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingBusiness, setExistingBusiness] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successNav, setSuccessNav] = useState('/');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    services: '',
    locationType: 'Stall-based',
    address: '',
    contact: '',
    facebookUrl: '',
    description: '',
    operatingHours: '',
    verifiedContact: false,
    communityEngaged: false,
    isOpen: true,
    landmarkId: '',
    coordinates: { x: 50, y: 50 }
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/businesses/${id}`);
        if (!response.ok) {
          throw new Error('Business not found');
        }
        const data = await response.json();
        setExistingBusiness(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  useEffect(() => {
    if (existingBusiness) {
      setFormData({
        ...existingBusiness,
        name: existingBusiness.name || existingBusiness.business_name || '',
        contact: (existingBusiness.phones && existingBusiness.phones.length > 0) ? existingBusiness.phones[0] : (existingBusiness.contact_info || existingBusiness.contact || ''),
        address: existingBusiness.address || '',
        operatingHours: (existingBusiness.hours && existingBusiness.hours.length > 0) ? existingBusiness.hours.join(', ') : (existingBusiness.operatingHours || ''),
        services: ((existingBusiness.services && existingBusiness.services.length > 0) ? existingBusiness.services : (existingBusiness.categories || [])).join(', ')
      });
    }
  }, [existingBusiness]);

  /* Auto-navigate after modal is shown */
  useEffect(() => {
    if (!showSuccessModal) return;
    const t = setTimeout(() => navigate(successNav), 2500);
    return () => clearTimeout(t);
  }, [showSuccessModal, successNav, navigate]);

  if (loading) {
    return (
      <div className="container py-12 flex-col items-center justify-center text-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-muted font-medium">Loading editor...</p>
      </div>
    );
  }

  if (error || !existingBusiness) {
    return (
      <div className="container py-12 flex-col items-center justify-center text-center h-[50vh]">
        <h2 className="font-bold text-2xl mb-4 text-text-primary">Business Not Found</h2>
        <p className="text-muted mb-6">The business you are trying to edit could not be found.</p>
        <button onClick={() => navigate('/search')} className="btn btn-primary">Back to Search</button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };


  const isValid = formData.name.trim() !== '' && formData.landmarkId !== '' && (formData.contact.trim() !== '' || formData.services.trim() !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    const businessData = {
      ...existingBusiness,
      name: formData.name,
      business_name: formData.name,
      categoryId: formData.categoryId,
      landmarkId: formData.landmarkId,
      services: formData.services.split(',').map(s => s.trim()).filter(Boolean),
      locationType: formData.locationType,
      address: formData.address,
      contact: formData.contact,
      contact_info: formData.contact,
      phones: [formData.contact],
      hours: [formData.operatingHours],
      description: formData.description,
      ownerId: existingBusiness ? existingBusiness.ownerId : (user ? user.id : 'anonymous')
    };

    if (existingBusiness) {
      try {
        const response = await fetch('http://localhost:5000/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([businessData])
        });

        if (response.ok) {
          setSuccessMsg('Your corrections have been saved. Thank you for keeping the directory accurate!');
          setSuccessNav(`/business/${existingBusiness.id}`);
          setShowSuccessModal(true);
        } else {
          const errData = await response.json();
          alert(errData.error || 'Failed to save edits to server.');
        }
      } catch (err) {
        console.error('Error saving edits:', err);
      }
    }
  };

  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-2xl">Edit Core Information</h2>
          <p className="text-sm text-secondary mt-1">
            Our directory is community-driven. Help keep this profile accurate.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-col gap-6">

        {/* Basic Info */}
        <div className="card">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Basic Information</h3>

          <div className="input-group">
            <label className="input-label">Business Name</label>
            <input required type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Category</label>
              <select required name="categoryId" className="input-field" value={formData.categoryId} onChange={handleChange}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Location Type</label>
              <select name="locationType" className="input-field" value={formData.locationType} onChange={handleChange}>
                <option value="Stall-based">Stall-based (Commercial)</option>
                <option value="Home-based">Home-based (Residential)</option>
                <option value="Mobile/Roving">Mobile / Roving</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea required name="description" className="input-field" rows="3" placeholder="Tell residents what your business is about..." value={formData.description} onChange={handleChange}></textarea>
          </div>

          <div className="input-group">
            <label className="input-label">Services Offered (comma separated)</label>
            <input required type="text" name="services" className="input-field" placeholder="e.g. Vulcanizing, Oil Change, Car Wash" value={formData.services} onChange={handleChange} />
          </div>
        </div>

        {/* Contact & Location */}
        <div className="card">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Contact &amp; Location</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Contact Number</label>
              <input required type="tel" name="contact" className="input-field" placeholder="09XX XXX XXXX" value={formData.contact} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">Facebook Page / Link (Optional)</label>
              <input type="url" name="facebookUrl" className="input-field" placeholder="https://facebook.com/..." value={formData.facebookUrl} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="input-group">
              <label className="input-label">Landmark Anchor</label>
              <select required name="landmarkId" className="input-field" value={formData.landmarkId} onChange={handleChange}>
                <option value="">Select Nearest Landmark</option>
                {landmarks.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">Used to group businesses instead of specific GPS points.</p>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Operating Hours</label>
            <input type="text" name="operatingHours" className="input-field" placeholder="e.g. 8:00 AM - 5:00 PM, Mon-Sat" value={formData.operatingHours} onChange={handleChange} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Community Trust Indicators</h3>
          <p className="text-sm text-secondary mb-4">Check the items that apply to your business. This builds trust with residents.</p>

          <label className="flex items-center gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-[--background]">
            <input type="checkbox" name="verifiedContact" className="w-5 h-5 accent-primary" checked={formData.verifiedContact} onChange={handleChange} />
            <div>
              <p className="font-semibold flex items-center gap-1"><FiCheckCircle className="text-success" /> Verified Contact</p>
              <p className="text-xs text-muted">I confirm the contact number provided is active and reachable.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-[--background]">
            <input type="checkbox" name="communityEngaged" className="w-5 h-5 accent-primary" checked={formData.communityEngaged} onChange={handleChange} />
            <div>
              <p className="font-semibold flex items-center gap-1"><FiCheckCircle className="text-success" /> Community Member</p>
              <p className="text-xs text-muted">I actively participate or engage with the Barangay community.</p>
            </div>
          </label>
        </div>

        <div className="card bg-primary/5 border-primary/20 mb-6">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
            <FiAlertCircle /> Data Quality Check
          </h3>
          <ul className="text-sm list-disc pl-5 text-secondary flex-col gap-1">
            <li className={formData.name.trim() ? "text-success font-medium" : ""}>Must have a Business Name</li>
            <li className={formData.landmarkId ? "text-success font-medium" : ""}>Must be anchored to a Landmark</li>
            <li className={(formData.contact.trim() || formData.services.trim()) ? "text-success font-medium" : ""}>Must include either a Contact Number or list of Services</li>
          </ul>
        </div>

        <button type="submit" disabled={!isValid} className="btn btn-primary btn-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
          <FiSave /> Save Corrections
        </button>
      </form>

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div
          onClick={() => navigate(successNav)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            animation: 'fade-in-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem 2rem',
              maxWidth: '380px', width: '100%',
              boxShadow: 'var(--shadow-lg), 0 0 60px var(--primary-glow)',
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
              boxShadow: '0 0 30px var(--primary-glow)',
            }}>
              <FiCheckCircle size={36} style={{ color: 'var(--primary)' }} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Corrections Saved!
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {successMsg}
            </p>

            {/* Countdown progress bar */}
            <div style={{ height: '3px', borderRadius: '9999px', background: 'var(--bg-elevated)', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '9999px',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                animation: 'progress-drain 2.5s linear forwards',
              }} />
            </div>

            <button
              onClick={() => navigate(successNav)}
              className="btn btn-primary btn-full"
              style={{ fontSize: '0.95rem' }}
            >
              View Profile
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress-drain {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default EditBusinessProfile;
