import React, { useState, useEffect, useRef } from "react";
import { MapRef } from "react-map-gl";
import MapboxComponent from "@/components/MapBoxComponent";
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
    const mapRef = useRef<MapRef>(null); // Ref for Mapbox

    const toggleFullScreen = () => {
        setIsFullScreen((prev) => !prev);
    };

    useEffect(() => {
        if (!currentSessionId || !currentUserToken) {
            console.warn("Session ID or user token is missing.");
            return;
        }
    
        console.log("Initializing WebSocket connection...");
    
        // Use HTTP or HTTPS based on the current environment for SockJS
        const protocol = window.location.protocol === "https:" ? "https" : "http";
        const socketUrl = `${protocol}://localhost:8080/ws`; // Replace 'localhost' with your production host if needed
    
        const stompClient = new Client({
            webSocketFactory: () => new SockJS(socketUrl), // SockJS expects HTTP/HTTPS
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
                        handleWebSocketEvent(data.type, data.payload);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                }
            );
        };
    
        stompClient.onStompError = (frame) => {
            console.error("WebSocket STOMP error:", frame.headers["message"]);
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
                setLocations((prev) =>
                    prev.some((loc) => loc.id === payload.id)
                        ? prev
                        : [...prev, payload]
                );
                break;
            case "LOCATION_REMOVED":
                setLocations((prev) =>
                    prev.filter((loc) => loc.id !== payload.locationId)
                );
                break;
            case "MAP_CLEARED":
                setLocations([]);
                break;
            default:
                console.warn("Unknown WebSocket event type:", type);
        }
    };

    return (
        <div
            className={`${
                isFullScreen ? "absolute inset-0 z-50" : "hidden md:block flex-grow"
            } bg-white border-l h-screen p-4 overflow-hidden`}
        >
            <div
                className={`relative h-full w-full ${
                    isFullScreen ? "fullscreen-map" : ""
                }`}
            >
                {locations.length > 0 ? (
                    <div className="h-full w-full p-2 bg-white rounded-lg">
                        <MapboxComponent
                            locations={locations}
                            isFullScreen={isFullScreen}
                            ref={mapRef} // Pass the ref here
                        />
                        {/* Full-Screen Toggle Button (Only for Map) */}
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
