import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Location, WebSocketEvent, LocationAddedPayload, LocationRemovedPayload, MapClearedPayload } from '@/types/map';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;  // Non-null assertion as this is required

export class MapService {
    private stompClient: Client | null = null;
    private messageHandlers: ((event: WebSocketEvent<any>) => void)[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    constructor(private userToken: string) { }

    // REST API Methods
    async getLocations(sessionId: string): Promise<Location[]> {
        const response = await fetch(`${API_BASE_URL}/api/locations/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${this.userToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch locations');
        }

        return response.json();
    }

    async addLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
        const response = await fetch(`${API_BASE_URL}/api/locations/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.userToken}`,
            },
            body: JSON.stringify(location),
        });

        if (!response.ok) {
            throw new Error('Failed to add location');
        }

        return response.json();
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
            console.log('WebSocket already connected');
            return;
        }

        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
        const socketUrl = `${protocol}://${API_BASE_URL.replace('http://', '').replace('https://', '')}/ws`;

        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: `Bearer ${this.userToken}`,
            },
            onConnect: () => {
                console.log('WebSocket Connected');
                this.reconnectAttempts = 0;
                this.subscribeToSession(sessionId);
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message']);
                this.handleConnectionError();
            },
            onWebSocketClose: () => {
                console.log('WebSocket closed');
                this.handleConnectionError();
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
                const event: WebSocketEvent<LocationAddedPayload | LocationRemovedPayload | MapClearedPayload> = JSON.parse(message.body);
                this.messageHandlers.forEach(handler => handler(event));
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });
    }

    private handleConnectionError(): void {
        this.reconnectAttempts++;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    onMessage(handler: (event: WebSocketEvent<any>) => void): void {
        this.messageHandlers.push(handler);
    }

    disconnect(): void {
        this.stompClient?.deactivate();
        this.stompClient = null;
        this.messageHandlers = [];
    }
}
