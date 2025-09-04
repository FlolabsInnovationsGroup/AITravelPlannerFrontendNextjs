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

const GoogleMapComponentBase = React.memo<GoogleMapComponentProps>(({ 
    locations, 
    onLocationAdd, 
    onLocationSelect 
}) => {
    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log('🔄 Map Component State:', {
            isMapReady,
            isLoading,
            hasLoadError: !!loadError,
            scriptLoaded: googleScriptLoaded,
            hasMapRef: !!mapRef.current,
            locationsCount: locations.length
        });
    }, [isMapReady, isLoading, loadError, googleScriptLoaded, locations]);

    console.log('GoogleMapComponent render:', { isLoading, isMapReady, hasError: !!loadError });

    // Clear all existing markers and clusterer
    const clearMarkers = useCallback(() => {
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }
        markersRef.current.forEach((marker) => {
            marker.setMap(null);
        });
        markersRef.current = [];
    }, []);

    // Add markers to the map with clustering
    const addMarkers = useCallback(() => {
        if (!mapRef.current) {
            console.warn("Map reference is null. Skipping marker addition.");
            return;
        }

        const markers: google.maps.Marker[] = [];
        
        locations.forEach((location) => {
            if (location.latitude && location.longitude) {
                const marker = new google.maps.Marker({
                    position: { lat: location.latitude, lng: location.longitude },
                    title: location.name || "",
                    label: {
                        text: location.type?.[0]?.toUpperCase() || "A",
                        color: "#FFFFFF"
                    },
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: getMarkerColor(location.type),
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#FFFFFF",
                        scale: 10
                    }
                });

                if (onLocationSelect) {
                    marker.addListener('click', () => onLocationSelect(location));
                }
                markers.push(marker);
            }
        });

        markersRef.current = markers;

        // Clear existing clusterer
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        // Create new clusterer
        clustererRef.current = new MarkerClusterer({
            map: mapRef.current,
            markers: markers
        });
    }, [locations, onLocationSelect]);

    // Effect to handle markers when locations change
    useEffect(() => {
        if (!isMapReady) return;
        clearMarkers();
        addMarkers();
    }, [locations, isMapReady, clearMarkers, addMarkers]);

    // Handle map load
    const handleMapLoad = useCallback((map: google.maps.Map) => {
        console.log("🗺️ Map loaded successfully");
        console.log("🔧 Map instance:", map ? "Present" : "Missing");
        mapRef.current = map;
        setIsMapReady(true);
        setIsLoading(false);
    }, []);

    // Handle map unmount
    const handleMapUnmount = useCallback(() => {
        clearMarkers();
        mapRef.current = null;
        setIsMapReady(false);
    }, [clearMarkers]);

    // Verify Google Maps API key
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            setLoadError(new Error('Google Maps API key is missing'));
        }
    }, []);

    const handlePlaceSelected = useCallback((place: google.maps.places.PlaceResult) => {
        if (place.geometry?.location && onLocationAdd) {
            const newLocation: Location = {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                name: place.name || "",
                type: place.types?.includes('lodging') ? 'hotel' :
                      place.types?.includes('restaurant') ? 'restaurant' :
                      place.types?.includes('cafe') ? 'cafe' :
                      place.types?.includes('transit_station') ? 'transport' :
                      'attraction'
            };
            onLocationAdd(newLocation);
        }
    }, [onLocationAdd]);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log('🔑 Google Maps API Key status:', apiKey ? 'Present' : 'Missing');

    if (!apiKey) {
        console.error("🚨 Google Maps API key is missing");
        return (
            <div className="flex items-center justify-center h-full bg-yellow-50">
                <p className="text-yellow-600">Google Maps API key is missing</p>
            </div>
        );
    }

    if (loadError) {
        console.error("Google Maps load error:", loadError);
        return (
            <div className="flex items-center justify-center h-full bg-red-50">
                <div className="text-center p-4">
                    <p className="text-red-600 mb-2">Failed to load Google Maps</p>
                    <p className="text-sm text-red-500">{loadError.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-sm text-gray-600">Loading Google Maps...</p>
                    </div>
                </div>
            )}
            <LoadScript
                googleMapsApiKey={apiKey}
                libraries={libraries}
                loadingElement={
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                }
                onLoad={() => {
                    console.log("🟢 LoadScript loaded successfully");
                    console.log("📚 Libraries loaded:", libraries);
                    setGoogleScriptLoaded(true);
                    setIsLoading(false);
                }}
                onError={(error) => {
                    console.error("🔴 LoadScript error:", error);
                    console.error("🔑 API Key present:", !!apiKey);
                    console.error("📚 Libraries:", libraries);
                    setLoadError(error);
                    setGoogleScriptLoaded(false);
                    setIsLoading(false);
                }}
                onUnmount={() => {
                    console.log("🔄 LoadScript unmounting");
                    setGoogleScriptLoaded(false);
                }}
            >
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={locations.length > 0 ? { 
                        lat: locations[0].latitude, 
                        lng: locations[0].longitude 
                    } : defaultCenter}
                    zoom={locations.length > 0 ? 10 : 2}
                    onLoad={handleMapLoad}
                    onUnmount={handleMapUnmount}
                    options={{
                        fullscreenControl: true,
                        streetViewControl: true,
                        mapTypeControl: true,
                        zoomControl: true
                    }}
                >
                    <SearchBox onPlaceSelected={handlePlaceSelected} />
                </GoogleMap>
            </LoadScript>
        </div>
    );
});

GoogleMapComponentBase.displayName = 'GoogleMapComponentBase';

// Wrap component with error boundary
const GoogleMapComponent: React.FC<GoogleMapComponentProps> = (props) => (
    <MapErrorBoundary>
        <GoogleMapComponentBase {...props} />
    </MapErrorBoundary>
);

export default GoogleMapComponent;
