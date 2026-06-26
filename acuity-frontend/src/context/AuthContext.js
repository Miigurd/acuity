import React, { createContext, useState, useContext, useEffect } from 'react';
import { LANDMARKS } from './MockDataContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

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
        name: 'Community Member',
        role: 'resident',
        landmarkId: 'brgy_banay_banay', // Default fallback
        location: null // Will store {lat, lng} of assigned landmark
    });

    // Automatically prompt for Geolocation and assign landmark
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
                (error) => {
                    console.log("Geolocation error or denied. Using default location.", error);
                    // Use Banay-Banay default
                    const defaultLandmark = LANDMARKS.find(l => l.id === 'brgy_banay_banay');
                    if (defaultLandmark) {
                        setUser(prev => ({
                            ...prev,
                            location: { lat: defaultLandmark.latLng[0], lng: defaultLandmark.latLng[1] }
                        }));
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, []);

    const login = (email, password) => {
        if (email.includes('owner')) {
            setUser(prev => ({
                ...prev,
                id: 'owner-1',
                name: 'Maria Clara',
                email,
                role: 'owner',
                businessId: 'b1'
            }));
        } else {
            setUser(prev => ({
                ...prev,
                id: 'res-1',
                name: 'Juan Dela Cruz',
                email,
                role: 'resident'
                // Maintain the assigned geolocation landmark instead of hardcoded
            }));
        }
        return true;
    };

    const register = (userData) => {
        setUser(prev => ({
            ...prev,
            id: `user-${Date.now()}`,
            ...userData
        }));
        return true;
    };

    const logout = () => {
        setUser(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isOwner: user?.role === 'owner',
        isResident: user?.role === 'resident',
        login,
        register,
        logout,
        updateProfile: (data) => setUser({ ...user, ...data })
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
