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

// City of Cabuyao, Laguna Geographic Center
const CABUYAO_CENTER = [14.2625, 121.1280];
const DEFAULT_ZOOM = 13;

// Custom Brand Pin Icon (Deep Navy & Hero Sky Blue)
const createCustomIcon = (color = '#002991', size = 28) => {
    return L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="
            width: ${size}px; height: ${size}px;
            background: ${color};
            border: 2.5px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 10px rgba(0, 41, 145, 0.35);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

// User location pin (Distinct Cyan Glow)
const userLocationIcon = createCustomIcon('#0288d1', 32);

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
        if (!coords) return CABUYAO_CENTER;
        if (coords.lat && coords.lng) return [coords.lat, coords.lng];
        const lat = CABUYAO_CENTER[0] + ((50 - coords.y) / 50) * 0.008;
        const lng = CABUYAO_CENTER[1] + ((coords.x - 50) / 50) * 0.008;
        return [lat, lng];
    };

    // Group businesses by landmark
    const groupedBusinesses = businesses.reduce((acc, business) => {
        const lid = business.landmarkId;
        if (lid) {
            if (!acc[lid]) acc[lid] = [];
            acc[lid].push(business);
        } else {
            if (!acc['unknown']) acc['unknown'] = [];
            acc['unknown'].push(business);
        }
        return acc;
    }, {});

    const clusterMarkers = Object.entries(groupedBusinesses).map(([lid, bizList]) => {
        const landmark = getLandmarkById(lid);
        return {
            id: lid,
            position: landmark ? landmark.latLng : (bizList[0].coordinates ? toLatLng(bizList[0].coordinates) : CABUYAO_CENTER),
            landmark: landmark || { id: 'unknown', name: 'City of Cabuyao Area' },
            businesses: bizList
        };
    });

    const userPos = userLocation
        ? toLatLng(userLocation)
        : CABUYAO_CENTER;

    const mapCenter = clusterMarkers.length > 0 ? clusterMarkers[0].position : CABUYAO_CENTER;

    return (
        <div style={{ height, width: '100%', overflow: 'hidden', position: 'relative' }}>
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
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
                {barangaysGeoJSON && (
                    <GeoJSON 
                        data={barangaysGeoJSON} 
                        style={(feature) => ({
                            color: feature.properties.id === selectedId ? '#002991' : '#60cdff',
                            weight: feature.properties.id === selectedId ? 3 : 1,
                            opacity: feature.properties.id === selectedId ? 0.9 : 0.4,
                            fillColor: feature.properties.id === selectedId ? '#60cdff' : 'transparent',
                            fillOpacity: feature.properties.id === selectedId ? 0.25 : 0
                        })}
                    />
                )}

                {/* User location marker */}
                {userLocation && (
                    <Marker position={userPos} icon={userLocationIcon}>
                        <Popup>
                            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                                📍 Your Location (Cabuyao)
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
                                isSelected ? '#001a61' : '#002991',
                                isSelected ? 34 : 26
                            )}
                            eventHandlers={{
                                click: () => onClusterClick && onClusterClick({ businesses: clusterBiz, landmark }),
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: '190px' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '4px', color: 'var(--color-deep-navy)' }}>
                                        📍 {landmark.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '6px' }}>
                                        {clusterBiz.length} registered micro-enterprise{clusterBiz.length > 1 ? 's' : ''}
                                    </div>
                                    <ul style={{ paddingLeft: '16px', margin: '6px 0', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                        {clusterBiz.slice(0, 3).map(b => (
                                            <li key={b.id} style={{ marginBottom: '2px', fontWeight: 600 }}>{b.name}</li>
                                        ))}
                                        {clusterBiz.length > 3 && (
                                            <li style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>...and {clusterBiz.length - 3} more</li>
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

export { CABUYAO_CENTER, DEFAULT_ZOOM };
export default BanayBanayMap;
