import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Location, WebSocketEvent, LocationAddedPayload, LocationRemovedPayload, MapClearedPayload } from '@/types/map';
import { RetryMechanism, WebSocketRetryManager } from '@/utils/RetryMechanism';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;  // Non-null assertion as this is required

export class MapService {
    private static instance: MapService | null = null;
    
    private stompClient: Client | null = null;

    private messageHandlers: ((event: WebSocketEvent<any>) => void)[] = [];

    // 🔒 FIX 4.1: Track absolute reconnection attempts to prevent infinite loop
    private absoluteReconnectAttempts = 0;
    private readonly MAX_ABSOLUTE_RECONNECTS = 10; // Hard limit - stops completely after 10 attempts
    private wsRetryManager = new WebSocketRetryManager(5, 1000);
    
    // 🔒 FIX 4.2: Connection timeout tracking
    private connectionTimeoutTimer: NodeJS.Timeout | null = null;
    private readonly CONNECTION_TIMEOUT_MS = 30000; // 30 seconds

    private mapInstance: google.maps.Map | null = null;

    private markers: google.maps.Marker[] = [];

    private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

    private pendingSessionId: string | null = null; // Store session ID for subscription after connection
    
    private currentSubscription: any | null = null; // Track current session subscription
    private currentSessionId: string | null = null; // Track currently subscribed session ID
    
    // Event handlers
    onConnect: (() => void) | null = null;

    onDisconnect: (() => void) | null = null;

    onError: ((error: Error) => void) | null = null;

    onMessage: ((event: WebSocketEvent<any>) => void) | null = null;

    onConnectionStatusChange: ((status: 'disconnected' | 'connecting' | 'connected') => void) | null = null;

    private constructor(private userToken: string) { }
    
    // Singleton pattern: Get or create instance
    public static getInstance(userToken: string): MapService {
        if (!MapService.instance) {
            MapService.instance = new MapService(userToken);
        } else if (MapService.instance.userToken !== userToken) {
            // Update token if changed
            MapService.instance.updateToken(userToken);
        }
        return MapService.instance;
    }
    
    // Reset singleton (useful for testing or logout)
    public static resetInstance(): void {
        if (MapService.instance) {
            MapService.instance.disconnect();
            MapService.instance = null;
        }
    }

