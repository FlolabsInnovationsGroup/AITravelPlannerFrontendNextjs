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
    private pendingSessionId: string | null = null; // Store session ID for subscription after connection
    
    // Event handlers
    onConnect: (() => void) | null = null;
    onDisconnect: (() => void) | null = null;
    onError: ((error: Error) => void) | null = null;
    onMessage: ((event: WebSocketEvent<any>) => void) | null = null;
    onConnectionStatusChange: ((status: 'disconnected' | 'connecting' | 'connected') => void) | null = null;

    constructor(private userToken: string) { }

    // Update user token (useful for token refresh)
    updateToken(newToken: string): void {
        console.log('🔄 Updating MapService token');
        this.userToken = newToken;
    }

    // Get current connection status
    getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
        return this.connectionStatus;
    }

    // Enhanced connection status management with metrics
    private setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
        if (this.connectionStatus !== status) {
            const previousStatus = this.connectionStatus;
            this.connectionStatus = status;
            
            // Log connection transitions for debugging
            console.log(`🔄 MapService connection: ${previousStatus} → ${status}`);
            
            // Reset retry manager and clear pending session on successful connection
            if (status === 'connected') {
                this.wsRetryManager.reset();
                // If we had a pending session, subscribe to it now
                if (this.pendingSessionId && this.stompClient?.connected) {
                    this.subscribeToSession(this.pendingSessionId);
                    this.pendingSessionId = null;
                }
            }
            
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
        
        // Validate required location data
        if (!location.latitude || !location.longitude) {
            throw new Error('Latitude and longitude are required to add a location');
        }
        
        try {
            // Validate token format (should be JWT with 3 parts)
            if (!this.userToken || this.userToken.split('.').length !== 3) {
                throw new Error('Invalid or missing authentication token. Please refresh the page and try again.');
            }

            // Prepare the request payload according to the backend's expectations
            const locationRequest = {
                latitude: Number(location.latitude),
                longitude: Number(location.longitude),
                name: location.name || '',
                type: location.type || 'attraction',
                sessionId: location.sessionId
            };

            console.log('🚀 Sending location request:', locationRequest);
            console.log('🔑 Using token:', this.userToken ? `Token present (${this.userToken.substring(0, 20)}...)` : 'No token');
            console.log('🌐 API URL:', `${API_BASE_URL}/api/locations/add`);

            const response = await fetch(`${API_BASE_URL}/api/locations/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userToken}`,
                },
                body: JSON.stringify(locationRequest),
            });

            console.log('📊 Response status:', response.status, response.statusText);
            console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

            // First, check if the response is ok
            if (!response.ok) {
                let errorDetails = 'Unknown error';
                try {
                    // Try to parse as JSON first
                    const errorData = await response.json();
                    errorDetails = errorData.message || errorData.error || JSON.stringify(errorData);
                    console.error('❌ Server error (JSON):', errorData);
                } catch (jsonError) {
                    // If JSON parsing fails, get as text
                    const errorText = await response.text();
                    errorDetails = errorText;
                    console.error('❌ Server error (Text):', errorText);
                }
                
                console.error('❌ Full server error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    details: errorDetails,
                    url: `${API_BASE_URL}/api/locations/add`,
                    request: locationRequest
                });
                
                throw new Error(`Failed to add location (${response.status}): ${errorDetails}`);
            }

            const data = await response.json();
            console.log('✅ Location added successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error adding location:', error);
            
            // Provide more context for common errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
            }
            
            if (error instanceof Error && error.message.includes('JSON')) {
                throw new Error('Server response error: The server returned an invalid response.');
            }
            
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
        if (!sessionId) {
            console.error('❌ Cannot connect WebSocket: Session ID is required');
            return;
        }

        if (this.stompClient?.connected) {
            console.log('WebSocket already connected, subscribing to session:', sessionId);
            // If already connected, just subscribe to the new session
            this.subscribeToSessionWithRetry(sessionId).catch(error => {
                console.error('Failed to subscribe to session:', error);
                if (this.onError) this.onError(error);
            });
            return;
        }

        // Prevent multiple connection attempts
        if (this.connectionStatus === 'connecting') {
            console.log('🔄 Connection already in progress, storing session for pending subscription:', sessionId);
            this.pendingSessionId = sessionId;
            return;
        }
        
        console.log('Initializing WebSocket connection for session:', sessionId);
        this.setConnectionStatus('connecting');
        this.pendingSessionId = sessionId; // Store for later subscription

        // Convert API_BASE_URL to URL object to parse it properly
        const apiUrl = new URL(API_BASE_URL);
        // Set the WebSocket path
        apiUrl.pathname = '/ws';
        const socketUrl = apiUrl.toString();
        
        // For local development only, ensure HTTP for localhost
        const finalSocketUrl = socketUrl.includes('localhost') && process.env.NODE_ENV !== 'production' 
            ? socketUrl.replace('https://localhost', 'http://localhost')
            : socketUrl;

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
                console.log('✅ WebSocket Connected successfully');
                this.wsRetryManager.reset();
                this.setConnectionStatus('connected');
                
                // Subscribe to pending session if available
                if (this.pendingSessionId) {
                    const sessionToSubscribe = this.pendingSessionId;
                    this.pendingSessionId = null; // Clear pending session
                    
                    console.log('🔗 Subscribing to pending session:', sessionToSubscribe);
                    // Use a more reliable approach - subscribe directly since we're in onConnect
                    try {
                        this.subscribeToSession(sessionToSubscribe);
                    } catch (error) {
                        console.error('❌ Direct subscription failed, trying with retry:', error);
                        this.subscribeToSessionWithRetry(sessionToSubscribe).catch(retryError => {
                            console.error('❌ Retry subscription also failed:', retryError);
                            if (this.onError) this.onError(retryError);
                        });
                    }
                }
                
                if (this.onConnect) this.onConnect();
            },
            onStompError: (frame) => {
                console.error('❌ STOMP error:', frame.headers, 'Session:', sessionId);
                this.setConnectionStatus('disconnected');
                this.handleConnectionError().catch(console.error);
            },
            onWebSocketClose: () => {
                console.log('⚠️ WebSocket closed for session:', sessionId);
                this.setConnectionStatus('disconnected');
                this.handleConnectionError().catch(console.error);
                if (this.onDisconnect) this.onDisconnect();
            },
            onWebSocketError: (event: Event) => {
                console.error('🚨 WebSocket error:', event);
                this.setConnectionStatus('disconnected');
                this.handleConnectionError().catch(console.error);
                if (this.onError) this.onError(new Error('WebSocket connection error'));
            },
        });

        this.stompClient.activate();
    }

    private subscribeToSession(sessionId: string): void {
        if (!sessionId) {
            throw new Error('Session ID is required for subscription');
        }

        if (!this.stompClient) {
            throw new Error('STOMP client is not initialized. Please ensure WebSocket connection is established.');
        }

        if (!this.stompClient.connected) {
            const stateMap = {
                0: 'CONNECTING',
                1: 'OPEN', 
                2: 'CLOSING',
                3: 'CLOSED'
            };
            throw new Error(`Cannot subscribe: WebSocket not connected (state: ${this.stompClient.state} - ${stateMap[this.stompClient.state] || 'UNKNOWN'})`);
        }

        try {
            console.log(`🔗 Attempting to subscribe to /topic/locations/${sessionId}`);
            
            const subscription = this.stompClient.subscribe(`/topic/locations/${sessionId}`, (message) => {
                try {
                    console.log('📥 Received WebSocket message:', message.body);
                    const event: WebSocketEvent<LocationAddedPayload | LocationRemovedPayload | MapClearedPayload> = JSON.parse(message.body);
                    this.messageHandlers.forEach(handler => handler(event));
                    console.log('✅ Processed WebSocket event:', event.type);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error, 'Message body:', message.body);
                }
            });

            // Verify subscription was successful
            if (subscription) {
                console.log('✅ Successfully subscribed to session:', sessionId);
            } else {
                throw new Error('Subscription returned null/undefined - server may have rejected the subscription');
            }
        } catch (error) {
            console.error('❌ Error subscribing to session:', error);
            throw error;
        }
    }

    private async subscribeToSessionWithRetry(sessionId: string, maxRetries: number = 5, delayMs: number = 300): Promise<void> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // More comprehensive check for STOMP client readiness
                if (this.stompClient && 
                    this.stompClient.connected && 
                    this.stompClient.state === 1) { // CONNECTED state
                    
                    console.log(`✅ STOMP client ready for subscription, attempt ${attempt}`);
                    
                    // Try to subscribe - catch any errors from subscribeToSession
                    try {
                        this.subscribeToSession(sessionId);
                        console.log(`✅ Successfully subscribed to session ${sessionId} on attempt ${attempt}`);
                        return; // Success, exit the retry loop
                    } catch (subscribeError) {
                        console.warn(`⚠️ Subscription failed on attempt ${attempt}:`, subscribeError);
                        if (attempt === maxRetries) {
                            throw subscribeError;
                        }
                        // Continue to next attempt
                    }
                } else {
                    console.warn(`⚠️ WebSocket not ready for subscription, attempt ${attempt}/${maxRetries}`, {
                        connected: this.stompClient?.connected,
                        state: this.stompClient?.state,
                        active: this.stompClient?.active,
                        exists: !!this.stompClient
                    });
                    
                    // If no STOMP client exists, try to reinitialize connection
                    if (!this.stompClient && attempt === 1) {
                        console.log('🔄 No STOMP client found, reinitializing connection...');
                        this.connectWebSocket(sessionId);
                        await new Promise(resolve => setTimeout(resolve, delayMs * 2)); // Give more time for connection
                        continue;
                    }
                }
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Exponential backoff
                }
            } catch (error) {
                console.error(`❌ Subscription attempt ${attempt}/${maxRetries} failed:`, error);
                if (attempt === maxRetries) {
                    console.error(`❌ All subscription attempts failed for session ${sessionId}`);
                    throw error;
                }
                // Wait before next attempt with exponential backoff
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
        throw new Error(`Failed to subscribe to session ${sessionId} after ${maxRetries} attempts`);
    }

    private async handleConnectionError(): Promise<void> {
        this.setConnectionStatus('connecting');
        
        if (await this.wsRetryManager.shouldRetry()) {
            console.log(`⚡ Reconnection attempt ${this.wsRetryManager.getRetryCount()}/${5}`);
            // Force reconnection after a delay
            if (this.stompClient) {
                this.stompClient.deactivate();
                this.stompClient.activate();
            }
        } else {
            console.error('❌ Max reconnection attempts reached. Please refresh the page.');
            this.setConnectionStatus('disconnected');
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
            this.pendingSessionId = null; // Clear pending session
            this.setConnectionStatus('disconnected');
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
