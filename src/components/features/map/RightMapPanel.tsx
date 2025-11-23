'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getLocationsBySession } from '@/lib/api';
import { Location, LocationType, WebSocketEvent } from '@/types/map';
import { toast } from 'react-hot-toast';
import { MapService } from '@/services/MapService';
import Image from 'next/image';
import { Route, Filter, X, Settings, Trash2 } from 'lucide-react';
// import GoogleMapComponent from './GoogleMapComponent'; // Unused import
import EnhancedGoogleMap from './EnhancedGoogleMap';
import MapFilters, { MapFilterState } from './MapFilters';
import ThemeSelector from './ThemeSelector';
// import { DEFAULT_THEME } from './MapThemes'; // Unused import
import ItineraryVisualizer from './ItineraryVisualizer';

// Development-only logging utility
const devLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(message, data);
    }
};

// Haversine distance calculation for accurate geographic distance
const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) * 
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
};

// Helper function to convert API location type to our LocationType
const convertLocationType = (type: string | undefined): LocationType | undefined => {
    if (!type) return undefined;
    const validTypes: LocationType[] = ['attraction', 'cafe', 'hotel', 'restaurant', 'transport'];
    return validTypes.includes(type as LocationType) ? type as LocationType : 'attraction';
};

interface RightMapPanelProps {
    currentSessionId: string | null;
    currentUserToken: string | null;
    onLocationUpdate?: (locations: Location[]) => void;
}

