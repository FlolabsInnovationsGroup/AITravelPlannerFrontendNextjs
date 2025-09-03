import React, { useState, useEffect, useRef } from 'react';
import GoogleMapComponent from "@/components/features/map/GoogleMapComponent";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Image from "next/image";
import { getLocationsBySession } from "@/lib/api";
import { Location, LocationType } from "@/types/map";

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
    const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

    const toggleFullScreen = () => {
        setIsFullScreen((prev) => !prev);
    };

    const stompClientRef = useRef<Client | null>(null);

    // Load initial locations
    // Listen for new locations from chat
    useEffect(() => {
        const handleNewLocation = (event: CustomEvent<Location>) => {
            setLocations(prev => [...prev, event.detail]);
        };

        window.addEventListener('newLocation', handleNewLocation as EventListener);
        return () => {
            window.removeEventListener('newLocation', handleNewLocation as EventListener);
        };
    }, []);

    useEffect(() => {
        if (currentSessionId) {
            getLocationsBySession(currentSessionId)
                .then(response => {
                    console.log("📍 Initial locations loaded:", response);
                    // Convert API location type to map location type
                    const convertedLocations = response.map(loc => ({
                        ...loc,
                        type: loc.type as LocationType
                    }));
                    setLocations(convertedLocations);
                })
                .catch(error => {
                    console.error("🚨 Error loading locations:", error);
                });
        }
    }, [currentSessionId]);

    useEffect(() => {
        if (!currentSessionId || !currentUserToken) {
            console.warn("⚠️ Session ID or user token is missing.");
            return;
        }

        console.log(`🔄 Connecting WebSocket for session: ${currentSessionId}`);

        if (stompClientRef.current) {
            console.log("🛑 WebSocket connection already exists, skipping reinitialization.");
            return;
        }

        const protocol = window.location.protocol === "https:" ? "https" : "http";
        const socketUrl = `${protocol}://${process.env.NEXT_PUBLIC_API_URL?.replace('http://', '').replace('https://', '')}/ws`;

        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: `Bearer ${currentUserToken}`,
            },
        });

        client.onConnect = () => {
            console.log(`✅ WebSocket connected. Subscribing to: /topic/locations/${currentSessionId}`);

            client.subscribe(`/topic/locations/${currentSessionId}`, (message) => {
                try {
                    const data = JSON.parse(message.body);
                    console.log("📡 WebSocket Received:", data);
                    handleWebSocketEvent(data.type, data.payload);
                } catch (error) {
                    console.error("🚨 Error parsing WebSocket message:", error);
                }
            });
        };

        client.onStompError = (frame) => {
            console.error("❌ WebSocket STOMP error:", frame.headers["message"]);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            console.log("🔌 Disconnecting WebSocket...");
            stompClientRef.current?.deactivate();
            stompClientRef.current = null;
        };
    }, [currentSessionId, currentUserToken]);



    const handleWebSocketEvent = (type: string, payload: any) => {
        if (!payload || !payload.id) {
            console.error("🚨 Invalid WebSocket payload:", payload);
            return;
        }

        console.log(`📡 WebSocket Received [${type}]:`, payload);

        setLocations((prevLocations) => {
            const locationIds = new Set(prevLocations.map(loc => loc.id));

            switch (type) {
                case "LOCATION_ADDED":
                    if (!locationIds.has(payload.id)) {
                        console.log("✅ Adding new location:", payload);
                        return [...prevLocations, payload]; // Append new location
                    } else {
                        console.warn("⚠️ Duplicate location detected, skipping:", payload);
                        return prevLocations;
                    }
                case "LOCATION_REMOVED":
                    console.log("🗑 Removing location:", payload.locationId);
                    return prevLocations.filter(loc => loc.id !== payload.locationId);
                case "MAP_CLEARED":
                    console.log("🗺 Clearing all locations.");
                    return [];
                default:
                    console.warn("⚠️ Unknown WebSocket event type:", type);
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
                {locations.length > 0 ? (
                    <div className="h-full w-full p-2 bg-white rounded-lg">
                        <GoogleMapComponent
                            locations={locations}
                        />
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
