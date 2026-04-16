'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/types/map';
import { getMarkerConfig } from './ProfessionalMapMarkers';
import RichLocationPopup from './RichLocationPopup';
import { getTileUrl } from './MapThemes';

export interface RouteData {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: { lat: number; lng: number }[];
  travelMode?: string;
}

interface LeafletMapProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  className?: string;
  theme?: string;
  routeData?: RouteData | null;
  onRouteRendered?: (result: any) => void;
}

function createDivIcon(location: Location, isSelected = false): L.DivIcon {
  const config = getMarkerConfig(location.type, location);
  const scale = config.scale * (isSelected ? 1.3 : 1.0);
  const size = Math.round(32 * scale);

  return L.divIcon({
    className: 'leaflet-custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${config.background};
        border: 2px solid ${config.borderColor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: ${Math.round(14 * scale)}px;
          line-height: 1;
        ">${config.emoji || '📍'}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FitBoundsUpdater({ locations }: { locations: Location[] }) {
  const map = useMap();
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (locations.length === 0) {
      prevLengthRef.current = 0;
      return;
    }

    const validLocations = locations.filter(
      (loc) =>
        loc.latitude >= -90 && loc.latitude <= 90 &&
        loc.longitude >= -180 && loc.longitude <= 180,
    );

    if (validLocations.length === 0) return;

    const bounds = L.latLngBounds(
      validLocations.map((loc) => [loc.latitude, loc.longitude] as [number, number]),
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    prevLengthRef.current = locations.length;
  }, [locations, map]);

  return null;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  locations,
  onLocationSelect,
  className = '',
  theme = 'modern',
  routeData = null,
  onRouteRendered,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filteredLocationCount, setFilteredLocationCount] = useState(0);
  // react-leaflet can throw "Map container is already initialized" in dev (e.g. React strict-mode)
  // if multiple mounts reuse the same underlying Leaflet container. Give each mount a unique id.
  const [leafletContainerId] = useState(() => `leaflet-map-${Math.random().toString(36).slice(2)}`);

  const getLocationUid = useCallback((loc: Location) => {
    // Prefer backend-provided Mongo id, but fall back to coords (works even if websocket payload lacks `id`).
    if (loc.id) return loc.id;
    return `${loc.latitude},${loc.longitude}`;
  }, []);

  const filteredLocations = useMemo(() => {
    const result = locations.filter((location) => {
      // Always require valid coordinate range for rendering.
      if (location.latitude < -90 || location.latitude > 90) return false;
      if (location.longitude < -180 || location.longitude > 180) return false;

      // If backend provides coords/id but no name, still render the marker.
      if (!location.name) return true;
      const name = location.name.toLowerCase();
      const irrelevantKeywords = [
        'world avenue', 'built for', 'standing atelier', 'faires stuart',
        'engineering mv', 'the heart', 'completed', 'avocats',
      ];
      const isIrrelevant =
        irrelevantKeywords.some((kw) => name.includes(kw)) ||
        name.length < 3 ||
        !!name.match(/^[a-z\s]{1,2}$/);
      return !isIrrelevant;
    });
    return result;
  }, [locations]);

  useEffect(() => {
    setFilteredLocationCount(Math.max(0, locations.length - filteredLocations.length));
  }, [locations.length, filteredLocations.length]);

  const initialCenter = useMemo<[number, number]>(() => {
    const candidates = filteredLocations.filter(
      (loc) => loc.latitude >= -90 && loc.latitude <= 90 && loc.longitude >= -180 && loc.longitude <= 180,
    );
    if (candidates.length > 0) {
      return [candidates[0].latitude, candidates[0].longitude];
    }
    return [40.7589, -73.9851]; // fallback NYC
  }, [filteredLocations]);

  const routePositions = useMemo<[number, number][]>(() => {
    if (!routeData) return [];
    const pts: [number, number][] = [];
    pts.push([routeData.origin.lat, routeData.origin.lng]);
    if (routeData.waypoints) {
      routeData.waypoints.forEach((wp) => pts.push([wp.lat, wp.lng]));
    }
    pts.push([routeData.destination.lat, routeData.destination.lng]);
    return pts;
  }, [routeData]);

  useEffect(() => {
    if (routeData && onRouteRendered && routePositions.length >= 2) {
      onRouteRendered({ positions: routePositions });
    }
  }, [routeData, onRouteRendered, routePositions]);

  const handleMarkerClick = useCallback(
    (location: Location) => {
      setSelectedLocation(location);
      onLocationSelect?.(location);
    },
    [onLocationSelect],
  );

  const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  if (!geoapifyKey) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-8">
          <div className="text-gray-500 mb-2">🗺️</div>
          <div className="text-gray-600">Geoapify API key not configured</div>
        </div>
      </div>
    );
  }

  const hasMarkers = filteredLocations.length > 0;
  const hasRoute = routePositions.length >= 2;

  if (!hasMarkers && !hasRoute) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className} w-full`}>
        <div className="text-center p-8">
          <div className="text-gray-500 mb-2">🗺️</div>
          <div className="text-gray-700 font-medium">
            Ask in chat to view locations on the map.
          </div>
          <div className="text-gray-500 text-sm mt-1">
            For example: “Show me Paris” or “Find restaurants near London”.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        key={leafletContainerId}
        id={leafletContainerId}
        center={initialCenter}
        zoom={12}
        className="w-full h-full min-h-[400px]"
        style={{ borderRadius: '8px', zIndex: 0 }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url={getTileUrl(theme, geoapifyKey)}
          attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; OpenStreetMap contributors'
          maxZoom={20}
        />

        {/* Fit to what we actually display on the map */}
        <FitBoundsUpdater locations={filteredLocations} />

        {filteredLocations.map((location) => {
          if (
            location.latitude < -90 || location.latitude > 90 ||
            location.longitude < -180 || location.longitude > 180
          ) {
            return null;
          }

          const locationUid = getLocationUid(location);
          const selectedUid = selectedLocation ? getLocationUid(selectedLocation) : null;
          const isSelected = selectedUid === locationUid;
          const icon = createDivIcon(location, isSelected);

          return (
            <Marker
              key={locationUid}
              position={[location.latitude, location.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(location),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{location.name || 'Unknown'}</strong>
                  {location.type && (
                    <div className="text-xs text-gray-500 capitalize mt-1">
                      {location.type.replace('_', ' ')}
                    </div>
                  )}
                  {location.rating && (
                    <div className="text-xs text-yellow-600 mt-1">
                      ⭐ {location.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#4285F4',
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>

      {selectedLocation && (
        <RichLocationPopup
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}

      {filteredLocationCount > 0 && (
        <div className="absolute bottom-16 right-4 bg-orange-50 border border-orange-200 rounded-lg shadow-lg p-2 max-w-xs z-[1000]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-orange-600 mr-1 text-sm">🚫</div>
              <div className="text-xs">
                <span className="font-medium text-orange-800">
                  {filteredLocationCount} irrelevant location{filteredLocationCount > 1 ? 's' : ''} hidden
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilteredLocationCount(0)}
              className="ml-2 text-orange-700 hover:text-orange-900 text-xs font-bold"
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2 text-xs text-gray-600 z-[1000]">
        {locations.length} locations
      </div>
    </div>
  );
};

export default LeafletMap;
