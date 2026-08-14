import React, { createContext, useState, useContext, useEffect } from 'react';
import { LANDMARKS } from './MockDataContext';

const AuthContext = createContext();

const defaultAuthContext = {
    user: {
        id: 'anonymous-resident',
        name: 'Community Resident',
        role: 'resident',
        landmarkId: 'brgy_banay_banay',
        location: { lat: 14.252638, lng: 121.128865 }
    },
    isAuthenticated: false,
    isOwner: false,
    isResident: true,
    login: () => true,
    register: () => true,
    logout: () => {},
    updateProfile: () => {}
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    return context || defaultAuthContext;
};

// Standard Haversine formula for distance in km
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const findNearestLandmark = (lat, lng) => {
    let nearest = null;
    let minDistance = Infinity;

    LANDMARKS.forEach(landmark => {
        const [lLat, lLng] = landmark.latLng;
        const dist = haversine(lat, lng, lLat, lLng);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = landmark;
        }
    });

    return nearest;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({
        id: 'anonymous-resident',
        name: 'Community Resident',
        role: 'resident',
        landmarkId: 'brgy_banay_banay',
        location: { lat: 14.252638, lng: 121.128865 }
    });

    // Automatically assign nearest landmark via geolocation if permitted
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const nearest = findNearestLandmark(latitude, longitude);
                    
                    if (nearest) {
                        setUser(prev => ({
                            ...prev,
                            landmarkId: nearest.id,
                            location: { lat: nearest.latLng[0], lng: nearest.latLng[1] },
                            address: nearest.name
                        }));
                    }
                },
                () => {
                    // Fallback to City of Cabuyao (Banay-Banay default)
                    const defaultLandmark = LANDMARKS.find(l => l.id === 'brgy_banay_banay');
                    if (defaultLandmark) {
                        setUser(prev => ({
                            ...prev,
                            location: { lat: defaultLandmark.latLng[0], lng: defaultLandmark.latLng[1] }
                        }));
                    }
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
            );
        }
    }, []);

    const value = {
        user,
        isAuthenticated: false,
        isOwner: false,
        isResident: true,
        login: () => true,
        register: () => true,
        logout: () => {},
        updateProfile: (data) => setUser(prev => ({ ...prev, ...data }))
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
