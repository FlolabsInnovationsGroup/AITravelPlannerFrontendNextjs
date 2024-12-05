import React, { useState, useEffect } from 'react';
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface Location {
    latitude: number;
    longitude: number;
    name?: string;
    sessionId?: string;
    type?: string;
}

interface RightMapPanelProps {
    currentSessionId: string | null;
    currentUserToken: string | null;
}

const RightMapPanel: React.FC<RightMapPanelProps> = ({ currentSessionId, currentUserToken }) => {
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        if (!currentSessionId || !currentUserToken) return;

        const socketUrl = 'http://localhost:8080/ws';

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: `Bearer ${currentUserToken}`,
            },
        });

        stompClient.onConnect = () => {
            console.log('WebSocket connected');

            // Subscribe to the session's location updates
            stompClient.subscribe(`/topic/locations/${currentSessionId}`, (message) => {
                const locationData = JSON.parse(message.body);

                if (locationData === 'MAP_CLEARED') {
                    console.log('Map cleared');
                    setLocations([]);
                } else {
                    console.log('Location received:', locationData);
                    setLocations((prevLocations) => [...prevLocations, locationData]);
                }
            });
        };

        stompClient.onStompError = (frame) => {
            console.error('WebSocket error:', frame.headers['message']);
        };

        stompClient.activate();

        // Cleanup function to deactivate the WebSocket when the component unmounts
        return () => {
            stompClient.deactivate();
            console.log('WebSocket disconnected');
        };
    }, [currentSessionId, currentUserToken]);

    return (
        <div className="hidden md:block w-1/4 bg-white border-l p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Map</h2>
            {/* Google Map Integration */}
            <GoogleMapComponent locations={locations} />
        </div>
    );
};

export default RightMapPanel;
