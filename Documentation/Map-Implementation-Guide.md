# AI Travel Planner - Map Implementation Guide

## Overview

The map feature in the AI Travel Planner is a sophisticated, real-time mapping system that integrates with the backend to display locations mentioned in chat conversations. It uses MapBox GL JS for rendering and WebSockets for real-time updates.

## Architecture Overview

```
Frontend (Next.js)          Backend (Spring Boot)
┌─────────────────────┐     ┌──────────────────────┐
│   RightMapPanel     │     │   Location API       │
│        ↓            │     │         ↓            │
│   MapBoxComponent   │←────┤   WebSocket Server   │
│        ↓            │     │         ↓            │
│    MapService       │     │   Location Service   │
└─────────────────────┘     └──────────────────────┘
```

## Frontend Components

### 1. RightMapPanel.tsx

**Purpose**: Main container component that manages map state and handles WebSocket connections.

**Key Features**:
- Manages loading states
- Handles WebSocket connections for real-time updates
- Passes session data to MapBoxComponent
- Error handling and user feedback

**Key State Variables**:
```typescript
const [locations, setLocations] = useState<Location[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**WebSocket Integration**:
- Connects to `ws://localhost:8080/ws` (development) or production URL
- Subscribes to `/topic/locations/{sessionId}` for real-time location updates
- Automatically reconnects on connection loss

### 2. MapBoxComponent.tsx

**Purpose**: Core map rendering component using MapBox GL JS.

**Key Features**:
- Renders interactive map with custom styling
- Displays location markers with popups
- Handles different location types (ACCOMMODATION, RESTAURANT, ATTRACTION, etc.)
- Responsive design with full viewport coverage

**Map Configuration**:
```typescript
const mapboxgl = require('mapbox-gl');
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Map initialization
const map = new mapboxgl.Map({
  container: mapRef.current,
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [defaultLng, defaultLat],
  zoom: defaultZoom
});
```

**Marker System**:
- Custom markers for different location types
- Popup windows showing location details
- Automatic map bounds adjustment to fit all markers

### 3. MapService.ts

**Purpose**: Service layer handling API communication and WebSocket management.

**Key Methods**:

#### `getLocationsBySession(sessionId: string)`
- Fetches existing locations for a session from REST API
- Endpoint: `GET /api/locations/{sessionId}`
- Returns array of Location objects

#### `connectWebSocket(sessionId: string, onLocationUpdate: callback)`
- Establishes WebSocket connection
- Subscribes to location updates for specific session
- Handles connection errors and reconnection

#### `disconnectWebSocket()`
- Cleanly closes WebSocket connection
- Unsubscribes from all topics

## Backend Integration

### Location Entity Structure

```typescript
interface Location {
  id: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  name?: string;
  type?: LocationType;
  address?: string;
  description?: string;
  createdAt?: string;
}

enum LocationType {
  ACCOMMODATION = 'ACCOMMODATION',
  RESTAURANT = 'RESTAURANT',
  ATTRACTION = 'ATTRACTION',
  TRANSPORT = 'TRANSPORT',
  SHOPPING = 'SHOPPING',
  ENTERTAINMENT = 'ENTERTAINMENT'
}
```

### API Endpoints

#### GET /api/locations/{sessionId}
- **Purpose**: Retrieve all locations for a specific chat session
- **Response**: Array of Location objects
- **Authentication**: Required (Bearer token)

#### WebSocket Endpoint: /ws
- **Purpose**: Real-time location updates
- **Subscription**: `/topic/locations/{sessionId}`
- **Message Format**: JSON Location object

## Data Flow

### 1. Initial Load Process

```
1. User opens chat session
2. RightMapPanel mounts
3. MapService.getLocationsBySession() called
4. REST API returns existing locations
5. MapBoxComponent renders markers
6. WebSocket connection established
```

### 2. Real-time Update Process

```
1. User sends chat message mentioning location
2. Backend AI processes message
3. Backend extracts location entities
4. Backend saves locations to database
5. Backend broadcasts location via WebSocket
6. Frontend receives WebSocket message
7. MapBoxComponent adds new marker
8. Map automatically adjusts bounds
```

## Environment Configuration

