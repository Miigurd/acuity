import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMockData } from '../context/MockDataContext';
import barangaysGeoJSON from '../assets/cabuyao_barangays.json';

// Fix default marker icon issue with webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to force Leaflet to recalculate its size automatically
const MapResizer = () => {
    const map = useMap();
    React.useEffect(() => {
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });
        const container = map.getContainer();
        if (container) {
            observer.observe(container);
        }
        return () => observer.disconnect();
    }, [map]);
    return null;
};

// Banay-Banay, Cabuyao center coordinates
const BANAY_BANAY_CENTER = [14.2744, 121.1258];
const DEFAULT_ZOOM = 16;

// Custom teal pin icon
const createCustomIcon = (color = '#dc2626', size = 28) => {
    return L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="
            width: ${size}px; height: ${size}px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

// User location pin (Distinct Purple)
const userLocationIcon = createCustomIcon('#9333ea', 32);

/**
 * Reusable OpenStreetMap component centered on Banay-Banay, Cabuyao
 *
 * Props:
 * - businesses: array of business objects with lat/lng or coordinates
 * - userLocation: { lat, lng } for the user's position
 * - onClusterClick: callback when a cluster pin is clicked
 * - selectedId: ID of the currently selected landmark/business

 * - height: CSS height (default '100%')
 * - interactive: allow pan/zoom (default true)
 * - zoom: initial zoom level
 * - showControls: show zoom controls (default true)
 */
const BanayBanayMap = ({
    businesses = [],
    userLocation = null,
    onClusterClick,
    selectedId,
    height = '100%',
    interactive = true,
    zoom = DEFAULT_ZOOM,
    showControls = true,
    getCategoryById,
}) => {
    const { getLandmarkById } = useMockData();

    const toLatLng = (coords) => {
        if (!coords) return BANAY_BANAY_CENTER;
        if (coords.lat && coords.lng) return [coords.lat, coords.lng];
        const lat = BANAY_BANAY_CENTER[0] + ((50 - coords.y) / 50) * 0.004;
        const lng = BANAY_BANAY_CENTER[1] + ((coords.x - 50) / 50) * 0.005;
        return [lat, lng];
    };

    // Group businesses by landmark
    const groupedBusinesses = businesses.reduce((acc, business) => {
        const lid = business.landmarkId;
        if (lid) {
            if (!acc[lid]) acc[lid] = [];
            acc[lid].push(business);
        } else {
            // Support legacy generic marker if needed
            if (!acc['unknown']) acc['unknown'] = [];
            acc['unknown'].push(business);
        }
        return acc;
    }, {});

    const clusterMarkers = Object.entries(groupedBusinesses).map(([lid, bizList]) => {
        const landmark = getLandmarkById(lid);
        return {
            id: lid,
            position: landmark ? landmark.latLng : (bizList[0].coordinates ? toLatLng(bizList[0].coordinates) : BANAY_BANAY_CENTER),
            landmark: landmark || { id: 'unknown', name: 'Unspecified Area' },
            businesses: bizList
        };
    });

    const userPos = userLocation
        ? toLatLng(userLocation)
        : BANAY_BANAY_CENTER;

    // Center the map on the first business cluster if available, else default
    const mapCenter = clusterMarkers.length > 0 ? clusterMarkers[0].position : BANAY_BANAY_CENTER;

    return (
        <div style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={interactive}
                dragging={interactive}
                zoomControl={showControls}
                doubleClickZoom={interactive}
                touchZoom={interactive}
                attributionControl={true}
            >
                <MapResizer />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Barangay Boundaries Overlay */}
                <GeoJSON 
                    data={barangaysGeoJSON} 
                    style={(feature) => ({
                        color: feature.properties.id === selectedId ? '#dc2626' : 'transparent',
                        weight: feature.properties.id === selectedId ? 3 : 0,
                        opacity: feature.properties.id === selectedId ? 0.8 : 0,
                        fillColor: feature.properties.id === selectedId ? '#ef4444' : 'transparent',
                        fillOpacity: feature.properties.id === selectedId ? 0.2 : 0
                    })}
                />

                {/* User location marker */}
                {userLocation && (
                    <Marker position={userPos} icon={userLocationIcon}>
                        <Popup>
                            <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                                📍 You are here
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Cluster markers */}
                {clusterMarkers.map(({ id, position, landmark, businesses: clusterBiz }) => {
                    const isSelected = selectedId === id;
                    return (
                        <Marker
                            key={`cluster-${id}`}
                            position={position}
                            icon={createCustomIcon(
                                isSelected ? '#991b1b' : '#dc2626',
                                isSelected ? 34 : 26
                            )}
                            eventHandlers={{
                                click: () => onClusterClick && onClusterClick({ businesses: clusterBiz, landmark }),
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: '180px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                                        📍 In {landmark.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                        {clusterBiz.length} business{clusterBiz.length > 1 ? 'es' : ''} here
                                    </div>
                                    <ul style={{ paddingLeft: '16px', margin: '8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {clusterBiz.slice(0, 3).map(b => (
                                            <li key={b.id} style={{ marginBottom: '2px' }}>{b.name}</li>
                                        ))}
                                        {clusterBiz.length > 3 && (
                                            <li style={{ fontStyle: 'italic' }}>...and {clusterBiz.length - 3} more</li>
                                        )}
                                    </ul>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export { BANAY_BANAY_CENTER, DEFAULT_ZOOM };
export default BanayBanayMap;
