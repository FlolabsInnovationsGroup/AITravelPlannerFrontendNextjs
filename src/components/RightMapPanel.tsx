import React, { useState, useEffect } from "react";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Image from "next/image";
import { getLocationsBySession, Location } from "@/lib/api";

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

    const toggleFullScreen = () => {
        setIsFullScreen((prev) => !prev);
    };

    useEffect(() => {
        if (!currentSessionId || !currentUserToken) {
            console.warn("Session ID or user token is missing.");
            return;
        }

        // Fetch existing locations
        const fetchLocations = async () => {
            try {
                console.log("Fetching existing locations...");
                const existingLocations = await getLocationsBySession(currentSessionId);
                console.log("Fetched locations:", existingLocations);
                setLocations(existingLocations);
            } catch (error) {
                console.error("Error fetching locations:", error);
            }
        };

        fetchLocations();

        // WebSocket setup
        const socketUrl = "http://localhost:8080/ws";
        const stompClient = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: `Bearer ${currentUserToken}`,
            },
        });

        stompClient.onConnect = () => {
            console.log("WebSocket connected.");
            stompClient.subscribe(
                `/topic/locations/${currentSessionId}`,
                (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log("WebSocket message received:", data);

                        if (data.type && data.payload !== undefined) {
                            handleWebSocketEvent(data.type, data.payload);
                        } else {
                            console.warn("Invalid WebSocket message format:", data);
                        }
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                }
            );
        };

        stompClient.onStompError = (frame) => {
            console.error("WebSocket error:", frame.headers["message"]);
        };

        stompClient.activate();

        return () => {
            console.log("Deactivating WebSocket...");
            stompClient.deactivate();
        };
    }, [currentSessionId, currentUserToken]);

    const handleWebSocketEvent = (type: string, payload: any) => {
        switch (type) {
            case "LOCATION_ADDED":
                handleLocationAdded(payload);
                break;
            case "LOCATION_REMOVED":
                handleLocationRemoved(payload);
                break;
            case "MAP_CLEARED":
                handleMapCleared();
                break;
            default:
                console.warn("Unknown WebSocket event type:", type);
        }
    };

    const handleLocationAdded = (location: Location) => {
        if (location && location.latitude && location.longitude) {
            console.log("Adding location:", location);
            setLocations((prevLocations) => {
                const exists = prevLocations.some((loc) => loc.id === location.id);
                return exists ? prevLocations : [...prevLocations, location];
            });
        } else {
            console.error("Invalid location data received:", location);
        }
    };

    const handleLocationRemoved = (payload: { locationId: string }) => {
        const { locationId } = payload;
        if (locationId) {
            console.log("Removing location with ID:", locationId);
            setLocations((prevLocations) =>
                prevLocations.filter((loc) => loc.id !== locationId)
            );
        } else {
            console.warn("Invalid payload for LOCATION_REMOVED event:", payload);
        }
    };

    const handleMapCleared = () => {
        console.log("Clearing all locations from the map.");
        setLocations([]);
    };

    return (
        <div
            className={`${
                isFullScreen ? "absolute inset-0 z-50" : "hidden md:block flex-grow"
            } bg-white border-l h-screen p-4 overflow-hidden`}
        >
            <div className="relative h-full w-full">
                {locations.length > 0 ? (
                    <div className="h-full w-full p-2 bg-white rounded-lg">
                        <GoogleMapComponent locations={locations} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full w-full p-2">
                        <div className="relative h-full w-full bg-white rounded-lg">
                            <Image
                                src="/image/travelagentpic1.png"
                                alt="Your Personal AI Travel Agent"
                                fill
                                className="object-cover rounded-lg"
                                priority
                            />
                        </div>
                    </div>
                )}
                {/* Full-Screen Toggle Button */}
                <button
                    onClick={toggleFullScreen}
                    className="absolute top-4 right-4 bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700"
                >
                    {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                </button>
            </div>
        </div>
    );
};

export default RightMapPanel;
