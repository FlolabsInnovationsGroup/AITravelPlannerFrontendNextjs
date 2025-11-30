# AI Travel Planner - Copilot Instructions

## Project Overview
This is a **production-ready full-stack AI travel planning application** with a Next.js frontend and Spring Boot backend, featuring **enterprise-grade chat functionality**, **real-time map synchronization**, **AI-powered travel assistance with 15+ function calls**, and comprehensive travel services.

## Architecture & Tech Stack

### Frontend (Next.js 15) - Production-Ready
- **Framework**: Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui
- **Enhanced Chat**: `ChatUIComponents.tsx` with connection monitoring, message status tracking, retry logic
- **WebSocket**: `useEnhancedWebSocket.ts` with heartbeat, reconnection, metrics tracking (up to 10 reconnect attempts)
- **Messaging**: `useEnhancedMessaging.ts` with smart retry, offline queuing, duplicate prevention
- **Maps**: Google Maps with rich location data (photos, ratings, hours, contact info) via WebSocket sync
- **State**: React Context (AuthContext) + session-based WebSocket for real-time location sync
- **API**: Axios with JWT auth interceptors + guest token fallback + comprehensive error handling
- **Tests**: Jest with React Testing Library, map-specific test utilities
- **Responsive**: Mobile-first with `ResponsiveChatLayout` and adaptive view switching

### Backend (Spring Boot 3.4.0) - Enterprise Features
- **Spring AI**: 1.0.0-M5 with OpenAI GPT-4o-mini integration (15+ AI functions auto-registered)
- **AI Functions**: Location management, emergency assistance, budget optimization, accessibility support
- **Rich Location Data**: Google Places API integration with photos, ratings, hours, contact information
- **Database**: MongoDB with Mongock migrations + optimized chat memory (30-message limit, 8192 tokens)
- **WebSocket**: STOMP messaging with session-scoped topics (`/topic/locations/{sessionId}`)
- **Security**: JWT + OAuth2 (Google, LinkedIn, Facebook) + guest sessions + rate limiting (Bucket4j)
- **APIs**: Google Places, Amadeus flights, Viator tours, WeatherAPI, PositionStack geocoding
- **Performance**: Connection pooling, rate limiting, comprehensive error handling, production logging

## Key Development Patterns

### 1. Production Chat System Architecture - NEW
```typescript
// Import enhanced chat components with production features
import { useEnhancedWebSocket } from '@/hooks/useEnhancedWebSocket';
import { useEnhancedMessaging } from '@/hooks/useEnhancedMessaging';
import { ChatUIComponents } from '@/components/ui/ChatUIComponents';

// Message with comprehensive status tracking
interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: Date;
  status: 'sending' | 'sent' | 'delivered' | 'failed' | 'retrying';
  retryCount?: number;
}

// WebSocket with enterprise features
const { connectionState, connectionMetrics, isConnected } = useEnhancedWebSocket({
  maxReconnectAttempts: 10,
  heartbeatInterval: 25000,
  enableHeartbeat: true
});
```

**CRITICAL Pattern**: Always use enhanced hooks for chat - they provide retry logic, connection monitoring, and error recovery. Standard chat components are deprecated.

### 2. Enhanced WebSocket Error Recovery - NEW
```typescript
// Production-ready WebSocket with comprehensive error handling
const WebSocketManager = () => {
  const { 
    sendMessage, 
    retryMessage, 
    cancelMessage, 
    getFailedMessages 
  } = useEnhancedMessaging();
  
  // Smart retry with exponential backoff
  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content, {
        timeout: 30000,
        retryAttempts: 3,
        onRetry: (attempt) => showRetryToast(attempt)
      });
    } catch (error) {
      // Automatic error categorization and user guidance
      handleMessageError(error);
    }
  };
};
```

### 3. Authentication Flow
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

### 4. Responsive Layout System
```typescript
// Mobile-first responsive design pattern
const ResponsiveChatLayout = ({ chatPanel, mapPanel }) => {
  const [viewMode, setViewMode] = useState<'chat' | 'map' | 'split'>('chat');
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  // Automatic breakpoint detection and view switching
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setViewMode('chat'); // Mobile default
      else setViewMode('split'); // Desktop default
    };
  }, []);
};
```

**Pattern**: Always design mobile-first, use `ResponsiveChatLayout` for main interfaces, implement view switching for small screens.

### 5. Map Integration Architecture
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

### 5. Service Layer Architecture
```typescript
// Enhanced service classes with retry mechanisms and proper error handling
export class MapService {
  private wsRetryManager = new WebSocketRetryManager(5, 1000);
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  
  // Production-ready error handling - no console.log pollution
  private logError(context: string, error: any) {
    // Clean logging for production - console cleanup implemented
    if (process.env.NODE_ENV === 'development') {
      console.warn(`MapService[${context}]:`, error);
    }
  }
}
```

**Convention**: Use service classes for external integrations, implement retry mechanisms, clean up console logs for production.

### 6. AI Function Calling Integration
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

### 7. Environment Configuration
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
│   │   ├── BeautifulChatContainer.tsx    # Main chat interface
│   │   ├── EnhancedChatBubbles.tsx      # Message display
│   │   └── ModernChatInput.tsx          # Input with voice/location
│   ├── map/                # Map-related components + tests
│   └── landing/            # Landing page components
├── components/layout/       # Layout components
│   └── ResponsiveChatLayout.tsx  # Responsive chat/map layout
├── components/ui/          # Reusable UI components
│   ├── LoadingStates.tsx   # Loading indicators and skeletons
│   └── ConnectionStatus.tsx # WebSocket connection status
├── services/               # External service integrations
│   ├── MapService.ts       # WebSocket + Google Maps coordination
│   ├── WeatherService.ts   # Weather data integration
│   └── LocationService.ts  # Location manipulation utilities
├── types/                  # TypeScript type definitions
│   └── chat.ts            # Chat-related types and interfaces
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

## Testing Patterns
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

### 5. Service Layer Architecture
```typescript
// Enhanced service classes with retry mechanisms and proper error handling
export class MapService {
  private wsRetryManager = new WebSocketRetryManager(5, 1000);
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  
  // Production-ready error handling - no console.log pollution
  private logError(context: string, error: any) {
    // Clean logging for production - console cleanup implemented
    if (process.env.NODE_ENV === 'development') {
      console.warn(`MapService[${context}]:`, error);
    }
  }
}
```

**Convention**: Use service classes for external integrations, implement retry mechanisms, clean up console logs for production.

## Console Logging Standards
- **Development**: Use `console.warn()` for non-critical issues that are expected (e.g., missing optional data)
- **Production**: All console logs are cleaned up - use conditional logging based on `NODE_ENV`
- **Testing**: Console output is expected in tests - mock console methods when needed
- **Service Classes**: Implement `logError()` methods with environment checks

## When Working on This Project

1. **Always start development** with `pnpm run check-env` and `mvn spring-boot:run`
2. **Test map functionality** using the dedicated map test suites
3. **Check WebSocket connections** when debugging real-time features
4. **Use the AI function system** for any travel-related data integration
5. **Follow the session-based architecture** - all features are session-scoped
6. **Reference the comprehensive documentation** in `/Documentation` for detailed technical specs

The system is designed for **collaborative travel planning** with **AI assistance** and **real-time map synchronization**.