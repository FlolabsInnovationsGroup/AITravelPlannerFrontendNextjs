/**
 * Global service configuration
 * Contains settings for APIs, maps, and WebSocket connections
 */
export const serviceConfig = {
    api: {
        timeout: 10000, // 10 seconds
        retryConfig: {
            maxRetries: 3,
            initialDelay: 1000, // 1 second
            maxDelay: 10000, // 10 seconds
            // Only retry on network errors or 5xx server errors
            retryableStatuses: [500, 502, 503, 504]
        }
    },
    maps: {
        defaultCenter: { lat: 0, lng: 0 },
        defaultZoom: 2,
        maxClusterZoom: 14,
        markerCluster: {
            maxZoom: 14,
            minClusterSize: 2,
            gridSize: 60
        }
    },
    websocket: {
        reconnectAttempts: 5,
        reconnectInterval: 2000, // 2 seconds
        maxReconnectDelay: 30000 // 30 seconds
    }
} as const;

// Type definitions for the config
export type ServiceConfig = typeof serviceConfig;
export type ApiConfig = ServiceConfig['api'];
export type MapsConfig = ServiceConfig['maps'];
export type WebSocketConfig = ServiceConfig['websocket'];
