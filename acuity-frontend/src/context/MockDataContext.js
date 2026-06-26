import React, { createContext, useState, useContext, useEffect } from 'react';

const MockDataContext = createContext();

export const useMockData = () => useContext(MockDataContext);

// SVG Category Icons
const IconFood = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 11h10a4 4 0 0 1 0 8H7a4 4 0 0 1 0-8z" /><path d="M12 11V7a3 3 0 0 0-3-3" /><path d="M11 21v-2" /><path d="M15 21v-2" />
    </svg>
);
const IconCart = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
);
const IconShirt = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
);
const IconWrench = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);
const IconScissors = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12L12 12" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8L20 20" /><path d="M8.12 15.88L16 8" /><path d="M16 8l4-4" />
    </svg>
);
const IconBasket = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 10V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" /><path d="M3 10h18l-2 11H5L3 10z" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
    </svg>
);
const IconPackage = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
);

// Initial Categories
export const CATEGORIES = [
    { id: 'c1', name: 'Food & Beverages', icon: <IconFood /> },
    { id: 'c2', name: 'Sari-Sari / Convenience', icon: <IconCart /> },
    { id: 'c3', name: 'Clothing / RTW', icon: <IconShirt /> },
    { id: 'c4', name: 'Repair Services', icon: <IconWrench /> },
    { id: 'c5', name: 'Personal Care / Salon', icon: <IconScissors /> },
    { id: 'c6', name: 'Laundry', icon: <IconBasket /> },
    { id: 'c7', name: 'Other Services', icon: <IconPackage /> }
];

export const LANDMARKS = [
    { id: 'brgy_baclaran', name: 'Brgy. Baclaran', coordinates: { x: 50, y: 50 }, latLng: [14.243532, 121.170394] },
    { id: 'brgy_banay_banay', name: 'Brgy. Banay-Banay', coordinates: { x: 50, y: 50 }, latLng: [14.252638, 121.128865] },
    { id: 'brgy_banlic', name: 'Brgy. Banlic', coordinates: { x: 50, y: 50 }, latLng: [14.231575, 121.136279] },
    { id: 'brgy_bigaa', name: 'Brgy. Bigaa', coordinates: { x: 50, y: 50 }, latLng: [14.291125, 121.128817] },
    { id: 'brgy_butong', name: 'Brgy. Butong', coordinates: { x: 50, y: 50 }, latLng: [14.290013, 121.136944] },
    { id: 'brgy_casile', name: 'Brgy. Casile', coordinates: { x: 50, y: 50 }, latLng: [14.201544, 121.037061] },
    { id: 'brgy_diezmo', name: 'Brgy. Diezmo', coordinates: { x: 50, y: 50 }, latLng: [14.234170, 121.095605] },
    { id: 'brgy_gulod', name: 'Brgy. Gulod', coordinates: { x: 50, y: 50 }, latLng: [14.257778, 121.166169] },
    { id: 'brgy_mamatid', name: 'Brgy. Mamatid', coordinates: { x: 50, y: 50 }, latLng: [14.235041, 121.151889] },
    { id: 'brgy_marinig', name: 'Brgy. Marinig', coordinates: { x: 50, y: 50 }, latLng: [14.279447, 121.146396] },
    { id: 'brgy_niugan', name: 'Brgy. Niugan', coordinates: { x: 50, y: 50 }, latLng: [14.262460, 121.127596] },
    { id: 'brgy_pittland', name: 'Brgy. Pittland', coordinates: { x: 50, y: 50 }, latLng: [14.228193, 121.087130] },
    { id: 'brgy_poblacion_uno', name: 'Poblacion Uno', coordinates: { x: 50, y: 50 }, latLng: [14.280245, 121.123777] },
    { id: 'brgy_poblacion_dos', name: 'Poblacion Dos', coordinates: { x: 50, y: 50 }, latLng: [14.278503, 121.126365] },
    { id: 'brgy_poblacion_tres', name: 'Poblacion Tres', coordinates: { x: 50, y: 50 }, latLng: [14.274350, 121.123345] },
    { id: 'brgy_pulo', name: 'Brgy. Pulo', coordinates: { x: 50, y: 50 }, latLng: [14.246480, 121.130072] },
    { id: 'brgy_sala', name: 'Brgy. Sala', coordinates: { x: 50, y: 50 }, latLng: [14.271160, 121.124225] },
    { id: 'brgy_san_isidro', name: 'Brgy. San Isidro', coordinates: { x: 50, y: 50 }, latLng: [14.240714, 121.140710] }
];

