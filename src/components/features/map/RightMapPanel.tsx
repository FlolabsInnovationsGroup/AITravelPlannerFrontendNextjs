'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { getLocationsBySession } from '@/lib/api';
import GoogleMapComponent from './GoogleMapComponent';
import { Location, LocationType, WebSocketEvent } from '@/types/map';
import { toast } from 'react-hot-toast';
import { MapService } from '@/services/MapService';
import Image from 'next/image';

// Memoized GoogleMapComponent to prevent unnecessary re-renders
const MemoizedGoogleMapComponent = React.memo(GoogleMapComponent);

// Helper function to convert API location type to our LocationType
const convertLocationType = (type: string | undefined): LocationType | undefined => {
    if (!type) return undefined;
    const validTypes: LocationType[] = ['attraction', 'cafe', 'hotel', 'restaurant', 'transport'];
    return validTypes.includes(type as LocationType) ? type as LocationType : 'attraction';
};

interface RightMapPanelProps {
    currentSessionId: string | null;
    currentUserToken: string | null;
}

export default function RightMapPanel({ currentSessionId, currentUserToken }: RightMapPanelProps) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);
    const mapServiceRef = useRef<MapService | null>(null);

    // Initialize MapService when token is available
    useEffect(() => {
        if (!currentUserToken) return;

        // Create new MapService instance
        const mapService = new MapService(currentUserToken);
        mapServiceRef.current = mapService;
            
        // Set up WebSocket message handler
        const messageHandler = (event: WebSocketEvent<any>) => {
            console.log("📡 WebSocket message received:", event);
            switch (event.type) {
                case 'LOCATION_ADDED':
                    const newLocation = event.payload as Location;
                    console.log("📍 Adding location from WebSocket:", newLocation);
                    setLocations(prev => {
                        // Check if location already exists to prevent duplicates (using distance threshold)
                        const exists = prev.some(loc => {
                            const distance = Math.sqrt(
                                Math.pow(loc.latitude - newLocation.latitude, 2) + 
                                Math.pow(loc.longitude - newLocation.longitude, 2)
                            );
                            // Allow locations that are more than ~100 meters apart (0.001 degrees ≈ 111m)
                            return distance < 0.001;
                        });
                        if (exists) {
                            console.log("⚠️ Location too close to existing location, skipping");
                            return prev;
                        }
                        console.log("✅ Adding new location:", newLocation);
                        return [...prev, newLocation];
                    });
                    toast.success("New location added to map");
                    break;
                case 'LOCATION_REMOVED':
                    const { locationId } = event.payload as { locationId: string };
                    setLocations(prev => prev.filter(loc => loc.id !== locationId));
                    toast.success("Location removed from map");
                    break;
                case 'MAP_CLEARED':
                    setLocations([]);
                    toast.success("Map has been cleared");
                    break;
            }
        };
            
        // Set up all handlers
        mapService.addMessageHandler(messageHandler);
        
        mapService.onError = (error: Error) => {
            console.error("❌ WebSocket error:", error);
            toast.error("Connection error. Some map features may be limited.");
        };

        mapService.onConnect = () => {
            console.log("✅ Connected to map service");
            toast.success("Map connection established");
        };

        mapService.onDisconnect = () => {
            console.log("⚠️ Disconnected from map service");
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
            console.log("🔄 Connecting WebSocket for session:", currentSessionId);
            try {
                service.connectWebSocket(currentSessionId);
            } catch (error) {
                console.error("❌ WebSocket connection error:", error);
                toast.error("Failed to establish real-time connection");
            }
        }
    }, [currentSessionId]);

    // Fetch initial locations
    const fetchLocations = useCallback(async () => {
        if (!currentSessionId) {
            console.log("⚠️ No session ID available");
            setLocations([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("🔍 Fetching locations for session:", currentSessionId);
            const apiLocations = await getLocationsBySession(currentSessionId);
            console.log("✅ Locations fetched:", apiLocations);
            
            // Convert API locations to our Location type
            const convertedLocations: Location[] = apiLocations.map(loc => ({
                ...loc,
                type: convertLocationType(loc.type)
            }));
            
            setLocations(convertedLocations);
        } catch (error) {
            console.error("❌ Error fetching locations:", error);
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

    // Show map when locations exist
    useEffect(() => {
        const shouldShowMap = locations.length > 0;
        console.log(`🔄 Locations changed: ${locations.length} locations - ${shouldShowMap ? 'showing map' : 'showing travel agent'}`);
        setShowMap(shouldShowMap);
    }, [locations]);

    // Listen for new location events
    useEffect(() => {
        const handleNewLocation = (event: Event) => {
            const customEvent = event as CustomEvent<Location>;
            console.log("🌍 New location event received:", customEvent.detail);
            
            setLocations(prevLocations => {
                // Check if location already exists using distance threshold
                const exists = prevLocations.some(loc => {
                    const distance = Math.sqrt(
                        Math.pow(loc.latitude - customEvent.detail.latitude, 2) + 
                        Math.pow(loc.longitude - customEvent.detail.longitude, 2)
                    );
                    // Allow locations that are more than ~100 meters apart
                    return distance < 0.001;
                });

                if (exists) {
                    console.log("⚠️ Location too close to existing location, skipping");
                    return prevLocations;
                }

                console.log("✅ Adding new location to state");
                return [...prevLocations, customEvent.detail];
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
            console.log("📍 Adding new location:", location);
            const addedLocation = await mapServiceRef.current.addLocation({
                ...location,
                sessionId: currentSessionId
            });
            
            console.log("✅ Location added successfully:", addedLocation);
            toast.success("Location added to map");

            setLocations(prev => [...prev, addedLocation]);
        } catch (error) {
            console.error("❌ Error adding location:", error);
            toast.error("Failed to add location to map");
        }
    };

    const handleLocationSelect = (location: Location) => {
        console.log("🎯 Location selected:", location);
        // Implement any additional functionality for location selection
    };

    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <button 
                        onClick={fetchLocations}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Debug logging for map display logic
    if (locations.length > 0) {
        console.log("🗺️ Map should be visible - locations:", locations.length);
    }
    
    return (
        <div className="h-full relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
            )}
            
            {!showMap ? (
                // Show travel agent picture when no locations - fill container
                <div className="h-full w-full relative">
                    <Image
                        src="/image/travelagentpic1.png"
                        alt="Travel Agent"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority
                    />
                </div>
            ) : (
                // Show map when locations exist
                <GoogleMapComponent
                    locations={locations}
                    onLocationAdd={handleLocationAdd}
                    onLocationSelect={handleLocationSelect}
                />
            )}
        </div>
    );
}
