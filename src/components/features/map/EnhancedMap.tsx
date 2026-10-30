'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, OverlayView } from '@react-google-maps/api';
import { Location } from '@/types/map';
import { Layers, Sun, Moon, Navigation, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  professionalMapStyles, 
  professionalMapStylesDark, 
  professionalMapOptions
  // clusterStyles // Unused import
} from './ProfessionalMapStyles';
import ProfessionalMarker from './ProfessionalMarker';

interface EnhancedMapProps {
  locations: Location[];
  onLocationAdd?: (location: Location) => void;
  onLocationSelect?: (location: Location) => void;
  selectedLocation?: Location | null;
  showLabels?: boolean;
  darkMode?: boolean;
  className?: string;
}

const EnhancedMap: React.FC<EnhancedMapProps> = ({
  locations,
  onLocationAdd,
  onLocationSelect,
  selectedLocation,
  showLabels = false,
  darkMode = false,
  className = ''
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(darkMode);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMapControls, setShowMapControls] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  // const clustererRef = useRef<MarkerClusterer | null>(null); // Unused variable

  // Map configuration
  const mapOptions = {
    ...professionalMapOptions,
    styles: isDarkMode ? professionalMapStylesDark : professionalMapStyles,
    disableDefaultUI: true, // We'll add custom controls
  };

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const defaultCenter = {
    lat: 40.7128,
    lng: -74.0060 // New York as default
  };

  // Calculate map bounds to fit all locations
  const getMapBounds = useCallback(() => {
    if (!locations.length || !map) return null;

    const bounds = new google.maps.LatLngBounds();
    locations.forEach(location => {
      bounds.extend({ lat: location.latitude, lng: location.longitude });
    });
    return bounds;
  }, [locations, map]);

  // Fit map to show all locations
  const fitMapToLocations = useCallback(() => {
    if (!map || !locations.length) return;

    const bounds = getMapBounds();
    if (bounds) {
      map.fitBounds(bounds, {
        top: 80,
        right: 80,
        bottom: 80,
        left: 80
      });
    }
  }, [map, locations, getMapBounds]);

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsMapLoaded(true);
    
    // Add click listener for adding new locations
    mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng && onLocationAdd) {
        const newLocation: Location = {
          id: `custom-${Date.now()}`,
          name: 'New Location',
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
          type: 'attraction'
        };
        onLocationAdd(newLocation);
      }
    });
  }, [onLocationAdd]);

  // Handle marker selection
  const handleMarkerClick = useCallback((location: Location) => {
    setSelectedMarkerId(location.id || null);
    onLocationSelect?.(location);
    
    // Center map on selected location
    if (map) {
      map.panTo({ lat: location.latitude, lng: location.longitude });
    }
  }, [map, onLocationSelect]);

  // Map control functions
  const zoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() || 10;
      map.setZoom(currentZoom + 1);
    }
  };

  const zoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 10;
      map.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const toggleFullscreen = () => {
    if (mapRef.current) {
      if (!document.fullscreenElement) {
        mapRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const recenterMap = () => {
    if (locations.length > 0) {
      fitMapToLocations();
    } else if (map) {
      map.setCenter(defaultCenter);
      map.setZoom(10);
    }
  };

  // Fit to locations when they change
  useEffect(() => {
    if (locations.length > 0) {
      const timer = setTimeout(() => {
        fitMapToLocations();
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [locations, fitMapToLocations]);

  return (
    <div className={`relative h-full w-full ${className}`} ref={mapRef}>
      <LoadScript 
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        libraries={['places', 'geometry']}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={locations.length > 0 ? undefined : defaultCenter}
          zoom={locations.length > 0 ? undefined : 10}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Render professional markers */}
          {locations.map((location) => (
            <OverlayView
              key={location.id}
              position={{ lat: location.latitude, lng: location.longitude }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <ProfessionalMarker
                location={location}
                onClick={() => handleMarkerClick(location)}
                isSelected={selectedMarkerId === location.id || selectedLocation?.id === location.id}
                showLabel={showLabels}
                size="medium"
              />
            </OverlayView>
          ))}
        </GoogleMap>

        {/* Custom Map Controls */}
        {isMapLoaded && showMapControls && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {/* Map Style Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun size={16} className="text-yellow-600" />
              ) : (
                <Moon size={16} className="text-gray-600" />
              )}
            </Button>

            {/* Zoom Controls */}
            <div className="flex flex-col bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md shadow-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-none border-b border-gray-200"
                onClick={zoomIn}
              >
                <ZoomIn size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-none"
                onClick={zoomOut}
              >
                <ZoomOut size={14} />
              </Button>
            </div>

            {/* Recenter Button */}
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white"
              onClick={recenterMap}
              title="Fit to locations"
            >
              <Navigation size={16} />
            </Button>

            {/* Fullscreen Button */}
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white"
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
            >
              <Maximize2 size={16} />
            </Button>
          </div>
        )}

        {/* Location Count Badge */}
        {locations.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Layers size={14} />
              <span>{locations.length} location{locations.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </LoadScript>
    </div>
  );
};

export default EnhancedMap;