import React, { useState, useEffect } from 'react';
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Image from "next/image";
import { getLocationsBySession, Location } from '@/lib/api'; // Import the API function and Location interface

interface RightMapPanelProps {
    currentSessionId: string | null;
    currentUserToken: string | null;
}

const RightMapPanel: React.FC<RightMapPanelProps> = ({ currentSessionId, currentUserToken }) => {
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        if (!currentSessionId || !currentUserToken) return;

        // Fetch existing locations when the component mounts or when currentSessionId changes
        const fetchLocations = async () => {
            try {
                console.log('Fetching existing locations...');
                const existingLocations = await getLocationsBySession(currentSessionId);
                console.log('Existing locations:', existingLocations);
                setLocations(existingLocations);
            } catch (error) {
                console.error('Error fetching existing locations:', error);
            }
        };

        fetchLocations();

        const socketUrl = 'https://api.flomadtravel.com/ws';

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
                const messageBody = message.body;

                let data;
                try {
                    data = JSON.parse(messageBody);
                } catch (e) {
                    console.error('Error parsing message body:', e);
                    return;
                }

                if (data.type && data.payload !== undefined) {
                    switch (data.type) {
                        case 'LOCATION_ADDED':
                            handleLocationAdded(data.payload);
                            break;
                        case 'LOCATION_REMOVED':
                            handleLocationRemoved(data.payload);
                            break;
                        case 'MAP_CLEARED':
                            handleMapCleared();
                            break;
                        case 'ERROR':
                            console.error('Error from server:', data.payload.message);
                            break;
                        default:
                            console.warn('Unknown message type:', data.type);
                    }
                } else {
                    console.warn('Invalid message format:', data);
                }
            });
        };

        stompClient.onStompError = (frame) => {
            console.error('WebSocket error:', frame.headers['message']);
        };

        stompClient.activate();

        // Cleanup function to deactivate the WebSocket when the component unmounts or when session changes
        return () => {
            stompClient.deactivate();
            console.log('WebSocket disconnected');
        };
    }, [currentSessionId, currentUserToken]);

    const handleLocationAdded = (location: Location) => {
        if (location && location.id && location.latitude && location.longitude) {
            setLocations((prevLocations) => {
                const exists = prevLocations.some((loc) => loc.id === location.id);
                if (!exists) {
                    return [...prevLocations, location];
                }
                return prevLocations;
            });
            console.log('Location added:', location);
        } else {
            console.warn('Invalid location data:', location);
        }
    };

    const handleLocationRemoved = (payload: { locationId: string }) => {
        const { locationId } = payload;
        if (locationId) {
            setLocations((prevLocations) =>
                prevLocations.filter((loc) => loc.id !== locationId)
            );
            console.log('Location removed:', locationId);
        } else {
            console.warn('Invalid payload for LOCATION_REMOVED:', payload);
        }
    };

    const handleMapCleared = () => {
        setLocations([]);
        console.log('Map cleared');
    };

    return (
        <div className="hidden md:block w-1/4 bg-white border-l p-4 overflow-y-auto">
            {locations.length > 0 ? (
                <>
                    <h2 className="text-xl font-bold mb-4">Map</h2>
                    {/* Google Map Integration */}
                    <GoogleMapComponent locations={locations} />
                </>
            ) : (
                <>
                    <h2 className="text-xl font-bold mb-4">Details</h2>
                    <div className="flex flex-col items-center justify-center h-full">
                        <Image src="/image/no-gradient.png" alt="Placeholder" width={200} height={200} />
                        <p className="mt-4 text-center">Additional information will appear here.</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default RightMapPanel;