function RightMapPanel({ currentSessionId, currentUserToken, onLocationUpdate }: RightMapPanelProps) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
    const [activeFilters, setActiveFilters] = useState<MapFilterState>({
        types: [],
        priceRange: [0, 1000],
        rating: 0,
        distance: 50,
        showRoutes: true,
        showWeather: false
    });
    const [currentTheme, setCurrentTheme] = useState('modern');
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const mapServiceRef = useRef<MapService | null>(null);

    // Clear all locations function
    const handleClearAllLocations = useCallback(async () => {
        if (!currentSessionId || !currentUserToken) {
            console.warn('Cannot clear locations: missing session ID or token');
            return;
        }

        try {
            setIsLoading(true);
            
            // Clear from backend database
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/locations/clear/${currentSessionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUserToken}`,
                },
            });

            if (response.ok) {
                // Clear local state immediately
                setLocations([]);
                setFilteredLocations([]);
                toast.success('Map cleared successfully!');
                devLog('✅ All locations cleared successfully');
                
                // Notify parent component
                if (onLocationUpdate) {
                    onLocationUpdate([]);
                }
            } else {
                throw new Error(`Failed to clear locations: ${response.statusText}`);
            }
        } catch (clearError) {
            console.error('❌ Error clearing locations:', clearError);
            toast.error('Failed to clear map locations');
        } finally {
            setIsLoading(false);
        }
    }, [currentSessionId, currentUserToken, onLocationUpdate]);

    // Debug: Monitor locations state changes (development only)
    useEffect(() => {
        devLog('📍 RightMapPanel: Locations state updated:', {
            count: locations.length,
            locations: locations.map(loc => ({ name: loc.name, id: loc.id, coords: [loc.latitude, loc.longitude] }))
        });
    }, [locations]);

    // Initialize MapService when token is available
    useEffect(() => {
        if (!currentUserToken) return undefined;

        // Create new MapService instance
        const mapService = new MapService(currentUserToken);
        mapServiceRef.current = mapService;
            
        // Set up WebSocket message handler
        const messageHandler = (event: WebSocketEvent<any>) => {
            switch (event.type) {
                case 'LOCATION_ADDED': {
                    const newLocation = event.payload as Location;
                    devLog('🎯 RightMapPanel: LOCATION_ADDED WebSocket event received:', {
                        locationName: newLocation.name,
                        locationId: newLocation.id,
                        coordinates: [newLocation.latitude, newLocation.longitude],
                        type: newLocation.type
                    });
                    
                    setLocations(prev => {
                        devLog('📍 RightMapPanel: Current locations before add:', prev.length);
                        
                        // Check if location already exists (prevent duplicates)
                        const exists = prev.some(loc => {
                            // Check by ID first (most reliable)
                            if (loc.id === newLocation.id) {
                                return true;
                            }
                            // Check by name (for same cities with slightly different coordinates)
                            if (loc.name === newLocation.name) {
                                return true;
                            }
                            // Then check by distance for locations without IDs
                            const distance = calculateHaversineDistance(
                                loc.latitude, loc.longitude,
                                newLocation.latitude, newLocation.longitude
                            );
                            // Allow locations that are more than 100 meters apart
                            return distance < 100; // meters
                        });
                        
                        if (exists) {
                            devLog('⚠️ RightMapPanel: Location already exists, not adding duplicate');
                            return prev;
                        }
                        
                        const updated = [...prev, newLocation];
                        devLog('✅ RightMapPanel: Added new location. Total locations now:', updated.length);
                        return updated;
                    });
                    toast.success("New location added to map");
                    break;
                }
                case 'LOCATION_REMOVED': {
                    const { locationId } = event.payload as { locationId: string };
                    setLocations(prev => prev.filter(loc => loc.id !== locationId));
                    toast.success("Location removed from map");
                    break;
                }
                case 'MAP_CLEARED': {
                    devLog('🧹 RightMapPanel: MAP_CLEARED WebSocket event received');
                    devLog('📍 RightMapPanel: Current locations before clearing:', locations.length);
                    setLocations([]);
                    // Also clear markers from map service
                    mapService.clearAllMarkers();
                    devLog('✅ RightMapPanel: Map cleared via WebSocket - locations and markers removed');
                    toast.success("Map has been cleared");
                    break;
                }
                default:
                    // Unknown event type - log but don't error
                    devLog('⚠️ RightMapPanel: Unknown WebSocket event type:', event.type);
                    break;
            }
        };
            
        // Set up all handlers
        mapService.addMessageHandler(messageHandler);
        
        mapService.onError = (wsError: Error) => {
            console.error("❌ WebSocket error:", wsError);
            toast.error("Connection error. Some map features may be limited.");
        };

        mapService.onConnect = () => {
            toast.success("Map connection established");
        };

        mapService.onDisconnect = () => {
            toast("Map connection lost. Attempting to reconnect...", {
                icon: '⚠️',
                duration: 4000
            });
        };

        // Return cleanup function
        return () => {
            mapService.removeMessageHandler(messageHandler);
            mapService.disconnect();
            mapServiceRef.current = null;
        };
    }, [currentUserToken]);

    // Connect to WebSocket when session changes
    useEffect(() => {
        const service = mapServiceRef.current;
        if (currentSessionId && service) {
            // Clear existing locations from UI when switching sessions to prevent cross-session pollution
            setLocations([]);
            // Safely clear markers (won't throw error if map not initialized)
            service.clearAllMarkers();
            
            // FETCH existing locations for this session instead of clearing them
            const fetchExistingLocations = async () => {
                // Check if we're in test environment and handle appropriately
                if (process.env.NODE_ENV === 'test' || !currentUserToken) {
                    // In test environment or with no token, just set loading to false
                    setIsLoading(false);
                    return;
                }
                
                try {
                    setIsLoading(true);
                    
                    // Fetch existing locations for this session
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/locations/${currentSessionId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${currentUserToken}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    
                    if (response && response.ok) {
                        const existingLocations = await response.json();
                        if (Array.isArray(existingLocations) && existingLocations.length > 0) {
                            console.log(`📍 Loaded ${existingLocations.length} existing locations for session ${currentSessionId}`);
                            setLocations(existingLocations);
                        }
                    } else {
                        // No existing locations found, which is normal for new sessions
                        console.log(`📍 No existing locations found for session ${currentSessionId}`);
                    }
                } catch (fetchError) {
                    console.warn("⚠️ Could not fetch existing locations (may not exist yet):", fetchError);
                    // Don't show user error - this is expected for new sessions
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchExistingLocations();
            
            // Connecting WebSocket for session
            try {
                service.connectWebSocket(currentSessionId);
            } catch (wsError) {
                console.error("❌ WebSocket connection error:", wsError);
                toast.error("Failed to establish real-time connection");
            }
        } else if (!currentSessionId) {
            // Clear locations when no session is active (e.g., during new chat creation)
            // No session ID - clearing all locations
            setLocations([]);
            if (service) {
                // Safely clear markers (won't throw error if map not initialized)
                service.clearAllMarkers();
            }
        }
    }, [currentSessionId, currentUserToken]);

    // Update filtered locations when locations or filters change
    useEffect(() => {
        if (showFilters) {
            const filtered = locations.filter(location => {
                // Type filter
                if (activeFilters.types.length > 0 && location.type && !activeFilters.types.includes(location.type)) {
                    return false;
                }
                // Rating filter
                if (location.rating && location.rating < activeFilters.rating) {
                    return false;
                }
                return true;
            });
            setFilteredLocations(filtered);
        } else {
            setFilteredLocations(locations);
        }
    }, [locations, activeFilters, showFilters]);

    // Close filter panels when no locations are available
    useEffect(() => {
        if (locations.length === 0) {
            setShowFilters(false);
            setShowItinerary(false);
            setShowThemeSelector(false);
        }
    }, [locations.length]);

    // Fetch initial locations
    const fetchLocations = useCallback(async () => {
        if (!currentSessionId) {
            // No session ID available
            setLocations([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetching locations for session
            const apiLocations = await getLocationsBySession(currentSessionId);
            // Locations fetched successfully
            
            // Convert API locations to our Location type
            const convertedLocations: Location[] = apiLocations.map(loc => ({
                ...loc,
                type: convertLocationType(loc.type)
            }));
            
            setLocations(convertedLocations);
            // Notify parent component of location updates
            onLocationUpdate?.(convertedLocations);
        } catch (loadError) {
            console.error("❌ Error fetching locations:", loadError);
            setError("Failed to load locations");
            toast.error("Failed to load map locations");
        } finally {
            setIsLoading(false);
        }
    }, [currentSessionId]);

    // Fetch locations when session changes
    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    // Listen for new location events
    useEffect(() => {
        const handleNewLocation = (event: Event) => {
            const customEvent = event as CustomEvent<Location>;
            // New location event received
            
            setLocations(prevLocations => {
                // Check if location already exists using proper Haversine distance calculation
                const exists = prevLocations.some(loc => {
                    // Check by name first (for same cities with slightly different coordinates)
                    if (loc.name === customEvent.detail.name) {
                        // Duplicate location name detected, skipping
                        return true;
                    }
                    // Then check by distance
                    const distance = calculateHaversineDistance(
                        loc.latitude, loc.longitude,
                        customEvent.detail.latitude, customEvent.detail.longitude
                    );
                    // Allow locations that are more than 100 meters apart
                    return distance < 100; // meters
                });

                if (exists) {
                    // Location too close to existing location, skipping
                    return prevLocations;
                }

                // Adding new location to state
                const updatedLocations = [...prevLocations, customEvent.detail];
                // Notify parent component of location updates
                onLocationUpdate?.(updatedLocations);
                return updatedLocations;
            });
        };

        window.addEventListener('newLocation', handleNewLocation);
        return () => window.removeEventListener('newLocation', handleNewLocation);
    }, []);

    const handleLocationAdd = async (location: Location) => {
        if (!currentSessionId || !mapServiceRef.current) {
            console.error("❌ Cannot add location: No active session or map service");
            toast.error("Cannot add location at this time");
            return;
        }

        try {
            // Adding new location
            const addedLocation = await mapServiceRef.current.addLocation({
                ...location,
                sessionId: currentSessionId
            });
            
            // Location added successfully
            toast.success("Location added to map");

            setLocations(prev => [...prev, addedLocation]);
        } catch (addError) {
            console.error("❌ Error adding location:", addError);
            toast.error("Failed to add location to map");
        }
    };

    const handleLocationSelect = () => {
        // Location selected
        // Implement any additional functionality for location selection
    };

    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <button 
                        type="button"
                        onClick={fetchLocations}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Map visibility handled automatically
    
    return (
        <div className="h-full relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" data-testid="loading-spinner" />
                </div>
            )}
            
            {error ? (
                // Show error state with retry option
                <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 p-8">
                    <div className="text-center">
                        <div className="text-red-500 text-lg mb-4">Failed to load locations</div>
                        <button
                            type="button"
                            onClick={fetchLocations}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            aria-label="Retry loading locations"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            ) : (
                // Enhanced map with overlay panels - map takes full height
                <div className="h-full relative">
                    {/* Full Height Map Component - Always visible */}
                    <div className="absolute inset-0">
                        <EnhancedGoogleMap
                            locations={showFilters && filteredLocations.length > 0 ? filteredLocations : locations}
                            onLocationSelect={handleLocationSelect}
                            theme={currentTheme}
                            className="h-full w-full"
                        />
                    </div>

                    {/* Travel Agent Image Overlay - Only when no locations AND not loading */}
                    {locations.length === 0 && !isLoading && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <Image
                                    src="/image/travelagentpic1.png"
                                    alt="Travel Agent"
                                    width={500}
                                    height={400}
                                    className="object-cover opacity-80 rounded-lg mx-auto"
                                    priority
                                    data-testid="travel-agent-image"
                                />
                                <div className="mt-4">
                                    <div className="bg-white/95 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm">
                                        <p className="text-gray-700 text-lg font-medium">Ask AI to plan your trip!</p>
                                        <p className="text-gray-500 text-sm mt-1">Locations will appear on the map as you chat</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Map Controls - Top Right - Only show when map has loaded and has locations */}
                    {locations.length > 0 && (
                        <div className="absolute top-2 right-2 z-10">
                            <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                                <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Travel Map</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {locations.length} locations
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`p-1.5 rounded-md transition-colors ${
                                            showFilters 
                                                ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title="Toggle Filters"
                                    >
                                        <Filter size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowItinerary(!showItinerary)}
                                        className={`p-1.5 rounded-md transition-colors ${
                                            showItinerary 
                                                ? 'bg-green-100 text-green-600 border border-green-200' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title="Toggle Itinerary"
                                    >
                                        <Route size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowThemeSelector(!showThemeSelector)}
                                        className={`p-1.5 rounded-md transition-colors ${
                                            showThemeSelector 
                                                ? 'bg-purple-100 text-purple-600 border border-purple-200' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title="Map Themes"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClearAllLocations}
                                        disabled={isLoading}
                                        className={`p-1.5 rounded-md transition-colors ${
                                            isLoading 
                                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                        }`}
                                        title="Clear All Locations"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Filters Panel - Top Left - Only show when controls are visible and filters are toggled */}
                    {showFilters && locations.length > 0 && (
                        <div className="absolute top-2 left-2 z-10 max-w-sm">
                            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50 rounded-t-lg">
                                    <h3 className="text-sm font-medium text-gray-700">Map Filters</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowFilters(false)}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Close Filters"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <MapFilters
                                    onFiltersChange={(filters) => {
                                        setActiveFilters(filters);
                                    }}
                                    activeFilters={activeFilters}
                                    locationCount={locations.length}
                                />
                            </div>
                        </div>
                    )}

                    {/* Floating Theme Selector Panel - Top Center - Only show when controls are visible and theme selector is toggled */}
                    {showThemeSelector && locations.length > 0 && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 max-w-md">
                            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-purple-50 rounded-t-lg">
                                    <h3 className="text-sm font-medium text-gray-700">Map Themes</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowThemeSelector(false)}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Close Themes"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <ThemeSelector
                                    currentTheme={currentTheme}
                                    onThemeChange={(theme) => {
                                        setCurrentTheme(theme);
                                        setShowThemeSelector(false);
                                    }}
                                    className="p-4"
                                />
                            </div>
                        </div>
                    )}

                    {/* Floating Itinerary Panel - Right Side */}
                    {showItinerary && locations.length > 1 && (
                        <div className="absolute top-16 right-2 bottom-2 z-10 w-96 max-w-sm">
                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
                                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50 rounded-t-lg flex-shrink-0">
                                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Route size={16} />
                                        Travel Itinerary
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowItinerary(false)}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Close Itinerary"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ItineraryVisualizer
                                        locations={locations}
                                        onLocationSelect={(location) => {
                                            devLog('Selected location:', location);
                                        }}
                                        onRouteOptimize={(optimizedLocations: Location[]) => {
                                            // Optional: update location order based on optimization
                                            devLog('Optimized route:', optimizedLocations);
                                            setLocations(optimizedLocations);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Memoize the component to prevent re-renders when chat input changes
export default React.memo(RightMapPanel, (prevProps, nextProps) => 
    // Only re-render if the props that actually matter have changed
     (
        prevProps.currentSessionId === nextProps.currentSessionId &&
        prevProps.currentUserToken === nextProps.currentUserToken
    )
);