// Initial mock businesses were removed. Relying purely on extracted API data.
const INITIAL_BUSINESSES = [];

export const MockDataProvider = ({ children }) => {
    const [businesses, setBusinesses] = useState(INITIAL_BUSINESSES);
    const [isLoading, setIsLoading] = useState(true);
    const categories = CATEGORIES;
    const landmarks = LANDMARKS;

    useEffect(() => {
        const fetchBackendBusinesses = async () => {
            try {
                // Fetch extracted business data from the backend
                const response = await fetch('http://localhost:5000/api/businesses');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // Check if the data is already in frontend format (has .name instead of .business_name)
                if (data.length > 0 && data[0].name !== undefined) {
                    const verifiedData = data.filter(b => b.isVerified === true || b.status === 'Verified');
                    if (verifiedData.length > 0) {
                        setBusinesses(verifiedData);
                    }
                } else {
                    // Filter raw extracted JSON from backend to only include verified records
                    const verifiedRaw = data.filter(b => b.is_verified === true || b.status === 'Verified');

                    // Map the verified backend JSON structure to the frontend structure
                    const mappedBusinesses = verifiedRaw.map((b, index) => {
                        return {
                            id: `api-b${index}`,
                            ownerId: null, // No owner mapped yet
                            name: b.name || b.business_name || 'Unknown Business',
                            categoryId: b.categoryId || b.category_id || 'c7', // Fallback to 'Other Services' only if missing
                            services: Array.isArray(b.categories) ? b.categories.filter(Boolean) : [],
                            locationType: 'Unknown',
                            address: Array.isArray(b.locations) && b.locations.length > 0 ? b.locations.filter(Boolean).join(', ') : 'Address not extracted',
                            landmarkId: null,
                            contact: Array.isArray(b.phones) && b.phones.length > 0 ? b.phones.filter(Boolean).join(', ') : '',
                            facebookUrl: '',
                            description: b.description || '',
                            operatingHours: Array.isArray(b.hours) && b.hours.length > 0 ? b.hours.filter(Boolean).join(', ') : 'Not available',
                            verifiedContact: false,
                            communityEngaged: false,
                            isActive: true,
                            stats: { impressions: 0, inquiries: 0, created: new Date().toISOString().split('T')[0] },
                            isOpen: true,
                            flagCount: b.flagCount || 0,
                            flagReasons: b.flagReasons || []
                        };
                    });

                    // Append the mapped businesses to the existing INITIAL_BUSINESSES
                    setBusinesses([...INITIAL_BUSINESSES, ...mappedBusinesses]);
                }
            } catch (error) {
                console.error("Failed to fetch backend businesses:", error);
                // If backend is not reachable, just use initial businesses
            } finally {
                setIsLoading(false);
            }
        };

        fetchBackendBusinesses();
    }, []);

    const saveToBackend = async (data) => {
        try {
            console.log("Mock frontend save disabled. Avoiding backend DB overwrite.");
        } catch (error) {
            console.error("Failed to mock save:", error);
        }
    };

    const updateBusiness = (businessId, data) => {
        const updated = businesses.map(b => {
            if (b.id === businessId) {
                const changes = {};
                // Compare new data with old data
                Object.keys(data).forEach(key => {
                    if (key !== 'id' && key !== 'ownerId' && key !== 'history' && key !== 'stats' && key !== 'flagCount' && key !== 'flagReasons') {
                        // Use JSON.stringify for safe array comparison (e.g. services)
                        if (JSON.stringify(b[key]) !== JSON.stringify(data[key])) {
                            changes[key] = { old: b[key], new: data[key] };
                        }
                    }
                });

                if (Object.keys(changes).length > 0) {
                    const historyEntry = {
                        timestamp: new Date().toISOString(),
                        changes
                    };
                    return {
                        ...b,
                        ...data,
                        history: [historyEntry, ...(b.history || [])] // Prepend newest edits
                    };
                } else {
                    return { ...b, ...data }; // No changes detected
                }
            }
            return b;
        });
        setBusinesses(updated);
        saveToBackend(updated);
    };

    const flagBusiness = async (businessId, reason) => {
        const targetBusiness = businesses.find(b => b.id === businessId);
        
        const updated = businesses.map(b => {
            if (b.id === businessId) {
                return {
                    ...b,
                    flagCount: (b.flagCount || 0) + 1,
                    flagReasons: [...(b.flagReasons || []), reason]
                };
            }
            return b;
        });
        setBusinesses(updated);
        
        if (targetBusiness) {
            try {
                await fetch('http://localhost:5000/api/businesses/flag', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: targetBusiness.name, reason })
                });
            } catch (err) {
                console.error("Failed to sync flag to backend:", err);
            }
        }
    };

    const rollbackBusiness = (businessId, targetTimestamp) => {
        const updated = businesses.map(b => {
            if (b.id === businessId && b.history) {
                // Find index of the target history entry
                const targetIndex = b.history.findIndex(entry => entry.timestamp === targetTimestamp);
                
                if (targetIndex !== -1) {
                    // We want to revert the target entry AND all entries that happened AFTER it (index 0 to targetIndex)
                    // b.history is newest-first. So elements 0 through targetIndex are the newest edits we want to undo.
                    const entriesToRevert = b.history.slice(0, targetIndex + 1);
                    
                    const revertedData = { ...b };
                    
                    // Apply the "old" values sequentially from newest back to the target
                    entriesToRevert.forEach(entry => {
                        Object.entries(entry.changes).forEach(([field, vals]) => {
                            revertedData[field] = vals.old;
                        });
                    });
                    
                    // The new history should exclude the reverted entries
                    const newHistory = b.history.slice(targetIndex + 1);
                    revertedData.history = newHistory;
                    
                    return revertedData;
                }
            }
            return b;
        });

        setBusinesses(updated);
        saveToBackend(updated);
    };

    const trackEvent = async (eventData) => {
        try {
            await fetch('http://localhost:5000/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...eventData,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error("Failed to track event:", error);
        }
    };

    const getBusinessById = (id) => businesses.find(b => String(b.id) === String(id));
    const getBusinessesByOwner = (ownerId) => businesses.filter(b => b.ownerId === ownerId);
    const getCategoryById = (id) => categories.find(c => c.id === id);
    const getLandmarkById = (id) => landmarks.find(l => l.id === id);

    // Calculate real-world distance using Haversine formula (km)
    const calculateDistance = (coord1, coord2) => {
        if (!coord1 || !coord2) return null;
        
        // coord1 and coord2 should be {lat, lng} or array [lat, lng]
        const lat1 = coord1.lat !== undefined ? coord1.lat : (Array.isArray(coord1) ? coord1[0] : null);
        const lon1 = coord1.lng !== undefined ? coord1.lng : (Array.isArray(coord1) ? coord1[1] : null);
        const lat2 = coord2.lat !== undefined ? coord2.lat : (Array.isArray(coord2) ? coord2[0] : null);
        const lon2 = coord2.lng !== undefined ? coord2.lng : (Array.isArray(coord2) ? coord2[1] : null);

        if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;

        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance.toFixed(1); // Return string "X.X"
    };

    const value = {
        businesses,
        categories,
        landmarks,
        updateBusiness,
        flagBusiness,
        rollbackBusiness,
        trackEvent,
        getBusinessById,
        getBusinessesByOwner,
        getCategoryById,
        getLandmarkById,
        calculateDistance,
        isLoading
    };

    return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
};