### Development Environment
```bash
# .env.development
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZmxvbWFkaWFucyIsImEiOiJjbTY0NTRmNnYxZ3BqMmxvamw2Zm83eWUxIn0.A3nvSGkZstims6lfVtaTfw
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Production Environment
```bash
# .env.production
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZmxvbWFkaWFucyIsImEiOiJjbTY0NTRmNnYxZ3BqMmxvamw2Zm83eWUxIn0.A3nvSGkZstims6lfVtaTfw
NEXT_PUBLIC_API_URL=https://api.flomadtravel.com
```

## Error Handling

### Frontend Error Scenarios

1. **MapBox Token Issues**:
   - Invalid or missing token shows error message
   - Map fails to load gracefully

2. **WebSocket Connection Failures**:
   - Automatic reconnection attempts
   - User notification of connection status
   - Fallback to polling if WebSocket fails

3. **API Failures**:
   - Loading states during API calls
   - Error messages for failed requests
   - Retry mechanisms for transient failures

### Backend Error Scenarios

1. **Location Extraction Failures**:
   - AI fails to extract locations from message
   - Invalid location data from external APIs
   - Database save failures

2. **WebSocket Issues**:
   - Client disconnections
   - Message delivery failures
   - Topic subscription errors

## Performance Considerations

### Frontend Optimizations

1. **Lazy Loading**:
   - MapBox GL JS loaded only when needed
   - Markers rendered progressively

2. **Memory Management**:
   - Proper cleanup of map instances
   - WebSocket connection disposal

3. **Debouncing**:
   - Map interaction events debounced
   - API calls throttled

### Backend Optimizations

1. **Caching**:
   - Location data cached per session
   - External API responses cached

2. **Database Indexing**:
   - sessionId indexed for fast queries
   - Geospatial indexes for location queries

## Testing Strategy

### Unit Tests

1. **MapService Tests**:
   - API call success/failure scenarios
   - WebSocket connection handling
   - Data transformation logic

2. **Component Tests**:
   - Map rendering with mock data
   - Marker placement accuracy
   - User interaction handling

### Integration Tests

1. **End-to-End Scenarios**:
   - Complete chat-to-map workflow
   - Real-time update verification
   - Cross-browser compatibility

2. **WebSocket Testing**:
   - Connection stability tests
   - Message delivery verification
   - Reconnection behavior

## Troubleshooting Guide

### Common Issues

1. **Map Not Loading**:
   - Check MapBox access token
   - Verify environment variables
   - Check browser console for errors

2. **Markers Not Appearing**:
   - Verify API connectivity
   - Check sessionId validity
   - Confirm location data format

3. **Real-time Updates Not Working**:
   - Check WebSocket connection status
   - Verify backend WebSocket configuration
   - Test with browser developer tools

### Debug Commands

```bash
# Check environment variables
echo $NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
echo $NEXT_PUBLIC_API_URL

# Test API connectivity
curl http://localhost:8080/api/locations/{sessionId}

# WebSocket testing (using wscat)
wscat -c ws://localhost:8080/ws
```

## Future Enhancements

1. **Advanced Features**:
   - Route planning between locations
   - Clustering for multiple nearby locations
   - Street view integration

2. **Performance Improvements**:
   - Vector tile caching
   - Lazy loading of location details
   - Progressive enhancement

3. **User Experience**:
   - Custom map themes
   - Location search functionality
   - Offline map support

## Dependencies

### Frontend Dependencies
```json
{
  "mapbox-gl": "^3.10.0",
  "@stomp/stompjs": "^7.0.0",
  "sockjs-client": "^1.6.1",
  "axios": "^1.7.7"
}
```

### Backend Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-messaging</artifactId>
</dependency>
```

## Security Considerations

1. **API Security**:
   - JWT token authentication required
   - Rate limiting on API endpoints
   - Input validation for location data

2. **WebSocket Security**:
   - Origin validation for WebSocket connections
   - Session-based subscription authorization
   - Message encryption for sensitive data

3. **MapBox Token Security**:
   - Public token with restricted scopes
   - Referrer restrictions configured
   - Regular token rotation

## Monitoring and Analytics

1. **Performance Metrics**:
   - Map load times
   - WebSocket connection success rates
   - API response times

2. **User Behavior**:
   - Map interaction patterns
   - Location click-through rates
   - Session duration on map

3. **Error Tracking**:
   - JavaScript errors in map components
   - WebSocket connection failures
   - API error rates and patterns

---

This documentation provides a comprehensive overview of the map implementation. For specific implementation details, refer to the individual component files and service classes.
