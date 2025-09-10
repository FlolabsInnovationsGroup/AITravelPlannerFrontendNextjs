import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Location, WebSocketEvent, LocationAddedPayload, LocationRemovedPayload, MapClearedPayload } from '@/types/map';
import { RetryMechanism, WebSocketRetryManager } from '@/utils/RetryMechanism';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;  // Non-null assertion as this is required

export class MapService {
    private stompClient: Client | null = null;
    private messageHandlers: ((event: WebSocketEvent<any>) => void)[] = [];
    private wsRetryManager = new WebSocketRetryManager(5, 1000);
    private mapInstance: google.maps.Map | null = null;
    private markers: google.maps.Marker[] = [];
    private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
    
    // Event handlers
    onConnect: (() => void) | null = null;
    onDisconnect: (() => void) | null = null;
    onError: ((error: Error) => void) | null = null;
    onMessage: ((event: WebSocketEvent<any>) => void) | null = null;
    onConnectionStatusChange: ((status: 'disconnected' | 'connecting' | 'connected') => void) | null = null;

    constructor(private userToken: string) { }

    // Enhanced connection status management
    private setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
        if (this.connectionStatus !== status) {
            this.connectionStatus = status;
            this.onConnectionStatusChange?.(status);
        }
    }

    // REST API Methods with retry logic
    async getLocations(sessionId: string): Promise<Location[]> {
        return RetryMechanism.withRetry(async () => {
            const response = await fetch(`${API_BASE_URL}/api/locations/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${this.userToken}`,
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
            }

            return response.json();
        }, { maxAttempts: 3 });
    }

    async addLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { sessionId: string }): Promise<Location> {
        if (!location.sessionId) {
            throw new Error('Session ID is required to add a location');
        }
        
        try {
            // Prepare the request payload according to the backend's expectations
            const locationRequest = {
                latitude: location.latitude,
                longitude: location.longitude,
                name: location.name || '',
                type: location.type || 'attraction',
                sessionId: location.sessionId
            };

            console.log('🚀 Sending location request:', locationRequest);

            const response = await fetch(`${API_BASE_URL}/api/locations/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userToken}`,
                },
                body: JSON.stringify(locationRequest),
            });

            // First, check if the response is ok
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error response:', errorText);
                throw new Error(`Failed to add location: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Location added successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error adding location:', error);
            throw error;
        }
    }

    async removeLocation(locationId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/locations/remove/${locationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.userToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to remove location');
        }
    }

    async clearLocations(sessionId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/locations/clear/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.userToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to clear locations');
        }
    }

    // WebSocket Methods
    connectWebSocket(sessionId: string): void {
        if (this.stompClient?.connected) {
            console.log('WebSocket already connected, session:', sessionId);
            return;
        }
        
        console.log('Initializing WebSocket connection for session:', sessionId);

        // Convert API_BASE_URL to URL object to parse it properly
        const apiUrl = new URL(API_BASE_URL);
        // Use HTTP for local development, HTTPS for production
        apiUrl.protocol = process.env.NODE_ENV === 'production' ? 'https:' : 'http:';
        // Set the WebSocket path
        apiUrl.pathname = '/ws';
        const socketUrl = apiUrl.toString();
        
        // For local development, replace any localhost HTTPS with HTTP
        const finalSocketUrl = socketUrl.replace('https://localhost', 'http://localhost');

        console.log('Connecting to WebSocket at:', finalSocketUrl);
        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(finalSocketUrl, null, {
                transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
                timeout: 10000, // 10 second timeout
            }),
            connectHeaders: {
                Authorization: `Bearer ${this.userToken}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => {
                console.debug('🔄 STOMP:', str);
            },
            onConnect: () => {
                console.log('✅ WebSocket Connected, subscribing to session:', sessionId);
                this.wsRetryManager.reset();
                this.connectionStatus = 'connected';
                this.subscribeToSession(sessionId);
                if (this.onConnect) this.onConnect();
            },
            onStompError: (frame) => {
                console.error('❌ STOMP error:', frame.headers, 'Session:', sessionId);
                this.handleConnectionError().catch(console.error);
            },
            onWebSocketClose: () => {
                console.log('⚠️ WebSocket closed for session:', sessionId);
                this.handleConnectionError().catch(console.error);
                if (this.onDisconnect) this.onDisconnect();
            },
            onWebSocketError: (event: Event) => {
                console.error('🚨 WebSocket error:', event);
                this.handleConnectionError().catch(console.error);
                if (this.onError) this.onError(new Error('WebSocket connection error'));
            },
        });

        this.stompClient.activate();
    }

    private subscribeToSession(sessionId: string): void {
        if (!this.stompClient?.connected) {
            console.error('Cannot subscribe: WebSocket not connected');
            return;
        }

        this.stompClient.subscribe(`/topic/locations/${sessionId}`, (message) => {
            try {
                console.log('📥 Received WebSocket message:', message.body);
                const event: WebSocketEvent<LocationAddedPayload | LocationRemovedPayload | MapClearedPayload> = JSON.parse(message.body);
                this.messageHandlers.forEach(handler => handler(event));
                console.log('✅ Processed WebSocket event:', event.type);
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error, 'Message body:', message.body);
            }
        });
    }

    private async handleConnectionError(): Promise<void> {
        this.connectionStatus = 'connecting';
        
        if (await this.wsRetryManager.shouldRetry()) {
            console.log(`⚡ Reconnection attempt ${this.wsRetryManager.getRetryCount()}/${5}`);
            // Force reconnection after a delay
            if (this.stompClient) {
                this.stompClient.deactivate();
                this.stompClient.activate();
            }
        } else {
            console.error('❌ Max reconnection attempts reached. Please refresh the page.');
            this.disconnect(); // Clean up the connection
        }
    }

    addMessageHandler(handler: (event: WebSocketEvent<any>) => void): void {
        this.messageHandlers.push(handler);
    }

    removeMessageHandler(handler: (event: WebSocketEvent<any>) => void): void {
        const index = this.messageHandlers.indexOf(handler);
        if (index !== -1) {
            this.messageHandlers.splice(index, 1);
        }
    }

    disconnect(): void {
        try {
            // Attempt to gracefully close the connection
            if (this.stompClient?.connected) {
                this.stompClient.deactivate();
            }
        } catch (error) {
            console.error('Error during disconnect:', error);
        } finally {
            // Ensure cleanup happens even if there's an error
            this.stompClient = null;
            this.messageHandlers = [];
            this.wsRetryManager.reset();
            this.connectionStatus = 'disconnected';
            // Remove event handlers
            this.onConnect = null;
            this.onDisconnect = null;
            this.onError = null;
        }
    }

    // Google Maps Methods
    setMapInstance(map: google.maps.Map): void {
        this.mapInstance = map;
        this.onMapInitialized();
        console.log('✅ Map instance set successfully');
    }

    private onMapInitialized(): void {
        // Add any initialization logic here
        if (!this.mapInstance) return;

        // Set default map options
        this.mapInstance.setOptions({
            zoom: 12,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            gestureHandling: 'cooperative'
        });

        // Add error handling for map loading
        google.maps.event.addListenerOnce(this.mapInstance, 'idle', () => {
            console.log('🗺️ Map fully loaded and ready');
            if (this.onConnect) this.onConnect();
        });

        google.maps.event.addListenerOnce(this.mapInstance, 'error', () => {
            console.error('❌ Error loading map');
            if (this.onError) this.onError(new Error('Failed to load Google Maps'));
        });
    }

    addMarkerToMap(location: { lat: number; lng: number }, title?: string): void {
        if (!this.mapInstance) {
            const error = new Error('Map instance is not set. Please initialize the map.');
            console.error('❌', error);
            if (this.onError) this.onError(error);
            return;
        }
        
        try {
            const marker = new google.maps.Marker({
                position: location,
                map: this.mapInstance,
                title: title || '',
                animation: google.maps.Animation.DROP
            });

            this.markers.push(marker);
            console.log('✨ Marker added:', location);
        } catch (error) {
            console.error('❌ Error adding marker:', error);
            if (this.onError) this.onError(error as Error);
        }
    }

    removeMarkerFromMap(location: { lat: number; lng: number }): void {
        if (!this.mapInstance) {
            const error = new Error('Map instance is not set. Please initialize the map.');
            console.error('❌', error);
            if (this.onError) this.onError(error);
            return;
        }

        try {
            const markerIndex = this.markers.findIndex(
                (marker) =>
                    marker.getPosition()?.lat() === location.lat &&
                    marker.getPosition()?.lng() === location.lng
            );

            if (markerIndex !== -1) {
                this.markers[markerIndex].setMap(null);
                this.markers.splice(markerIndex, 1);
                console.log('🗑️ Marker removed:', location);
            } else {
                console.warn('⚠️ No marker found at location:', location);
            }
        } catch (error) {
            console.error('❌ Error removing marker:', error);
            if (this.onError) this.onError(error as Error);
        }
    }

    clearAllMarkers(): void {
        if (!this.mapInstance) {
            const error = new Error('Map instance is not set. Please initialize the map.');
            console.error('❌', error);
            if (this.onError) this.onError(error);
            return;
        }

        try {
            this.markers.forEach((marker) => marker.setMap(null));
            this.markers = [];
            console.log('🧹 All markers cleared from the map');
        } catch (error) {
            console.error('❌ Error clearing markers:', error);
            if (this.onError) this.onError(error as Error);
        }
    }

    centerMapOnLocation(location: { lat: number; lng: number }): void {
        if (!this.mapInstance) {
            const error = new Error('Map instance is not set. Please initialize the map.');
            console.error('❌', error);
            if (this.onError) this.onError(error);
            return;
        }

        try {
            this.mapInstance.panTo(location);
            this.mapInstance.setZoom(14); // Set appropriate zoom level
            console.log('🎯 Map centered at:', location);
        } catch (error) {
            console.error('❌ Error centering map:', error);
            if (this.onError) this.onError(error as Error);
        }
    }
}
