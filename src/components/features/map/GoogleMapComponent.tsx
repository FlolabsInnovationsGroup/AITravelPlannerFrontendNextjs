import React, { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, LoadScript, LoadScriptProps } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Location, LocationType } from "@/types/map";
import SearchBox from "./SearchBox";
import MapErrorBoundary from "./MapErrorBoundary";
import LocationInfoWindow from "./LocationInfoWindow";
import WeatherOverlay from "./WeatherOverlay";
import RoutePanel from "./RoutePanel";
import MapControls from "./MapControls";

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
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isWeatherVisible, setIsWeatherVisible] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    // Initialize Places Service when map loads
    useEffect(() => {
        if (map) {
            placesServiceRef.current = new google.maps.places.PlacesService(map);
            infoWindowRef.current = new google.maps.InfoWindow();
        }
    }, [map]);

    // Function to enrich location with Google Places data
    const enrichLocationData = useCallback(async (location: Location): Promise<Location> => {
        if (!placesServiceRef.current || !location.name) return location;

        return new Promise((resolve) => {
            // First try to find the place
            const request: google.maps.places.TextSearchRequest = {
                query: `${location.name} ${location.vicinity || ''}`,
                location: new google.maps.LatLng(location.latitude, location.longitude),
                radius: 1000,
            };

            placesServiceRef.current!.textSearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    const place = results[0];
                    
                    // Get detailed information
                    const detailsRequest: google.maps.places.PlaceDetailsRequest = {
                        placeId: place.place_id!,
                        fields: [
                            'name', 'rating', 'user_ratings_total', 'price_level',
                            'opening_hours', 'formatted_phone_number', 'website',
                            'vicinity', 'photos', 'place_id'
                        ]
                    };

                    placesServiceRef.current!.getDetails(detailsRequest, (details, detailsStatus) => {
                        if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && details) {
                            const enrichedLocation: Location = {
                                ...location,
                                rating: details.rating,
                                userRatingsTotal: details.user_ratings_total,
                                priceLevel: details.price_level as 1 | 2 | 3 | 4,
                                phoneNumber: details.formatted_phone_number,
                                website: details.website,
                                vicinity: details.vicinity,
                                placeId: details.place_id,
                                isOpen: details.opening_hours?.isOpen(),
                                photos: details.photos?.slice(0, 3).map(photo => 
                                    photo.getUrl({ maxWidth: 400, maxHeight: 300 })
                                ) || []
                            };
                            resolve(enrichedLocation);
                        } else {
                            resolve(location);
                        }
                    });
                } else {
                    resolve(location);
                }
            });
        });
    }, []);

    // Handle marker click to show enhanced info window
    const handleMarkerClick = useCallback(async (location: Location, marker: google.maps.Marker) => {
        if (!infoWindowRef.current) return;

        // Close any existing info window
        infoWindowRef.current.close();

        // Enrich location data if not already enriched
        const enrichedLocation = location.photos && location.photos.length > 0 
            ? location 
            : await enrichLocationData(location);

        setSelectedLocation(enrichedLocation);

        // Create info window content
        const contentDiv = document.createElement('div');
        contentDiv.style.maxWidth = '320px';
        
        // We'll render the React component into this div
        import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(contentDiv);
            root.render(
                React.createElement(LocationInfoWindow, {
                    location: enrichedLocation,
                    onGetDirections: (loc) => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
                        window.open(url, '_blank');
                    },
                    onClose: () => {
                        infoWindowRef.current?.close();
                        setSelectedLocation(null);
                    }
                })
            );
        });

        infoWindowRef.current.setContent(contentDiv);
        infoWindowRef.current.open(map, marker);

        // Call the original onLocationSelect callback
        if (onLocationSelect) {
            onLocationSelect(enrichedLocation);
        }
    }, [enrichLocationData, map, onLocationSelect]);

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
        if (infoWindowRef.current) {
            infoWindowRef.current.close();
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

            // Add click listener to marker for enhanced info window
            marker.addListener('click', () => {
                handleMarkerClick(location, marker);
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
            // Prevent over-zooming for all locations (not just single ones)
            const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
                const currentZoom = map.getZoom();
                if (currentZoom) {
                    // For single locations, limit to zoom 15
                    if (newMarkers.length === 1 && currentZoom > 15) {
                        map.setZoom(15);
                    }
                    // For multiple locations, prevent over-zooming when they're close together
                    else if (newMarkers.length > 1 && currentZoom > 14) {
                        map.setZoom(14);
                    }
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

    // Fullscreen functionality
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    // Handle escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        if (isFullscreen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Always ensure body can scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
        };
    }, [isFullscreen]);

    // Emergency cleanup on component unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
        };
    }, []);

    if (loadError) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">Error loading Google Maps: {loadError.message}</p>
            </div>
        );
    }

    const mapContent = (
        <div className="relative w-full h-full">
            {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-sm text-gray-600">Loading Google Maps...</p>
                    </div>
                </div>
            )}
            
            {/* Map Controls - Organized in top-right corner */}
            <MapControls 
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                isWeatherVisible={isWeatherVisible}
                onToggleWeather={() => setIsWeatherVisible(!isWeatherVisible)}
                locations={locations}
            />
            
            <LoadScript
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                libraries={libraries}
                onError={setLoadError}
            >
                <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={13}
                onLoad={handleLoad}
                onUnmount={handleUnmount}
                options={{
                    // Simplified controls to avoid overlap
                    fullscreenControl: false,
                    mapTypeControl: false, // Temporarily disabled to avoid overlap
                    streetViewControl: false, // Temporarily disabled
                    zoomControl: true,
                    scaleControl: false, // Disabled to reduce clutter
                    rotateControl: false, // Disabled to reduce clutter
                    gestureHandling: 'cooperative',
                    
                    // Travel-friendly styling
                    styles: [
                        {
                            featureType: 'poi.business',
                            stylers: [{ visibility: 'on' }]
                        },
                        {
                            featureType: 'transit',
                            stylers: [{ visibility: 'on' }]
                        }
                    ],
                    
                    disableDefaultUI: false,
                    clickableIcons: true,
                    keyboardShortcuts: true
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
            </LoadScript>
            
            {/* Weather Overlay */}
            <WeatherOverlay 
                locations={locations}
                isVisible={isWeatherVisible}
                onToggleVisibility={() => setIsWeatherVisible(!isWeatherVisible)}
            />
            
            {/* Route Optimization Panel - hide in fullscreen for cleaner view */}
            {!isFullscreen && (
                <RoutePanel 
                    locations={locations}
                    map={map}
                    onLocationAdd={onLocationAdd}
                    onRouteChange={(route) => {
                        if (route) {
                            console.log('Route optimized:', route);
                        }
                    }}
                />
            )}
        </div>
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-white">
                {mapContent}
            </div>
        );
    }

    return mapContent;
};

// Memoize the base component to prevent unnecessary re-renders
const MemoizedGoogleMapComponentBase = React.memo(GoogleMapComponentBase, (prevProps, nextProps) => {
    // Compare locations array by reference first (most common case)
    if (prevProps.locations === nextProps.locations) {
        return true;
    }
    
    // If arrays are different references, compare by length and contents
    if (prevProps.locations.length !== nextProps.locations.length) {
        return false;
    }
    
    // Compare each location by ID (assuming locations have stable IDs)
    for (let i = 0; i < prevProps.locations.length; i++) {
        if (prevProps.locations[i].id !== nextProps.locations[i].id ||
            prevProps.locations[i].latitude !== nextProps.locations[i].latitude ||
            prevProps.locations[i].longitude !== nextProps.locations[i].longitude) {
            return false;
        }
    }
    
    return true;
});

// Wrap the component with error boundary
const GoogleMapComponent = (props: GoogleMapComponentProps) => (
    <MapErrorBoundary>
        <MemoizedGoogleMapComponentBase {...props} />
    </MapErrorBoundary>
);

export default GoogleMapComponent;