    // Production-ready error logging
    private logError(context: string, error: any): void {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`MapService[${context}]:`, error);
        }
    }

    // Update user token (useful for token refresh)
    updateToken(newToken: string): void {
        this.userToken = newToken;
    }

    // Get current connection status
    getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
        return this.connectionStatus;
    }

    // Enhanced connection status management with metrics
    private setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected') {
        if (this.connectionStatus !== status) {
            this.connectionStatus = status;
            
            // Reset retry manager on successful connection
            if (status === 'connected') {
                this.wsRetryManager.reset();
                // Note: Don't subscribe here - let onConnect callback handle it with proper delay
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

            // Timeout warning with proper cleanup
            const timeoutRef = setTimeout(() => {
                this.logError('addLocation', 'Request timeout after 45 seconds - server may be slow or unavailable');
            }, 45000); // 45 second warning for slow API responses

            const response = await fetch(`${API_BASE_URL}/api/locations/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userToken}`,
                },
                body: JSON.stringify(locationRequest),
            });

            // Clear timeout since request completed
            clearTimeout(timeoutRef);

            // First, check if the response is ok
            if (!response.ok) {
                let errorDetails = 'Unknown error';
                try {
                    // Read response text first, then try to parse as JSON
                    const responseText = await response.text();
                    try {
                        const errorData = JSON.parse(responseText);
                        errorDetails = errorData.message || errorData.error || JSON.stringify(errorData);
                    } catch (jsonParseError) {
                        // If JSON parsing fails, use the text directly
                        errorDetails = responseText;
                    }
                } catch (textError) {
                    errorDetails = `Response read error: ${textError instanceof Error ? textError.message : String(textError)}`;
                }
                
                // Log error for monitoring while maintaining user-friendly error messages
                
                throw new Error(`Failed to add location (${response.status}): ${errorDetails}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            
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
            return;
        }
        
        // 🔒 FIX 4.1: Check absolute reconnection limit
        if (this.absoluteReconnectAttempts >= this.MAX_ABSOLUTE_RECONNECTS) {
            this.logError('connectWebSocket', `Maximum reconnection attempts (${this.MAX_ABSOLUTE_RECONNECTS}) exceeded. Please refresh the page.`);
            if (this.onError) {
                this.onError(new Error('WebSocket reconnection limit exceeded. Please refresh the page.'));
            }
            return;
        }

        if (this.stompClient?.connected) {
            // ✅ FIX: Unsubscribe from old session before subscribing to new one
            if (this.currentSubscription && this.currentSessionId !== sessionId) {
                console.log(`🔄 Unsubscribing from old session: ${this.currentSessionId}`);
                try {
                    this.currentSubscription.unsubscribe();
                    this.currentSubscription = null;
                    this.currentSessionId = null;
                } catch (error) {
                    console.warn('⚠️ Error unsubscribing from old session:', error);
                }
            }
            
            // If already connected, just subscribe to the new session
            this.subscribeToSessionWithRetry(sessionId).catch(error => {
                if (this.onError) this.onError(error);
            });
            return;
        }

        // Prevent multiple connection attempts
        if (this.connectionStatus === 'connecting') {
            this.pendingSessionId = sessionId;
            return;
        }
        
        this.setConnectionStatus('connecting');
        this.pendingSessionId = sessionId; // Store for later subscription
        
        // 🔒 FIX 4.1: Increment absolute reconnection counter
        this.absoluteReconnectAttempts += 1;
        
        // 🔒 FIX 4.2: Set connection timeout
        this.connectionTimeoutTimer = setTimeout(() => {
            if (this.connectionStatus === 'connecting') {
                this.logError('connectWebSocket', 'Connection timeout after 30 seconds');
                this.setConnectionStatus('disconnected');
                if (this.stompClient) {
                    this.stompClient.deactivate();
                }
                if (this.onError) {
                    this.onError(new Error('WebSocket connection timeout'));
                }
            }
        }, this.CONNECTION_TIMEOUT_MS);

        // Convert API_BASE_URL to URL object to parse it properly
        const apiUrl = new URL(API_BASE_URL);
        // Set the WebSocket path
        apiUrl.pathname = '/ws';
        const socketUrl = apiUrl.toString();
        
        // For local development only, ensure HTTP for localhost
        const finalSocketUrl = socketUrl.includes('localhost') && process.env.NODE_ENV !== 'production' 
            ? socketUrl.replace('https://localhost', 'http://localhost')
            : socketUrl;

        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(finalSocketUrl, null, {
                transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
                timeout: 30000, // Increased timeout to 30 seconds for better stability
            }),
            connectHeaders: {
                Authorization: `Bearer ${this.userToken}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000, // Increased heartbeat intervals
            heartbeatOutgoing: 10000,
            debug: () => {
                // Debug disabled in production
            },
            onConnect: () => {
                console.log('✅ WebSocket connected');
                
                // 🔒 FIX 4.2: Clear connection timeout on successful connect
                if (this.connectionTimeoutTimer) {
                    clearTimeout(this.connectionTimeoutTimer);
                    this.connectionTimeoutTimer = null;
                }
                
                // 🔒 FIX 4.1: Reset absolute reconnect counter on successful connection
                this.absoluteReconnectAttempts = 0;
                
                this.wsRetryManager.reset();
                this.setConnectionStatus('connected');
                
                // 🔒 FIX: Subscribe to pending session with proper sequencing
                // Store session ID locally before clearing it
                const sessionToSubscribe = this.pendingSessionId;
                
                if (sessionToSubscribe) {
                    console.log(`🔔 Preparing to subscribe to session: ${sessionToSubscribe}`);
                    
                    // Clear pending session ID immediately to prevent duplicate subscriptions
                    this.pendingSessionId = null;
                    
                    // 🔒 CRITICAL FIX: Wait longer for STOMP broker to be fully ready
                    // The STOMP 'connected' event fires before the broker is ready for subscriptions
                    // Use 2.5 seconds delay and increased retry attempts for better reliability
                    setTimeout(async () => {
                        if (this.stompClient?.connected) {
                            try {
                                console.log(`🔄 STOMP client confirmed connected (state: ${this.stompClient.state}), subscribing to: ${sessionToSubscribe}`);
                                // Use 10 retries with 500ms base delay for aggressive retry on initial connection
                                await this.subscribeToSessionWithRetry(sessionToSubscribe, 10, 500);
                                console.log(`✅ Successfully subscribed after connection`);
                            } catch (error) {
                                console.error('❌ Failed to subscribe to session after connection:', error);
                                if (this.onError) this.onError(error instanceof Error ? error : new Error(String(error)));
                            }
                        } else {
                            console.warn('⚠️ STOMP client no longer connected when attempting subscription');
                        }
                    }, 2500); // Increased from 2000ms to 2500ms for better reliability
                }
                
                // Call onConnect callback after a short delay
                setTimeout(() => {
                    if (this.onConnect) this.onConnect();
                }, 500);
            },
            onStompError: () => {
                this.setConnectionStatus('disconnected');
                this.handleConnectionError().catch(() => {});
            },
            onWebSocketClose: () => {
                this.setConnectionStatus('disconnected');
                this.handleConnectionError().catch(() => {});
                if (this.onDisconnect) this.onDisconnect();
            },
            onWebSocketError: () => {
                this.setConnectionStatus('disconnected');
                this.handleConnectionError().catch(() => {});
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

        // 🔒 CRITICAL FIX: Only check 'connected' property - STOMP.js 'state' is unreliable
        // The 'state' property often stays at 0 (CONNECTING) even when connection is established
        const isActuallyConnected = this.stompClient.connected;
        
        if (!isActuallyConnected) {
            const stompState = this.stompClient.state;
            const stateMap = {
                0: 'CONNECTING',
                1: 'OPEN', 
                2: 'CLOSING',
                3: 'CLOSED'
            };
            const currentState = stateMap[stompState] || 'UNKNOWN';
            
            // 🔒 CRITICAL FIX: Throw error and let retry logic handle it
            // Don't rely on state property - only use 'connected' boolean
            console.warn(`⚠️ Cannot subscribe to ${sessionId}: STOMP client not connected (connected=${isActuallyConnected}, state=${stompState}/${currentState})`);
            throw new Error(`Cannot subscribe: WebSocket not connected (state: ${currentState})`);
        }

        // ✅ FIX: Store subscription and session ID for later unsubscription
        const subscription = this.stompClient.subscribe(`/topic/locations/${sessionId}`, (message) => {
            try {
                const event: WebSocketEvent<LocationAddedPayload | LocationRemovedPayload | MapClearedPayload> = JSON.parse(message.body);
                this.messageHandlers.forEach(handler => handler(event));
            } catch (error) {
                // Silently handle message parsing errors - may be due to network issues
            }
        });

        // Verify subscription was successful
        if (subscription) {
            // ✅ Store subscription for later unsubscription when switching sessions
            this.currentSubscription = subscription;
            this.currentSessionId = sessionId;
            console.log(`✅ Subscribed to session: ${sessionId}`);
        } else {
            throw new Error('Subscription returned null/undefined - server may have rejected the subscription');
        }
    }

    private async subscribeToSessionWithRetry(sessionId: string, maxRetries: number = 10, delayMs: number = 500): Promise<void> {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Starting WebSocket subscription for session ${sessionId}`);
        }
        
        // Sequential retry logic - await in loop is intentional for retry pattern
        // eslint-disable-next-line no-plusplus
        for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
            try {
                // 🔒 CRITICAL FIX: Only check 'connected' property, NOT state
                // STOMP.js 'state' property is unreliable and doesn't update correctly
                const hasClient = !!this.stompClient;
                const isConnected = hasClient && this.stompClient?.connected;
                const stompState = hasClient ? this.stompClient?.state : -1;
                
                // Only log detailed state on first attempt or if development
                if (attempt === 1 || process.env.NODE_ENV === 'development') {
                    console.log(`🔄 Subscription attempt ${attempt}/${maxRetries}: client=${hasClient}, connected=${isConnected}, state=${stompState}`);
                }
                
                // ✅ CRITICAL FIX: Only check 'connected' property - ignore unreliable 'state'
                // The 'state' property often stays at 0 even when connection is established
                if (hasClient && isConnected) {
                    // Give STOMP a moment to fully initialize after connection
                    // Increased from 300ms to 500ms for better stability
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(resolve => {
                        setTimeout(() => resolve(undefined), 500);
                    });
                    
                    // Try to subscribe
                    try {
                        this.subscribeToSession(sessionId);
                        console.log(`✅ Successfully subscribed to session ${sessionId} on attempt ${attempt}`);
                        return; // Success!
                    } catch (subscribeError) {
                        console.warn(`⚠️ Subscription attempt ${attempt} failed:`, subscribeError);
                        if (attempt === maxRetries) {
                            throw subscribeError;
                        }
                        // Continue to next attempt
                    }
                } else if (!hasClient && attempt === 1) {
                    // If no STOMP client exists, this is an error - can't reinitialize here
                    console.error(`❌ No STOMP client available for subscription`);
                    throw new Error('STOMP client not initialized');
                } else {
                    // Client exists but not connected yet - wait for it
                    if (attempt === 1) {
                        console.log(`⏳ Waiting for WebSocket connection (state: ${stompState}, connected: ${isConnected})...`);
                    }
                }
                
                // Wait before next attempt with exponential backoff
                if (attempt < maxRetries) {
                    const waitTime = Math.min(delayMs * Math.pow(1.5, attempt - 1), 5000); // Exponential backoff, cap at 5s
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(resolve => {
                        setTimeout(() => resolve(undefined), waitTime);
                    });
                }
            } catch (error) {
                console.error(`❌ Subscription exception on attempt ${attempt}:`, error);
                if (attempt === maxRetries) {
                    throw error;
                }
                // Wait before next attempt
                const waitTime = Math.min(delayMs * Math.pow(1.5, attempt - 1), 5000);
                // eslint-disable-next-line no-await-in-loop
                await new Promise(resolve => {
                    setTimeout(() => resolve(undefined), waitTime);
                });
            }
        }
        console.error(`❌ Failed to subscribe to session ${sessionId} after ${maxRetries} attempts`);
        throw new Error(`Failed to subscribe to session ${sessionId} after ${maxRetries} attempts`);
    }

    private async handleConnectionError(): Promise<void> {
        // 🔒 FIX 4.1: Check absolute reconnection limit before retrying
        if (this.absoluteReconnectAttempts >= this.MAX_ABSOLUTE_RECONNECTS) {
            this.logError('handleConnectionError', 'Maximum absolute reconnection attempts reached');
            this.setConnectionStatus('disconnected');
            if (this.onError) {
                this.onError(new Error('Maximum reconnection attempts exceeded'));
            }
            return;
        }
        
        // Enhanced error handling (Audit Implementation)
        const shouldRetry = await this.wsRetryManager.shouldRetry();
        
        // Check network connectivity before retrying
        if (!navigator.onLine) {
            this.setConnectionStatus('disconnected');
            
            // Listen for network restoration
            const onlineHandler = () => {
                window.removeEventListener('online', onlineHandler);
                
                if (this.pendingSessionId) {
                    this.connectWebSocket(this.pendingSessionId);
                }
            };
            
            window.addEventListener('online', onlineHandler);
            return;
        }
        
        if (shouldRetry) {
            this.setConnectionStatus('connecting');
            
            // Enhanced retry with server health check
            try {
                const healthCheck = await this.performHealthCheck();
                if (!healthCheck) {
                    // Wait longer if server is unhealthy
                    await new Promise(resolve => {
                        setTimeout(() => resolve(undefined), 5000);
                    });
                }
                
                // Force reconnection after a delay
                if (this.stompClient) {
                    this.stompClient.deactivate();
                    setTimeout(() => {
                        if (this.stompClient) {
                            this.stompClient.activate();
                        }
                    }, 2000); // Small delay to ensure proper cleanup
                }
            } catch (error) {
                this.setConnectionStatus('disconnected');
            }
        } else {
            this.setConnectionStatus('disconnected');
            this.disconnect(); // Clean up the connection
            
            if (this.onError) {
                this.onError(new Error('WebSocket connection failed permanently after maximum retries'));
            }
        }
    }

    // Enhanced health check for better retry decisions
    private async performHealthCheck(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch(`${API_BASE_URL}/api/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.userToken}`,
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
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
            // ✅ FIX: Unsubscribe from current session when disconnecting
            if (this.currentSubscription) {
                console.log(`🔌 Unsubscribing from session: ${this.currentSessionId}`);
                try {
                    this.currentSubscription.unsubscribe();
                } catch (error) {
                    console.warn('⚠️ Error unsubscribing during disconnect:', error);
                }
                this.currentSubscription = null;
                this.currentSessionId = null;
            }
            
            // Attempt to gracefully close the connection
            if (this.stompClient?.connected) {
                this.stompClient.deactivate();
            }
        } catch (error) {
            // Silently handle disconnect errors
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
            
            // 🔒 FIX 4.2: Clear connection timeout timer
            if (this.connectionTimeoutTimer) {
                clearTimeout(this.connectionTimeoutTimer);
                this.connectionTimeoutTimer = null;
            }
            
            // 🔒 FIX 4.1: Reset absolute reconnection counter on manual disconnect
            this.absoluteReconnectAttempts = 0;
        }
    }

    // Google Maps Methods
    setMapInstance(map: google.maps.Map): void {
        this.mapInstance = map;
        this.onMapInitialized();
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
            if (this.onConnect) this.onConnect();
        });

        google.maps.event.addListenerOnce(this.mapInstance, 'error', () => {
            if (this.onError) this.onError(new Error('Failed to load Google Maps'));
        });
    }

    addMarkerToMap(location: { lat: number; lng: number }, title?: string): void {
        if (!this.mapInstance) {
            const error = new Error('Map instance is not set. Please initialize the map.');
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
        } catch (error) {
            if (this.onError) this.onError(error as Error);
        }
    }

    removeMarkerFromMap(location: { lat: number; lng: number }): void {
        if (!this.mapInstance) {
            const error = new Error('Map instance is not set. Please initialize the map.');
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
            } else {
                // No marker found at location - silently handle
            }
        } catch (error) {
            if (this.onError) this.onError(error as Error);
        }
    }

    clearAllMarkers(): void {
        if (!this.mapInstance) {
            // Silently clear markers array even if map isn't initialized
            // This prevents errors during session transitions before map loads
            this.markers = [];
            return;
        }

        try {
            this.markers.forEach((marker) => marker.setMap(null));
            this.markers = [];
        } catch (error) {
            if (this.onError) this.onError(error as Error);
        }
    }

    centerMapOnLocation(location: { lat: number; lng: number }): void {
        if (!this.mapInstance) {
            const error = new Error('Map instance is not set. Please initialize the map.');
            if (this.onError) this.onError(error);
            return;
        }

        try {
            this.mapInstance.panTo(location);
            this.mapInstance.setZoom(14); // Set appropriate zoom level
        } catch (error) {
            if (this.onError) this.onError(error as Error);
        }
    }
}
