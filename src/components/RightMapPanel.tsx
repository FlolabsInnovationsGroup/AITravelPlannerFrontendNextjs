import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Location } from "@/types/map";
import { MapService } from "@/services/MapService";
import GoogleMapComponent from "@/components/features/map/GoogleMapComponent";

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
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
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
            className={`${
                isFullScreen ? "fixed inset-0 z-50" : "hidden md:block flex-grow"
            } bg-white border-l h-screen overflow-hidden`}
        >
            <div className="relative h-full w-full">
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
                ) : (
                    <div className="relative h-full w-full">
                        <GoogleMapComponent
                            locations={locations}
                            onLocationSelect={(location) => {
                                console.log("Location selected:", location);
                                setSelectedLocation(location);
                            }}
                        />
                        <button
                            onClick={toggleFullScreen}
                            className="absolute top-4 right-4 z-10 bg-white text-gray-700 py-2 px-4 rounded-lg shadow-md hover:bg-gray-50 transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <Image
                                src={isFullScreen ? "/icons/minimize.svg" : "/icons/maximize.svg"}
                                alt={isFullScreen ? "Exit full screen" : "Enter full screen"}
                                width={20}
                                height={20}
                            />
                            <span className="hidden sm:inline">
                                {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightMapPanel;
