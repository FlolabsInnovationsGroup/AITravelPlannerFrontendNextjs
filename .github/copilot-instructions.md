# AI Travel Planner - Copilot Instructions

## Project Overview
This is a **full-stack AI travel planning application** with a Next.js frontend and Spring Boot backend, featuring real-time map integration, AI-powered chat assistance, and comprehensive travel services.

## Architecture & Tech Stack

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui
- **Maps**: Google Maps integration with custom clustering and real-time updates
- **State**: React Context (AuthContext) + WebSocket for real-time location sync
- **API**: Axios with JWT auth interceptors + guest token fallback
- **Tests**: Jest with React Testing Library, map-specific test utilities

### Backend (Spring Boot 3.2.9)
- **Framework**: Spring Boot with Spring AI, Spring Security, WebSocket
- **AI**: OpenAI GPT-3.5-turbo with 9+ function calling capabilities
- **Database**: MongoDB with Mongock migrations
- **APIs**: Google Places, Amadeus flights, Viator tours, WeatherAPI
- **Auth**: JWT + OAuth2 (Google, LinkedIn, Facebook) + guest sessions

## Key Development Patterns

### 1. Authentication Flow
```typescript
// Guest-first approach: Always ensure user has a token
const initializeAuth = async () => {
  let token = getToken();
  if (!token) {
    token = await createGuestToken(); // Fallback to guest
    setToken(token);
  }
  // Continue with user session setup
};
```

**Convention**: Every API call automatically includes Bearer token; 401 responses trigger guest token refresh.

### 2. Map Integration Architecture
```typescript
// WebSocket + Google Maps integration pattern
const RightMapPanel = () => {
  // 1. Connect WebSocket for session-based location updates
  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_URL}/ws`),
    connectHeaders: { Authorization: `Bearer ${token}` }
  });
  
  // 2. Subscribe to location events for current session
  client.subscribe(`/topic/locations/${sessionId}`, handleLocationEvent);
  
  // 3. Update map markers in real-time
  const handleLocationEvent = (event) => {
    if (event.type === 'LOCATION_ADDED') {
      setLocations(prev => [...prev, event.payload]);
    }
  };
};
```

**Pattern**: WebSocket events drive map state, not direct API polling. Each session has isolated location management.

### 3. AI Function Calling Integration
```java
// Backend: Spring AI function registration
@Component
@Description("Searches for flights using natural language queries")
public class FlightSearchFunction implements Function<FlightRequest, FlightResponse> {
  @Override
  public FlightResponse apply(FlightRequest request) {
    // Convert cities to IATA codes, call Amadeus API
    return amadeusService.searchFlights(request);
  }
}
```

**Convention**: Each AI function is a Spring component with detailed @Description. Functions automatically register with Spring AI for GPT function calling.

### 4. Environment Configuration
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key

# Backend (.env)
SPRING_AI_OPENAI_API_KEY=your_openai_key
AMADEUS_API_KEY=your_amadeus_key
GOOGLE_API_KEY=your_google_key
JWT_SECRET=your_jwt_secret
```

**Critical**: Use `scripts/checkEnv.ts` to validate all required environment variables before development.

## Development Workflows

### Frontend Development
```bash
# Start with environment check
pnpm run check-env

# Development server
pnpm dev  # http://localhost:3000

# Testing
pnpm test                    # All tests
pnpm run test:map           # Map component tests only
pnpm run test:map:coverage  # Coverage for map/services
```

### Backend Development
```bash
# Local development (requires MongoDB running)
mvn spring-boot:run

# Docker setup (full stack)
docker-compose up  # Includes MongoDB, Elasticsearch, Logstash
```

### Testing Patterns
```typescript
// Map component testing with mocked Google Maps
const mockGoogleMaps = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    InfoWindow: jest.fn(),
    // Mock all required Google Maps APIs
  }
};

// Always test WebSocket integration
expect(mockMapService.addMessageHandler).toHaveBeenCalledWith(
  expect.any(Function)
);
```

## Critical Integration Points

### 1. Real-time Communication
- **Frontend**: STOMP client over SockJS connects to `/ws` with Bearer auth
- **Backend**: Session-based WebSocket topics (`/topic/locations/{sessionId}`)
- **Events**: `LOCATION_ADDED`, `LOCATION_REMOVED`, `MAP_CLEARED`

### 2. AI Chat → Map Integration
```java
// Backend: Location extraction from chat messages
@Component
public class LocationExtractionService {
  public void extractAndAddLocation(String message, String sessionId) {
    // 1. Use Spring AI to extract location entities
    // 2. Geocode with Google Places API
    // 3. Save to MongoDB with sessionId
    // 4. Broadcast via WebSocket to frontend map
  }
}
```

### 3. Cross-Component Data Flow
1. **User chat** → **AI processes** → **Calls addLocationFunction**
2. **Location saved** → **WebSocket broadcast** → **Map updates**
3. **Map search** → **Google Places API** → **Location enrichment** → **WebSocket sync**

## File Structure Conventions

### Frontend
```
src/
├── components/features/     # Feature-specific components
│   ├── auth/               # SignIn, SignUp components
│   ├── chat/               # Chat interface components  
│   └── map/                # Map-related components + tests
├── services/               # External service integrations
│   ├── MapService.ts       # WebSocket + Google Maps coordination
│   └── LocationService.ts  # Location manipulation utilities
├── contexts/               # React contexts for global state
└── lib/api.ts             # Centralized API client with auth
```

### Backend
```
src/main/java/com/springboot/FlomadAIplanner/
├── ai/functions/          # AI function implementations
├── controller/            # REST API endpoints
├── service/               # Business logic services
├── config/                # Spring configuration
└── security/              # JWT, OAuth2, WebSocket security
```

## Common Debugging Scenarios

### Map Not Loading
1. Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in browser console
2. Verify Google Maps APIs enabled: Maps JavaScript, Places, Geocoding
3. Check WebSocket connection in Network tab

### AI Functions Not Working
1. Verify Spring AI function registration in logs
2. Check OpenAI API key and rate limits
3. Validate function parameter schemas match OpenAI requirements

### Authentication Issues
1. Check JWT token validity and expiration
2. Verify CORS configuration for `localhost:3000` ↔ `localhost:8080`
3. Test guest token creation fallback

## Performance Optimizations

### Frontend
- **Memoized map components** prevent unnecessary re-renders
- **Marker clustering** for large location sets
- **WebSocket connection reuse** across sessions

### Backend  
- **MongoDB indexing** on sessionId and location coordinates
- **Function calling batching** for multi-location requests
- **Connection pooling** for external APIs (Amadeus, Google, etc.)

## When Working on This Project

1. **Always start development** with `pnpm run check-env` and `mvn spring-boot:run`
2. **Test map functionality** using the dedicated map test suites
3. **Check WebSocket connections** when debugging real-time features
4. **Use the AI function system** for any travel-related data integration
5. **Follow the session-based architecture** - all features are session-scoped
6. **Reference the comprehensive documentation** in `/Documentation` for detailed technical specs

The system is designed for **collaborative travel planning** with **AI assistance** and **real-time map synchronization**.