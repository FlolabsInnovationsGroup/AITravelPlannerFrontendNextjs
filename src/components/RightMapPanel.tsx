import React, { useState, useEffect, useRef } from "react";
import { MapRef } from "react-map-gl";
import MapboxComponent from "@/components/MapBoxComponent";
import Image from "next/image";
import { Location } from "@/types/map";
import { MapService } from "@/services/MapService";

interface RightMapPanelProps {
    currentSessionId: string | null;
    currentUserToken: string | null;
}

const RightMapPanel: React.FC<RightMapPanelProps> = ({
    currentSessionId,
    currentUserToken,
}) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<MapRef>(null);
    const mapServiceRef = useRef<MapService | null>(null);

    const toggleFullScreen = () => {
        setIsFullScreen((prev) => !prev);
    };

    useEffect(() => {
        if (!currentSessionId || !currentUserToken) {
            setError("Session ID or user token is missing.");
            return;
        }

        setIsLoading(true);
        setError(null);

        // Initialize MapService
        mapServiceRef.current = new MapService(currentUserToken);

        // Load initial locations
        mapServiceRef.current.getLocations(currentSessionId)
            .then(fetchedLocations => {
                setLocations(fetchedLocations);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch initial locations:", err);
                setError("Failed to load locations");
                setIsLoading(false);
            });

        // Set up WebSocket connection
        mapServiceRef.current.connectWebSocket(currentSessionId);
        mapServiceRef.current.onMessage((event) => {
            console.log("� WebSocket Event:", event);
            handleWebSocketEvent(event.type, event.payload);
        });

        return () => {
            mapServiceRef.current?.disconnect();
            mapServiceRef.current = null;
        };
    }, [currentSessionId, currentUserToken]);



    const handleWebSocketEvent = (type: string, payload: any) => {
        console.log(`📡 WebSocket Event [${type}]:`, payload);

        setLocations((prevLocations) => {
            switch (type) {
                case "LOCATION_ADDED": {
                    const newLocation = payload as Location;
                    const exists = prevLocations.some(loc => loc.id === newLocation.id);
                    if (!exists) {
                        console.log("✅ Adding new location:", newLocation);
                        return [...prevLocations, newLocation];
                    }
                    console.warn("⚠️ Duplicate location skipped:", newLocation);
                    return prevLocations;
                }
                case "LOCATION_REMOVED": {
                    const { locationId } = payload;
                    console.log("🗑 Removing location:", locationId);
                    return prevLocations.filter(loc => loc.id !== locationId);
                }
                case "MAP_CLEARED": {
                    console.log("🗺 Clearing all locations");
                    return [];
                }
                default:
                    console.warn("⚠️ Unknown event type:", type);
                    return prevLocations;
            }
        });
    };




    return (
        <div
            className={`${isFullScreen ? "absolute inset-0 z-50" : "hidden md:block flex-grow"
                } bg-white border-l h-screen p-4 overflow-hidden`}
        >
            <div
                className={`relative h-full w-full ${isFullScreen ? "fullscreen-map" : ""
                    }`}
            >
                {error ? (
                    <div className="flex items-center justify-center h-full w-full">
                        <div className="text-red-500 text-center">
                            <p className="text-lg font-semibold">Error</p>
                            <p>{error}</p>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center h-full w-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                ) : locations.length > 0 ? (
                    <div className="h-full w-full p-2 bg-white rounded-lg">
                        <MapboxComponent
                            locations={locations}
                            isFullScreen={isFullScreen}
                            ref={mapRef}
                            onMarkerClick={(location) => {
                                console.log("Marker clicked:", location);
                                // Add any marker click handling here
                            }}
                        />
                        <button
                            onClick={toggleFullScreen}
                            className="absolute top-4 right-4 bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
                        >
                            {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full w-full p-2">
                        <div className="relative h-full w-full bg-white rounded-lg">
                            <Image
                                src="/image/travelagentpic1.png"
                                alt="Your Personal AI Travel Agent"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover rounded-lg"
                                priority
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightMapPanel;
