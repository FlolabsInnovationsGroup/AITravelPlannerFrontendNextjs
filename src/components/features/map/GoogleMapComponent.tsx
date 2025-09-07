import React, { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, LoadScript, LoadScriptProps } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Location, LocationType } from "@/types/map";
import SearchBox from "./SearchBox";
import MapErrorBoundary from "./MapErrorBoundary";

// Helper function to get marker color based on location type
const getMarkerColor = (type?: LocationType): string => {
    switch (type) {
        case 'hotel':
            return '#4A90E2';  // Blue
        case 'restaurant':
            return '#F5A623';  // Orange
        case 'cafe':
            return '#7ED321';  // Green
        case 'transport':
            return '#9013FE';  // Purple
        case 'attraction':
        default:
            return '#D0021B';  // Red
    }
};

interface GoogleMapComponentProps {
    locations: Location[];
    onLocationAdd?: (location: Location) => void;
    onLocationSelect?: (location: Location) => void;
}

// Define libraries array and ensure it has the correct types
const libraries: LoadScriptProps["libraries"] = ["places", "geocoding"];

// Define map styles
const mapContainerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "500px",
    position: "relative" as const,
};

const defaultCenter = {
    lat: 48.8566, // Paris coordinates as default
    lng: 2.3522,
};

const GoogleMapComponentBase: React.FC<GoogleMapComponentProps> = ({ 
    locations, 
    onLocationAdd, 
    onLocationSelect 
}) => {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);

    // Cleanup function to remove markers and clusterer
    const cleanupMarkers = useCallback(() => {
        if (markersRef.current) {
            markersRef.current.forEach(marker => {
                marker.setMap(null);
            });
            markersRef.current = [];
        }
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }
    }, []);

    // Update markers when locations change
    useEffect(() => {
        if (!map || !locations) return;

        cleanupMarkers();

        const bounds = new google.maps.LatLngBounds();
        const newMarkers: google.maps.Marker[] = locations.map(location => {
            const position = {
                lat: location.latitude,
                lng: location.longitude
            };

            bounds.extend(position);

            const marker = new google.maps.Marker({
                position,
                map,
                title: location.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: getMarkerColor(location.type),
                    fillOpacity: 0.9,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF',
                    scale: 8,
                }
            });

            // Add click listener to marker
            marker.addListener('click', () => {
                if (onLocationSelect) {
                    onLocationSelect(location);
                }
            });

            return marker;
        });

        markersRef.current = newMarkers;

        // Create a new MarkerClusterer
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }
        clustererRef.current = new MarkerClusterer({
            map,
            markers: newMarkers
        });

        // Adjust bounds if there are markers
        if (newMarkers.length > 0) {
            map.fitBounds(bounds);
            // Prevent over-zooming for single locations
            const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
                if (newMarkers.length === 1 && map.getZoom() && map.getZoom()! > 15) {
                    map.setZoom(15);
                }
                google.maps.event.removeListener(listener);
            });
        }

        return () => {
            cleanupMarkers();
        };
    }, [map, locations, onLocationSelect, cleanupMarkers]);

    const handleLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        setIsMapLoaded(true);
    }, []);

    const handleUnmount = useCallback(() => {
        setMap(null);
        cleanupMarkers();
    }, [cleanupMarkers]);

    if (loadError) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">Error loading Google Maps: {loadError.message}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-sm text-gray-600">Loading Google Maps...</p>
                    </div>
                </div>
            )}
            
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={13}
                onLoad={handleLoad}
                onUnmount={handleUnmount}
                options={{
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    zoomControl: true,
                    gestureHandling: 'cooperative',
                }}
            >
                <SearchBox 
                    map={map}
                    onPlaceSelected={(place) => {
                        if (onLocationAdd && place) {
                            onLocationAdd({
                                id: Date.now().toString(),
                                name: place.name || '',
                                latitude: place.geometry?.location?.lat() || 0,
                                longitude: place.geometry?.location?.lng() || 0,
                                type: 'attraction',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            });
                        }
                    }}
                />
            </GoogleMap>
        </div>
    );
};

// Wrap the component with error boundary
const GoogleMapComponent = (props: GoogleMapComponentProps) => (
    <MapErrorBoundary>
        <GoogleMapComponentBase {...props} />
    </MapErrorBoundary>
);

export default GoogleMapComponent;
