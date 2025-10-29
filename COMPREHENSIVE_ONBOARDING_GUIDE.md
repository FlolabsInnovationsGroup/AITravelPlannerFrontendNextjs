# AI Travel Planner - Comprehensive Onboarding Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Frontend Architecture (Next.js)](#frontend-architecture-nextjs)
4. [Backend Architecture (Spring Boot)](#backend-architecture-spring-boot)
5. [Authentication & Security](#authentication--security)
6. [AI Integration & Function Calling](#ai-integration--function-calling)
7. [Real-time Features & WebSocket](#real-time-features--websocket)
8. [Database & Data Models](#database--data-models)
9. [Testing Strategy](#testing-strategy)
10. [Deployment & Configuration](#deployment--configuration)
11. [Development Workflow](#development-workflow)
12. [Troubleshooting](#troubleshooting)
13. [Useful Links & Resources](#useful-links--resources)

---

## 1. Project Overview

### What is AI Travel Planner?
The AI Travel Planner is a **full-stack intelligent travel planning application** that combines artificial intelligence, real-time collaboration, and interactive mapping to help users create comprehensive travel itineraries.

### Key Features
- 🤖 **AI-Powered Chat Assistant** - Natural language travel planning with OpenAI GPT-3.5-turbo
- 🗺️ **Interactive Google Maps Integration** - Real-time location marking and visualization
- 🔄 **Real-time Collaboration** - WebSocket-based live updates across sessions
- 🛡️ **Flexible Authentication** - JWT + OAuth2 (Google, LinkedIn, Facebook) + Guest sessions
- ✈️ **Travel Services Integration** - Flights (Amadeus), Hotels, Tours (Viator), Weather
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

### Technology Stack Summary
| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js + TypeScript | 15.1.0 |
| Backend | Spring Boot | 3.4.0 |
| AI | OpenAI GPT-3.5-turbo + Spring AI | 1.0.0-M5 |
| Database | MongoDB + Mongock migrations | Latest |
| Maps | Google Maps JavaScript API | Latest |
| Real-time | WebSocket (STOMP/SockJS) | Latest |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Testing | Jest + React Testing Library | Latest |
| Deployment | Docker + Docker Compose | Latest |

---

## 2. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                      │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Port 3000)                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Chat UI       │ │   Map Component │ │   Auth System   │   │
│  │   Components    │ │   (Google Maps) │ │   (JWT/OAuth2)  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────┬───────────────┬─────────────────────────┬─────┘
                  │               │                         │
              HTTP/REST       WebSocket                   Auth
                  │         (STOMP/SockJS)                 │
                  ▼               ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Spring Boot Backend (Port 8080)                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  REST API       │ │  WebSocket      │ │  Security       │   │
│  │  Controllers    │ │  Service        │ │  (JWT/OAuth2)   │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  AI Functions   │ │  Business       │ │  External APIs  │   │
│  │  (Spring AI)    │ │  Services       │ │  Integration    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────┬─────────────────────────────┬─────────────────┘
                  │                             │
              Database                    External APIs
                  ▼                             ▼
┌─────────────────────────────────────┐ ┌─────────────────┐
│         DATA LAYER                  │ │  EXTERNAL APIs  │
├─────────────────────────────────────┤ ├─────────────────┤
│  MongoDB                            │ │  • OpenAI       │
│  ┌─────────────────┐                │ │  • Google Maps  │
│  │   Collections   │                │ │  • Amadeus      │
│  │   • users       │                │ │  • Viator       │
│  │   • sessions    │                │ │  • WeatherAPI   │
│  │   • messages    │                │ │  • Google OAuth │
│  │   • locations   │                │ │  • LinkedIn     │
│  │   • destinations│                │ │  • Facebook     │
│  └─────────────────┘                │ └─────────────────┘
└─────────────────────────────────────┘
```

### Data Flow Overview

1. **User Interaction**: User sends message via chat interface
2. **Frontend Processing**: Next.js handles UI state and sends API request
3. **Authentication**: JWT token validates user session (guest or authenticated)
4. **AI Processing**: Spring AI analyzes message and calls appropriate functions
5. **Function Execution**: AI functions interact with external APIs (Google Places, Amadeus, etc.)
6. **Data Persistence**: Results saved to MongoDB with session context
7. **Real-time Updates**: WebSocket broadcasts changes to all connected clients
8. **Map Updates**: Frontend receives WebSocket events and updates Google Maps
9. **UI Reflection**: Chat and map components reflect new data in real-time

---

## 3. Frontend Architecture (Next.js)

### Project Structure
```
src/
├── app/                          # Next.js 13+ App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── auth/                    # Authentication pages
│   │   ├── signin/
│   │   └── signup/
│   ├── chat/                    # Main chat application
│   └── api/                     # API routes (if any)
├── components/                   # React components
│   ├── features/                # Feature-specific components
│   │   ├── auth/               # Authentication components
│   │   ├── chat/               # Chat interface components
│   │   ├── map/                # Map-related components
│   │   └── landing/            # Landing page components
│   └── ui/                     # Reusable UI components (shadcn/ui)
├── contexts/                    # React Context providers
│   ├── AuthContext.tsx         # Authentication state
│   └── AuthProviderWrapper.tsx # Client-side auth wrapper
├── lib/                        # Utility libraries
│   └── api.ts                  # Centralized API client
├── services/                   # Business logic services
│   ├── MapService.ts           # WebSocket + Maps coordination
│   ├── LocationService.ts      # Location manipulation
│   └── ChatHistoryService.ts   # Chat persistence
├── types/                      # TypeScript type definitions
├── utils/                      # Utility functions
└── styles/                     # Global styles
```

### Key Frontend Technologies

#### Next.js 15 Features Used
- **App Router**: Modern routing with layouts and server components
- **TypeScript**: Full type safety across the application
- **Server Components**: Optimized rendering and data fetching
- **Client Components**: Interactive UI with React hooks

#### UI Framework Stack
```typescript
// Core UI Technologies
import { Tailwind CSS } from 'tailwindcss'           // Utility-first styling
import { shadcn/ui } from '@radix-ui/react'          // Accessible component primitives
import { Lucide React } from 'lucide-react'          // Modern icon system
import { React Hot Toast } from 'react-hot-toast'   // Notification system
```

#### Authentication Flow
```typescript
// Guest-First Authentication Strategy
const AuthContext = createContext({
  isAuthenticated: boolean,
  currentUser: User | null,
  signIn: (token: string) => void,
  signOut: () => void
});

// Authentication initialization
useEffect(() => {
  const initializeAuth = async () => {
    let token = getToken(); // Check localStorage for existing token
    if (!token) {
      token = await createGuestToken(); // Fallback to guest session
      setToken(token);
    }
    // Continue with user session setup...
  };
}, []);
```

**Key Pattern**: Every user gets a token (either authenticated or guest), ensuring seamless API access.

### Real-time Communication (Frontend)

#### WebSocket Integration
```typescript
// MapService.ts - WebSocket management
export class MapService {
  private stompClient: Client | null = null;

  constructor(private userToken: string) {}

  // Connect to WebSocket with authentication
  connect(sessionId: string): Promise<void> {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      connectHeaders: { 
        Authorization: `Bearer ${this.userToken}` 
      }
    });
    
    // Subscribe to session-specific location updates
    client.subscribe(`/topic/locations/${sessionId}`, (message) => {
      const event = JSON.parse(message.body);
      this.handleLocationEvent(event);
    });
  }
}
```

#### Map Integration Pattern
```typescript
// RightMapPanel.tsx - Google Maps + WebSocket coordination
const RightMapPanel = ({ sessionId, userToken }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const mapServiceRef = useRef<MapService | null>(null);

  useEffect(() => {
    const mapService = new MapService(userToken);
    mapServiceRef.current = mapService;
    
    // WebSocket event handler
    const messageHandler = (event: WebSocketEvent) => {
      switch (event.type) {
        case 'LOCATION_ADDED':
          setLocations(prev => [...prev, event.payload]);
          toast.success("New location added to map");
          break;
        case 'LOCATION_REMOVED':
          setLocations(prev => prev.filter(loc => loc.id !== event.payload.locationId));
          break;
      }
    };
    
    mapService.addMessageHandler(messageHandler);
    mapService.connect(sessionId);
  }, [sessionId, userToken]);
};
```

### API Integration

#### Centralized API Client
```typescript
// lib/api.ts - Axios configuration with interceptors
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Automatic token injection
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await createGuestToken();
      setToken(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### Component Architecture Patterns

#### Feature-Based Organization
```typescript
// components/features/map/RightMapPanel.tsx
// Encapsulates all map-related functionality
export default function RightMapPanel({ currentSessionId, currentUserToken }) {
  // State management
  // WebSocket connection
  // Google Maps integration
  // Location handling
  // Real-time updates
}

// components/features/chat/ChatInterface.tsx  
// Handles all chat functionality
export default function ChatInterface({ sessionId }) {
  // Message state
  // AI communication
  // Chat history
  // Message rendering
}
```

#### Useful Links for Frontend Development

- [Next.js Documentation](https://nextjs.org/docs) - Official Next.js guide
- [React TypeScript Cheatsheet](https://github.com/typescript-cheatsheets/react) - TypeScript patterns for React
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [shadcn/ui Components](https://ui.shadcn.com/) - Copy-paste React components
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) - Maps integration guide
- [STOMP.js Documentation](https://stomp-js.github.io/stompjs/) - WebSocket client library
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing utilities
- [Jest Documentation](https://jestjs.io/docs/getting-started) - JavaScript testing framework

---

## 4. Backend Architecture (Spring Boot)

### Project Structure
```
src/main/java/com/springboot/FlomadAIplanner/
├── FlomadAiPlannerApplication.java    # Main application class
├── ai/                                # AI-related components
│   ├── agents/                        # AI agent implementations
│   ├── client/                        # AI client configurations
│   ├── config/                        # AI-specific configurations
│   ├── controller/                    # AI endpoints
│   ├── dto/                          # AI data transfer objects
│   ├── factory/                      # Agent factory patterns
│   ├── functions/                    # Spring AI function implementations
│   │   ├── AddLocationFunction.java  # Location management functions
│   │   ├── FlightSearchFunction.java # Flight search integration
│   │   ├── WeatherForecastFunction.java # Weather API integration
│   │   └── [20+ other functions]     # Travel-specific AI functions
│   ├── service/                      # AI business logic
│   └── util/                         # AI utilities
├── config/                           # Spring configurations
│   ├── SecurityConfig.java           # Security & CORS configuration
│   ├── WebSocketConfig.java          # WebSocket configuration
│   ├── CorsConfig.java              # Cross-origin configuration
│   └── [other configs]              # Additional configurations
├── controller/                       # REST API controllers
│   ├── model/                       # CRUD controllers
│   │   ├── MessageController.java   # Chat message endpoints
│   │   ├── LocationController.java  # Location management
│   │   ├── SessionController.java   # Session management
│   │   └── UserController.java      # User management
│   ├── login/                       # Authentication endpoints
│   └── [external APIs]/            # Third-party integrations
├── dto/                             # Data Transfer Objects
├── model/                           # Data models and repositories
│   ├── entities/                    # MongoDB entity classes
│   │   ├── User.java               # User entity
│   │   ├── Session.java            # Chat session entity
│   │   ├── Message.java            # Chat message entity
│   │   ├── Location.java           # Location entity
│   │   └── Destination.java        # Destination entity
│   └── repository/                  # MongoDB repositories
├── service/                         # Business logic services
│   ├── model/                      # Entity services
│   ├── socket/                     # WebSocket services
│   └── [other services]           # Additional business services
├── security/                       # Security implementations
├── util/                          # Utility classes
└── validator/                     # Input validation
```

### Core Technologies & Dependencies

#### Spring Boot Stack
```xml
<!-- Core Spring Boot Dependencies -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.4.0</version>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-client</artifactId>
</dependency>

<!-- AI Integration -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    <version>1.0.0-M5</version>
</dependency>

<!-- WebSocket Support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<!-- Database Migrations -->
<dependency>
    <groupId>io.mongock</groupId>
    <artifactId>mongock-springboot-v3</artifactId>
    <version>5.5.0</version>
</dependency>
```

### AI Function System Architecture

#### Function Registration Pattern
```java
// Base AI Function Interface
@Component
@Description("Adds locations to existing map display, building cumulative travel itineraries")
public class AddLocationFunction implements Function<AddLocationRequest, String> {
    
    @Override
    public String apply(AddLocationRequest request) {
        // Function implementation
        return "Location added successfully";
    }
    
    @JsonClassDescription("Request to add a location to the map")
    public static class AddLocationRequest {
        @JsonPropertyDescription("Name of the location to add")
        private String name;
        
        @JsonPropertyDescription("Session ID for the current user session")
        private String sessionId;
        
        // Getters and setters...
    }
}
```

#### Available AI Functions (20+ Functions)
```java
// Location Management Functions
AddLocationFunction.java          // Add locations to map
ShowLocationFunction.java         // Display single locations
RemoveLocationFunction.java       // Remove locations from map
ClearLocationsFunction.java       // Clear all locations
ReadLocationsFunction.java        // Read current locations

// Travel Service Functions
FlightSearchFunction.java         // Amadeus flight search
HotelsSearchByLocationFunction.java // Hotel search integration
ToursFreeTextSearchFunction.java  // Viator tours integration
WeatherForecastFunction.java      // Weather API integration

// Utility Functions
CurrentDateTimeFunction.java      // Current date/time context
BudgetOptimizationFunction.java   // Budget planning assistance
AccessibilityFunction.java       // Accessibility information
EmergencyAssistanceFunction.java  // Emergency travel help
DistanceCalculatorFunction.java   // Distance calculations
PlaceSuggestionFunction.java     // Google Places suggestions
```

#### AI Processing Flow
```java
// ChatCallService.java - Main AI processing service
@Service
public class ChatCallService extends AbstractChatService {
    
    public String processMessage(AIMessageDTO aiMessage) {
        try {
            // 1. Get appropriate agent for the message
            Agent agent = agentFactory.getAgent(aiMessage);
            
            // 2. Process message with function calling
            return (String) agent.processCallMessage(aiMessage);
            
        } catch (Exception e) {
            log.error("Error processing message: {}", e.getMessage());
            throw new RuntimeException("Error processing chat message", e);
        }
    }
}
```

### WebSocket Real-time Communication

#### WebSocket Configuration
```java
// WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic"); // For broadcasting
        config.setApplicationDestinationPrefixes("/app"); // For client messages
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:3000", "https://flomadtravel.com")
                .withSockJS(); // SockJS fallback support
    }
}
```

#### WebSocket Service Implementation
```java
// WebSocketService.java - Real-time message broadcasting
@Service
public class WebSocketService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    // Broadcast location addition to all session subscribers
    public void broadcastLocationAdded(String sessionId, Location location) {
        WebSocketEvent<Location> event = WebSocketEvent.<Location>builder()
            .type("LOCATION_ADDED")
            .payload(location)
            .timestamp(LocalDateTime.now())
            .build();
            
        messagingTemplate.convertAndSend(
            "/topic/locations/" + sessionId, 
            event
        );
    }
    
    // Broadcast location removal
    public void broadcastLocationRemoved(String sessionId, String locationId) {
        Map<String, String> payload = Map.of("locationId", locationId);
        WebSocketEvent<Map<String, String>> event = WebSocketEvent.<Map<String, String>>builder()
            .type("LOCATION_REMOVED")
            .payload(payload)
            .timestamp(LocalDateTime.now())
            .build();
            
        messagingTemplate.convertAndSend(
            "/topic/locations/" + sessionId, 
            event
        );
    }
}
```

### External API Integration

#### Google Places Integration
```java
// Google Places API service
@Service
public class GooglePlacesService {
    
    @Value("${google.api.key}")
    private String apiKey;
    
    @Value("${google.api.baseurl}")
    private String baseUrl;
    
    public PlaceSearchResponse searchPlaces(String query, String location) {
        // Build request to Google Places Text Search API
        String url = baseUrl + "/maps/api/place/textsearch/json";
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("query", query);
        params.add("location", location);
        params.add("key", apiKey);
        
        return restTemplate.getForObject(url, PlaceSearchResponse.class, params);
    }
}
```

#### Amadeus Flight Search Integration
```java
// Amadeus API integration for flight search
@Service
public class AmadeusService {
    
    @Value("${amadeus.api.key}")
    private String apiKey;
    
    @Value("${amadeus.api.secret}")
    private String apiSecret;
    
    public FlightSearchResponse searchFlights(FlightSearchRequest request) {
        // 1. Get OAuth2 token
        String accessToken = getAccessToken();
        
        // 2. Search flights
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        String url = baseUrl + "v2/shopping/flight-offers";
        HttpEntity<FlightSearchRequest> entity = new HttpEntity<>(request, headers);
        
        return restTemplate.postForObject(url, entity, FlightSearchResponse.class);
    }
}
```

### Session & Context Management

#### Session Context Holder
```java
// SessionContextHolder.java - Thread-local session management
public class SessionContextHolder {
    private static final ThreadLocal<String> sessionContext = new ThreadLocal<>();
    
    public static void setSessionId(String sessionId) {
        sessionContext.set(sessionId);
    }
    
    public static String getSessionId() {
        return sessionContext.get();
    }
    
    public static void clear() {
        sessionContext.remove();
    }
}
```

#### Session Entity
```java
// Session.java - MongoDB entity for chat sessions
@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "sessions")
public class Session extends Model {
    
    @Field("title")
    @Size(max = 200, message = "Session title cannot exceed 200 characters")
    private String title;
    
    @Field("userId") 
    private String userId; // Owner of the session
    
    @Field("createdAt")
    private LocalDateTime createdAt;
    
    @Field("updatedAt")
    private LocalDateTime updatedAt;
    
    @Field("isActive")
    private Boolean isActive = true;
}
```

### Error Handling & Validation

#### Global Exception Handler
```java
// GlobalExceptionHandler.java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException e) {
        ErrorResponse error = ErrorResponse.builder()
            .message(e.getMessage())
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .build();
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(AIProcessingException.class)
    public ResponseEntity<ErrorResponse> handleAIProcessing(AIProcessingException e) {
        // Handle AI-specific errors
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.builder()
                .message("AI processing failed: " + e.getMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }
}
```

### Configuration Management

#### Environment-specific Properties
```properties
# application-local.properties
spring.profiles.active=local
spring.data.mongodb.uri=mongodb://localhost:27017/flomad-dev
server.port=8080

# application-prod.properties  
spring.profiles.active=prod
spring.data.mongodb.uri=${MONGO_URL}
server.port=${PORT:8080}

# Security settings
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000

# AI Configuration
spring.ai.openai.api-key=${SPRING_AI_OPENAI_API_KEY}
spring.ai.openai.chat.options.model=gpt-3.5-turbo
spring.ai.openai.chat.options.max-tokens=2048
spring.ai.openai.chat.options.temperature=0.7
```

#### Useful Links for Backend Development

- [Spring Boot Documentation](https://spring.io/projects/spring-boot) - Official Spring Boot guide
- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/) - AI integration documentation
- [MongoDB Spring Data](https://spring.io/projects/spring-data-mongodb) - MongoDB integration guide  
- [Spring Security OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/) - OAuth2 implementation
- [WebSocket with Spring](https://spring.io/guides/gs/messaging-stomp-websocket/) - WebSocket integration guide
- [Mongock Documentation](https://docs.mongock.io/) - Database migration tool
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference) - OpenAI integration guide
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) - Places API reference
- [Amadeus API Documentation](https://developers.amadeus.com/) - Flight API integration

---

## 5. Authentication & Security

### Authentication Architecture Overview

The application implements a **flexible, guest-first authentication system** that ensures every user has access while providing enhanced features for authenticated users.

```
Authentication Flow Diagram:

User Access Request
        │
        ▼
┌─────────────────────┐
│   Check Token       │
│   in localStorage   │
└─────────┬───────────┘
          │
    ┌─────▼─────┐
    │ Token     │
    │ Exists?   │
    └─────┬─────┘
          │
    ┌─────▼─────┐         ┌─────────────────────┐
    │    NO     │────────▶│  Create Guest Token │
    └───────────┘         └─────────┬───────────┘
          │                         │
    ┌─────▼─────┐                   │
    │    YES    │                   │
    └─────┬─────┘                   │
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────┐
│           Set Authorization Header           │
│        Bearer {token}                       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│              API Request                    │
│     (All requests include token)            │
└─────────────────┬───────────────────────────┘
                  │
            ┌─────▼─────┐
            │ 401 Error?│
            └─────┬─────┘
                  │
            ┌─────▼─────┐         ┌─────────────────────┐
            │    YES    │────────▶│ Refresh Guest Token │
            └───────────┘         └─────────────────────┘
                  │
            ┌─────▼─────┐
            │    NO     │
            └─────┬─────┘
                  │
                  ▼
        ┌─────────────────┐
        │   Process       │
        │   Response      │
        └─────────────────┘
```

### Frontend Authentication Implementation

#### AuthContext Provider
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  signIn: (token: string) => void;
  signOut: () => void;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let token = getToken(); // Check localStorage for existing token
        
        // If no valid token, initialize fresh session with guest token
        if (!token) {
          console.log('No valid token found, initializing fresh session');
          token = await initializeFreshSession();
        }

        // Get current user info using the verified/created token
        try {
          const user = await getCurrentUser();
          if (user) {
            setCurrentUser({ ...user, token });
            setIsAuthenticated(true);
          } else {
            // Guest session - create basic user object
            setCurrentUser({ id: 'guest', token });
            setIsAuthenticated(true);
          }
        } catch (userError) {
          console.warn('Using guest session:', userError);
          setCurrentUser({ id: 'guest', token });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Fallback to guest session
        const newToken = await createGuestToken();
        setToken(newToken);
        setCurrentUser({ id: 'guest', token: newToken });
        setIsAuthenticated(true);
      }
    };

    initializeAuth();
  }, []);
};
```

#### API Client with Auto-Refresh
```typescript
// lib/api.ts - Axios interceptors for seamless token management
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get new guest token
        const response = await axios.post(`${API_BASE_URL}/api/auth/guest-token`);
        const newToken = response.data.token;
        
        // Save new token
        setToken(newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearToken();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Backend Security Configuration

#### JWT Token Management
```java
// JWT utility class for token operations
@Component
public class JwtTokenUtil {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    
    // Generate token for authenticated users
    public String generateTokenForUser(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("username", user.getUsername());
        claims.put("roles", user.getRoles());
        return createToken(claims, user.getUsername());
    }
    
    // Generate guest token with limited access
    public String generateGuestToken() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "guest_" + System.currentTimeMillis());
        claims.put("username", "guest");
        claims.put("roles", Arrays.asList("GUEST"));
        return createToken(claims, "guest");
    }
    
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(subject)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
}
```

#### Security Configuration
```java
// SecurityConfig.java - Comprehensive security setup
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean(name = "oauthSecurityFilterChain")
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(
                    "/login", "/error", "/oauth2/**", 
                    "/api/auth/**", "/api/chat/**", 
                    "/api/locations/**", "/users/current",
                    "/sessions/**", "/ws/**",
                    "/v3/api-docs/**", "/swagger-ui/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler((request, response, authentication) -> {
                    // Environment-aware redirect
                    String redirectUrl = request.getRequestURL().toString().contains("api.flomadtravel.com") 
                        ? "https://www.flomadtravel.com/chat" 
                        : "http://localhost:3000/chat";
                    
                    response.setHeader("Access-Control-Allow-Origin", 
                        redirectUrl.startsWith("https://www.flomadtravel.com") 
                            ? "https://www.flomadtravel.com" 
                            : "http://localhost:3000");
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                    response.sendRedirect(redirectUrl);
                })
            );
        
        return http.build();
    }
}
```

#### CORS Configuration
```java
// CorsConfig.java - Cross-Origin Resource Sharing setup
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow both local development and production domains
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "https://www.flomadtravel.com",
            "https://flomadtravel.com"
        ));
        
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));
        
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### OAuth2 Integration

#### OAuth2 Providers Configuration
```properties
# OAuth2 provider configurations
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=profile,email
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/google

spring.security.oauth2.client.registration.linkedin.client-id=${LINKEDIN_CLIENT_ID}
spring.security.oauth2.client.registration.linkedin.client-secret=${LINKEDIN_CLIENT_SECRET}
spring.security.oauth2.client.registration.linkedin.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.linkedin.scope=r_liteprofile,r_emailaddress

spring.security.oauth2.client.registration.facebook.client-id=${FACEBOOK_CLIENT_ID}
spring.security.oauth2.client.registration.facebook.client-secret=${FACEBOOK_CLIENT_SECRET}
spring.security.oauth2.client.registration.facebook.scope=email,public_profile
```

#### OAuth2 Success Handler
```java
// OAuth2 authentication success handler
@Component
public class OAuth2AuthenticationSuccessHandler 
    extends SimpleUrlAuthenticationSuccessHandler {
    
    private final JwtTokenUtil jwtTokenUtil;
    private final UserService userService;
    
    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request, 
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // Extract user information from OAuth2 provider
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("id").toString();
        
        // Find or create user
        User user = userService.findOrCreateOAuth2User(email, name, providerId);
        
        // Generate JWT token
        String jwtToken = jwtTokenUtil.generateTokenForUser(user);
        
        // Redirect with token (frontend will extract and store)
        String redirectUrl = determineTargetUrl(request) + "?token=" + jwtToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
```

### WebSocket Security

#### WebSocket Authentication
```java
// WebSocketConfig.java - Secure WebSocket configuration
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = 
                    MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract and validate JWT token from connection headers
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);
                        // Validate token and set user context
                        if (jwtTokenUtil.isTokenValid(token)) {
                            String username = jwtTokenUtil.getUsernameFromToken(token);
                            accessor.setUser(new UsernamePasswordAuthenticationToken(
                                username, null, Collections.emptyList())
                            );
                        }
                    }
                }
                return message;
            }
        });
    }
}
```

### Rate Limiting & Security

#### Rate Limiting Configuration
```java
// RateLimitConfig.java - API rate limiting
@Configuration
public class RateLimitConfig {
    
    @Bean
    public Bucket createGuestBucket() {
        // Guest users: 100 requests per hour
        Bandwidth limit = Bandwidth.classic(100, Refill.intervally(100, Duration.ofHours(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    @Bean
    public Bucket createAuthenticatedBucket() {
        // Authenticated users: 500 requests per hour
        Bandwidth limit = Bandwidth.classic(500, Refill.intervally(500, Duration.ofHours(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
}
```

#### Input Validation & Sanitization
```java
// LocationController.java - Input validation example
@RestController
@RequestMapping("/api/locations")
@Validated
public class LocationController {
    
    @PostMapping
    public ResponseEntity<LocationDTO> addLocation(
        @Valid @RequestBody LocationCreationRequest request,
        @RequestHeader("Authorization") String authHeader
    ) {
        // Validation annotations ensure data integrity
        // @Valid triggers validation on the request object
        
        String sessionId = sessionContextHolder.getSessionId();
        Location location = locationService.addLocation(request, sessionId);
        
        return ResponseEntity.ok(locationMapper.toDTO(location));
    }
}

// LocationCreationRequest.java - Validation constraints
public class LocationCreationRequest {
    
    @NotBlank(message = "Session ID cannot be blank")
    private String sessionId;
    
    @NotNull(message = "Latitude cannot be null")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;
    
    @NotNull(message = "Longitude cannot be null")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;
    
    @Size(max = 200, message = "Location name cannot exceed 200 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-.,()\\u00C0-\\u017F]*$", 
             message = "Location name contains invalid characters")
    private String name;
}
```

### Security Best Practices Implemented

#### 1. Token Security
- **JWT Secret**: Strong, environment-specific secret keys
- **Token Expiration**: Configurable expiration times
- **Automatic Refresh**: Seamless token renewal on expiration
- **Secure Storage**: Frontend stores tokens in localStorage with proper cleanup

#### 2. CORS Protection
- **Whitelist Origins**: Only allowed domains can access APIs
- **Credentials Support**: Proper handling of authentication cookies
- **Method Restrictions**: Limited to necessary HTTP methods

#### 3. Input Validation
- **Bean Validation**: Comprehensive validation using Jakarta annotations
- **SQL Injection Prevention**: Parameterized queries and MongoDB safety
- **XSS Protection**: Input sanitization and output encoding
- **File Upload Security**: Type validation and size limits

#### 4. Rate Limiting
- **User-based Limits**: Different limits for guests vs authenticated users
- **API Protection**: Prevents abuse and DoS attacks
- **Graceful Degradation**: Proper error messages for rate-limited requests

### Useful Links for Security Implementation

- [Spring Security Documentation](https://spring.io/projects/spring-security) - Complete security framework guide
- [JWT.io](https://jwt.io/) - JSON Web Token introduction and debugger
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749) - OAuth 2.0 specification
- [Spring Security OAuth2 Client](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/index.html) - OAuth2 client implementation
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/) - Web application security best practices
- [Spring Boot Security Auto-configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.security) - Security configuration guide
- [CORS MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) - Cross-Origin Resource Sharing guide

---

## 6. AI Integration & Function Calling

### AI System Architecture Overview

The AI system is built on **Spring AI framework** with **OpenAI GPT-3.5-turbo**, implementing a sophisticated function calling mechanism that allows the AI to interact with external travel services in real-time.

```
AI Processing Flow:

User Message
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                       │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Chat Input    │───▶│   API Client    │                │
│  │   Component     │    │  (Axios + JWT)  │                │
│  └─────────────────┘    └─────────┬───────┘                │
└──────────────────────────────────────┼─────────────────────┘
                                       │ HTTP POST /api/chat/call
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Spring Boot)                       │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ MessageController│───▶│ ChatCallService │                │
│  │   (@PostMapping) │    │                │                │
│  └─────────────────┘    └─────────┬───────┘                │
│                                   │                        │
│                                   ▼                        │
│  ┌─────────────────────────────────────────────────────────┤
│  │              AgentFactory                               │
│  │  ┌─────────────────┐    ┌─────────────────┐            │
│  │  │  Determine      │───▶│   Create Agent  │            │
│  │  │  Agent Type     │    │   Instance      │            │
│  │  └─────────────────┘    └─────────┬───────┘            │
│  └──────────────────────────────────────┼─────────────────┤
│                                         ▼                 │
│  ┌─────────────────────────────────────────────────────────┤
│  │                Spring AI Agent                         │
│  │  ┌─────────────────┐    ┌─────────────────┐            │
│  │  │   Message       │───▶│   Function      │            │
│  │  │   Analysis      │    │   Selection     │            │
│  │  └─────────────────┘    └─────────┬───────┘            │
│  │                                   ▼                    │
│  │  ┌─────────────────────────────────────────────────────┤
│  │  │              OpenAI GPT-3.5-turbo                   │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  │  │   Analyze   │ │   Select    │ │   Generate  │   │
│  │  │  │   Intent    │ │  Functions  │ │  Parameters │   │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘   │
│  │  └─────────────────────────────────────────────────────┤
│  └──────────────────────────────────────┼─────────────────┘
│                                         ▼                 │
│  ┌─────────────────────────────────────────────────────────┤
│  │              AI Functions (20+ functions)              │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  │   Location  │ │   Flight    │ │   Hotel     │       │
│  │  │  Functions  │ │  Functions  │ │  Functions  │       │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  │   Weather   │ │    Tour     │ │  Utility    │       │
│  │  │  Functions  │ │  Functions  │ │  Functions  │       │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │
│  └─────────────────────────────────────────────────────────┤
└──────────────────────────────────────┼─────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                External Services                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Google    │ │   Amadeus   │ │   Viator    │           │
│  │   Places    │ │   Flights   │ │   Tours     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  WeatherAPI │ │   MongoDB   │ │  WebSocket  │           │
│  │             │ │  Database   │ │  Service    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Spring AI Configuration

#### AI Configuration Setup
```java
// AI configuration for OpenAI integration
@Configuration
public class AIConfig {
    
    @Value("${spring.ai.openai.api-key}")
    private String openAiApiKey;
    
    @Bean
    public OpenAiChatModel openAiChatModel() {
        return OpenAiChatModel.builder()
            .apiKey(openAiApiKey)
            .model("gpt-3.5-turbo")
            .maxTokens(2048)
            .temperature(0.7)
            .topP(0.9)
            .build();
    }
    
    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory();
    }
}
```

#### Function Registration System
```java
// Automatic function discovery and registration
@Configuration
public class FunctionConfiguration {
    
    @Bean
    public FunctionCallbackContext functionCallbackContext(ApplicationContext context) {
        FunctionCallbackContext functionContext = new FunctionCallbackContext();
        
        // Auto-discover all functions implementing Function interface
        Map<String, Function> functions = context.getBeansOfType(Function.class);
        
        functions.forEach((name, function) -> {
            // Register each function with its description
            Description description = function.getClass().getAnnotation(Description.class);
            if (description != null) {
                functionContext.register(name, function, description.value());
            }
        });
        
        return functionContext;
    }
}
```

### AI Function Implementation Patterns

#### Base Function Structure
```java
// Template for creating AI functions
@Component
@Description("Detailed description of what this function does and when to use it")
public class ExampleFunction implements Function<ExampleFunction.Request, String> {
    
    // Dependencies injection
    private final ExternalService externalService;
    private final DatabaseService databaseService;
    private final WebSocketService webSocketService;
    
    @Override
    public String apply(Request request) {
        try {
            // 1. Validate input parameters
            validateRequest(request);
            
            // 2. Get session context
            String sessionId = SessionContextHolder.getSessionId();
            
            // 3. Perform business logic
            Result result = externalService.performOperation(request);
            
            // 4. Persist results if needed
            databaseService.save(result, sessionId);
            
            // 5. Broadcast real-time updates
            webSocketService.broadcastUpdate(sessionId, result);
            
            // 6. Return user-friendly response
            return "Operation completed successfully: " + result.getSummary();
            
        } catch (Exception e) {
            log.error("Function execution failed: {}", e.getMessage());
            return "Sorry, I encountered an error: " + e.getMessage();
        }
    }
    
    // Request DTO with JSON schema annotations
    @JsonClassDescription("Request object for example function")
    public static class Request {
        @JsonPropertyDescription("Description of this parameter")
        private String parameter1;
        
        @JsonPropertyDescription("Another parameter description")
        private Integer parameter2;
        
        // Getters and setters...
    }
}
```

### Core AI Functions Catalog

#### 1. Location Management Functions
```java
// AddLocationFunction.java - Add locations to map
@Component
@Description("""
    Adds locations to existing map display, building cumulative travel itineraries. 
    Each location appears as a visual marker on the user interface immediately.
    
    PERFECT FOR:
    - Multi-destination itineraries: "Add Paris, then Rome, then London"
    - Progressive trip planning: "Also include Barcelona"
    - Building comprehensive travel routes
    """)
public class AddLocationFunction implements Function<AddLocationRequest, String> {
    
    @Override
    public String apply(AddLocationRequest request) {
        // Prevent duplicate requests
        String requestHash = generateRequestHash(request);
        if (isDuplicateRequest(requestHash)) {
            return "Location already processed: " + request.getName();
        }
        
        // Get session context
        String sessionId = request.getSessionId() != null ? 
            request.getSessionId() : SessionContextHolder.getSessionId();
        
        // Create location entity
        Location location = Location.builder()
            .sessionId(sessionId)
            .name(request.getName())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .type(request.getType())
            .build();
        
        // Save to database
        Location savedLocation = locationService.save(location);
        
        // Broadcast to WebSocket subscribers
        webSocketService.broadcastLocationAdded(sessionId, savedLocation);
        
        return String.format("✅ Added %s to your travel map! You can see it marked on the map now.", 
                           request.getName());
    }
}
```

#### 2. Flight Search Integration
```java
// FlightSearchFunction.java - Amadeus API integration
@Component
@Description("""
    Searches for flights using natural language queries. Converts city names to IATA codes
    and finds available flights with pricing information.
    
    EXAMPLES:
    - "Find flights from New York to Paris next month"
    - "Show me flights to Tokyo departing December 15th"
    - "Search flights from London to Bangkok, economy class"
    """)
public class FlightSearchFunction implements Function<FlightSearchRequest, String> {
    
    private final AmadeusFlightService amadeusService;
    private final IATACodeService iataService;
    
    @Override
    public String apply(FlightSearchRequest request) {
        try {
            // Convert city names to IATA codes
            String originCode = iataService.getIATACode(request.getOrigin());
            String destinationCode = iataService.getIATACode(request.getDestination());
            
            if (originCode == null || destinationCode == null) {
                return "Sorry, I couldn't find airport codes for the specified cities. " +
                       "Please provide more specific city names or airport codes.";
            }
            
            // Search flights via Amadeus API
            FlightSearchResponse flights = amadeusService.searchFlights(
                originCode, destinationCode, request.getDepartureDate(), 
                request.getReturnDate(), request.getPassengers()
            );
            
            if (flights.getData().isEmpty()) {
                return "No flights found for your search criteria. " +
                       "Try different dates or destinations.";
            }
            
            // Format response for user
            StringBuilder response = new StringBuilder();
            response.append(String.format("✈️ Found %d flight options from %s to %s:\n\n", 
                           flights.getData().size(), request.getOrigin(), request.getDestination()));
            
            flights.getData().stream().limit(5).forEach(flight -> {
                response.append(String.format("🛫 %s - %s (%s)\n", 
                    flight.getDepartureTime(), flight.getArrivalTime(), flight.getAirline()));
                response.append(String.format("💰 Price: %s %s\n", 
                    flight.getPrice().getTotal(), flight.getPrice().getCurrency()));
                response.append(String.format("⏱️ Duration: %s\n\n", flight.getDuration()));
            });
            
            return response.toString();
            
        } catch (Exception e) {
            log.error("Flight search failed: {}", e.getMessage());
            return "Sorry, I'm having trouble searching for flights right now. " +
                   "Please try again in a moment.";
        }
    }
}
```

#### 3. Hotels Search Function
```java
// HotelsSearchByLocationFunction.java - Hotel search integration
@Component
@Description("""
    Searches for hotels in a specific location with filtering options.
    Provides hotel details, ratings, prices, and booking information.
    """)
public class HotelsSearchByLocationFunction implements Function<HotelSearchRequest, String> {
    
    private final AmadeusHotelService hotelService;
    private final LocationService locationService;
    
    @Override
    public String apply(HotelSearchRequest request) {
        try {
            // Get location coordinates
            Location location = locationService.geocodeLocation(request.getLocation());
            
            // Search hotels
            HotelSearchResponse hotels = hotelService.searchHotels(
                location.getLatitude(), location.getLongitude(),
                request.getCheckIn(), request.getCheckOut(),
                request.getGuests(), request.getRooms()
            );
            
            // Format response
            StringBuilder response = new StringBuilder();
            response.append(String.format("🏨 Found %d hotels in %s:\n\n", 
                           hotels.getData().size(), request.getLocation()));
            
            hotels.getData().stream().limit(5).forEach(hotel -> {
                response.append(String.format("🏩 %s (%s⭐)\n", 
                    hotel.getName(), hotel.getRating()));
                response.append(String.format("📍 %s\n", hotel.getAddress()));
                response.append(String.format("💰 From %s %s per night\n\n", 
                    hotel.getPrice().getAmount(), hotel.getPrice().getCurrency()));
            });
            
            return response.toString();
            
        } catch (Exception e) {
            log.error("Hotel search failed: {}", e.getMessage());
            return "Sorry, I couldn't find hotels for that location. " +
                   "Please try a different city or area.";
        }
    }
}
```

#### 4. Weather Forecast Function
```java
// WeatherForecastFunction.java - Weather API integration
@Component
@Description("""
    Provides weather forecasts for travel destinations.
    Helps users plan activities and pack appropriately.
    """)
public class WeatherForecastFunction implements Function<WeatherRequest, String> {
    
    private final WeatherService weatherService;
    
    @Override
    public String apply(WeatherRequest request) {
        try {
            WeatherForecast forecast = weatherService.getForecast(
                request.getLocation(), request.getDays()
            );
            
            StringBuilder response = new StringBuilder();
            response.append(String.format("🌤️ Weather forecast for %s:\n\n", request.getLocation()));
            
            forecast.getDays().forEach(day -> {
                response.append(String.format("📅 %s\n", day.getDate()));
                response.append(String.format("🌡️ %d°C - %d°C\n", 
                    day.getMinTemp(), day.getMaxTemp()));
                response.append(String.format("☁️ %s\n", day.getCondition()));
                response.append(String.format("💧 Precipitation: %d%%\n\n", 
                    day.getPrecipitationChance()));
            });
            
            return response.toString();
            
        } catch (Exception e) {
            log.error("Weather forecast failed: {}", e.getMessage());
            return "Sorry, I couldn't get weather information for that location.";
        }
    }
}
```

### Agent Factory Pattern

#### Dynamic Agent Selection
```java
// AgentFactory.java - Determines which agent to use based on message content
@Component
public class AgentFactory {
    
    private final Map<String, Agent> agents;
    
    public AgentFactory(List<Agent> agentList) {
        this.agents = agentList.stream()
            .collect(Collectors.toMap(
                agent -> agent.getClass().getSimpleName(),
                agent -> agent
            ));
    }
    
    public Agent getAgent(AIMessageDTO message) {
        // Analyze message content to determine appropriate agent
        String messageText = message.getMessage().toLowerCase();
        
        // Location-related queries
        if (containsLocationKeywords(messageText)) {
            return agents.get("LocationAgent");
        }
        
        // Flight-related queries
        if (containsFlightKeywords(messageText)) {
            return agents.get("FlightAgent");
        }
        
        // General travel queries
        if (containsTravelKeywords(messageText)) {
            return agents.get("TravelAgent");
        }
        
        // Default to general purpose agent
        return agents.get("GeneralAgent");
    }
    
    private boolean containsLocationKeywords(String message) {
        String[] locationKeywords = {"add", "show", "display", "mark", "location", "place", "city"};
        return Arrays.stream(locationKeywords)
            .anyMatch(keyword -> message.contains(keyword));
    }
    
    private boolean containsFlightKeywords(String message) {
        String[] flightKeywords = {"flight", "fly", "airline", "airport", "departure", "arrival"};
        return Arrays.stream(flightKeywords)
            .anyMatch(keyword -> message.contains(keyword));
    }
}
```

### Chat Memory Integration

#### Conversation Context Management
```java
// ChatMemoryConfig.java - Maintains conversation context
@Configuration
public class ChatMemoryConfig {
    
    @Value("${chat.memory.max-messages:10}")
    private int maxMessages;
    
    @Bean
    public ChatMemory chatMemory() {
        return new InMemoryChatMemory();
    }
    
    @Bean
    public MessageChatMemoryAdvisor messageChatMemoryAdvisor(ChatMemory chatMemory) {
        return new MessageChatMemoryAdvisor(chatMemory, 
            DefaultChatMemoryAugmentor.builder()
                .chatMemoryRetrieveSize(maxMessages)
                .build()
        );
    }
}
```

#### Context-Aware Processing
```java
// Enhanced chat service with memory
@Service
public class EnhancedChatCallService {
    
    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private final List<Function> availableFunctions;
    
    public String processMessage(AIMessageDTO request) {
        String sessionId = request.getSessionId();
        
        // Build chat client with functions and memory
        ChatResponse response = chatClient.prompt()
            .user(request.getMessage())
            .functions(availableFunctions.toArray(new Function[0]))
            .advisors(new MessageChatMemoryAdvisor(chatMemory))
            .call()
            .chatResponse();
        
        // Store conversation in session-specific memory
        chatMemory.add(sessionId, 
            new UserMessage(request.getMessage()),
            new AssistantMessage(response.getResult().getOutput().getContent())
        );
        
        return response.getResult().getOutput().getContent();
    }
}
```

### Function Calling Examples

#### Example 1: Multi-Function Travel Planning
```
User: "I want to visit Paris next month, show me flights from New York and add Paris to my map"

AI Processing:
1. Identifies two intents: flight search + location addition
2. Calls FlightSearchFunction with (origin: "New York", destination: "Paris", date: next month)
3. Calls AddLocationFunction with (name: "Paris", coordinates from geocoding)
4. Returns combined response with flight options and map confirmation
```

#### Example 2: Contextual Follow-up
```
User: "Also add Rome to my itinerary"

AI Processing:
1. Uses chat memory to understand "also" refers to previous Paris trip
2. Calls AddLocationFunction with (name: "Rome")
3. WebSocket broadcasts location addition to map
4. Returns confirmation of Rome addition
```

### Error Handling & Resilience

#### Function Execution Error Handling
```java
// Robust error handling in AI functions
@Override
public String apply(FunctionRequest request) {
    try {
        // Function logic here
        return successResponse;
        
    } catch (ValidationException e) {
        log.warn("Validation failed: {}", e.getMessage());
        return "I need more information: " + e.getMessage();
        
    } catch (ExternalServiceException e) {
        log.error("External service failed: {}", e.getMessage());
        return "I'm having trouble connecting to travel services. Please try again.";
        
    } catch (RateLimitException e) {
        log.warn("Rate limit exceeded: {}", e.getMessage());
        return "I'm receiving too many requests. Please wait a moment and try again.";
        
    } catch (Exception e) {
        log.error("Unexpected error in function: {}", e.getMessage(), e);
        return "I encountered an unexpected error. Our team has been notified.";
    }
}
```

### Useful Links for AI Integration

- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/) - Complete Spring AI framework guide
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference) - OpenAI API reference
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) - OpenAI function calling documentation
- [JSON Schema Reference](https://json-schema.org/) - Schema definition for function parameters
- [Amadeus Travel APIs](https://developers.amadeus.com/) - Flight and hotel search APIs
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) - Location and place data
- [Viator Tours API](https://docs.viator.com/) - Tours and activities integration
- [OpenWeatherMap API](https://openweathermap.org/api) - Weather forecast integration

---

## 7. Real-time Features & WebSocket

### WebSocket Architecture Overview

The real-time system enables live collaboration between users and instant map updates using **STOMP over SockJS** WebSocket protocol.

```
Real-time Communication Flow:

Frontend Client A                 Backend Server                Frontend Client B
       │                               │                              │
       ├─── Connect to /ws ──────────▶ │                              │
       │    (Bearer token auth)         │                              │
       │                               │◄──── Connect to /ws ─────────┤
       │                               │      (Bearer token auth)      │
       │                               │                              │
       ├─── Subscribe to ─────────────▶│                              │
       │    /topic/locations/{session}  │                              │
       │                               │◄──── Subscribe to ────────────┤
       │                               │      /topic/locations/{session}│
       │                               │                              │
   [User adds location via AI chat]    │                              │
       │                               │                              │
       ├─── HTTP POST ───────────────▶ │                              │
       │    /api/chat/call              │                              │
       │    "Add Paris to map"          │                              │
       │                               │                              │
       │                        [AI processes request]                │
       │                        [AddLocationFunction]                 │
       │                        [Saves to MongoDB]                   │
       │                               │                              │
       │                               ├── Broadcast Event ──────────▶│
       │◄─── WebSocket Event ──────────┤    /topic/locations/{session} │
       │     LOCATION_ADDED            │    LOCATION_ADDED           ─┤▶ Client B
       │     payload: {location}       │    payload: {location}       │
       │                               │                              │
   [Map updates in real-time]          │                    [Map updates in real-time]
```

### Frontend WebSocket Implementation

#### MapService Class Architecture
```typescript
// services/MapService.ts - Complete WebSocket management
export class MapService {
    private stompClient: Client | null = null;
    private messageHandlers: ((event: WebSocketEvent<any>) => void)[] = [];
    private wsRetryManager = new WebSocketRetryManager(5, 1000);
    private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
    private pendingSessionId: string | null = null;
    
    // Event handlers for component integration
    onConnect: (() => void) | null = null;
    onDisconnect: (() => void) | null = null;
    onError: ((error: Error) => void) | null = null;
    onMessage: ((event: WebSocketEvent<any>) => void) | null = null;
    onConnectionStatusChange: ((status: string) => void) | null = null;

    constructor(private userToken: string) {}

    // Main connection method with authentication
    async connect(sessionId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.setConnectionStatus('connecting');
                
                // Create STOMP client with SockJS fallback
                this.stompClient = new Client({
                    webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
                    connectHeaders: {
                        Authorization: `Bearer ${this.userToken}`
                    },
                    debug: (str) => console.log('STOMP Debug:', str),
                    reconnectDelay: 5000,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                });

                // Connection success handler
                this.stompClient.onConnect = (frame) => {
                    console.log('✅ WebSocket connected:', frame);
                    this.setConnectionStatus('connected');
                    this.subscribeToSession(sessionId);
                    this.onConnect?.();
                    resolve();
                };

                // Connection error handler
                this.stompClient.onStompError = (frame) => {
                    console.error('❌ STOMP error:', frame);
                    this.setConnectionStatus('disconnected');
                    const error = new Error(`WebSocket error: ${frame.headers['message']}`);
                    this.onError?.(error);
                    reject(error);
                };

                // Disconnection handler
                this.stompClient.onDisconnect = (frame) => {
                    console.log('🔌 WebSocket disconnected:', frame);
                    this.setConnectionStatus('disconnected');
                    this.onDisconnect?.();
                };

                // Activate connection
                this.stompClient.activate();

            } catch (error) {
                console.error('❌ WebSocket connection failed:', error);
                this.setConnectionStatus('disconnected');
                reject(error);
            }
        });
    }

    // Subscribe to session-specific location updates
    private subscribeToSession(sessionId: string): void {
        if (!this.stompClient?.connected) {
            this.pendingSessionId = sessionId;
            return;
        }

        const destination = `/topic/locations/${sessionId}`;
        console.log(`📡 Subscribing to: ${destination}`);

        this.stompClient.subscribe(destination, (message) => {
            try {
                const event: WebSocketEvent<any> = JSON.parse(message.body);
                console.log('📨 WebSocket event received:', event);
                
                // Notify all registered handlers
                this.messageHandlers.forEach(handler => {
                    try {
                        handler(event);
                    } catch (handlerError) {
                        console.error('Error in message handler:', handlerError);
                    }
                });

                this.onMessage?.(event);
            } catch (parseError) {
                console.error('Failed to parse WebSocket message:', parseError);
            }
        });
    }
}
```

#### Retry Mechanism for Resilience
```typescript
// utils/RetryMechanism.ts - Robust retry logic
export class WebSocketRetryManager {
    private retryCount = 0;
    private isRetrying = false;

    constructor(
        private maxRetries: number = 5,
        private baseDelay: number = 1000
    ) {}

    async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
        if (this.isRetrying) {
            throw new Error('Retry operation already in progress');
        }

        this.isRetrying = true;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await operation();
                this.reset(); // Success - reset counters
                return result;
            } catch (error) {
                console.warn(`Attempt ${attempt + 1} failed:`, error);
                
                if (attempt === this.maxRetries) {
                    this.isRetrying = false;
                    throw new Error(`Operation failed after ${this.maxRetries + 1} attempts: ${error.message}`);
                }
                
                // Exponential backoff with jitter
                const delay = this.calculateDelay(attempt);
                console.log(`Retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
    }

    private calculateDelay(attempt: number): number {
        // Exponential backoff: baseDelay * 2^attempt + random jitter
        const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Random 0-1000ms jitter
        return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset(): void {
        this.retryCount = 0;
        this.isRetrying = false;
    }
}
```

#### Component Integration Pattern
```typescript
// components/features/map/RightMapPanel.tsx - WebSocket integration
const RightMapPanel = ({ currentSessionId, currentUserToken }: Props) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const mapServiceRef = useRef<MapService | null>(null);

    // Initialize WebSocket connection
    useEffect(() => {
        if (!currentUserToken || !currentSessionId) return;

        const initializeWebSocket = async () => {
            try {
                const mapService = new MapService(currentUserToken);
                mapServiceRef.current = mapService;

                // Set up event handlers
                mapService.onConnectionStatusChange = setConnectionStatus;
                
                mapService.onConnect = () => {
                    console.log('✅ Map service connected');
                    toast.success('Real-time updates connected');
                };

                mapService.onDisconnect = () => {
                    console.log('🔌 Map service disconnected');
                    toast.error('Real-time updates disconnected');
                };

                mapService.onError = (error) => {
                    console.error('❌ Map service error:', error);
                    toast.error('Connection error: ' + error.message);
                };

                // WebSocket message handler
                const messageHandler = (event: WebSocketEvent<any>) => {
                    console.log("📡 Processing WebSocket event:", event);
                    
                    switch (event.type) {
                        case 'LOCATION_ADDED':
                            handleLocationAdded(event.payload as Location);
                            break;
                            
                        case 'LOCATION_REMOVED':
                            handleLocationRemoved(event.payload.locationId);
                            break;
                            
                        case 'MAP_CLEARED':
                            handleMapCleared();
                            break;
                            
                        default:
                            console.warn('Unknown WebSocket event type:', event.type);
                    }
                };

                mapService.addMessageHandler(messageHandler);

                // Connect to WebSocket
                await mapService.connect(currentSessionId);

            } catch (error) {
                console.error('Failed to initialize WebSocket:', error);
                setConnectionStatus('disconnected');
            }
        };

        initializeWebSocket();

        // Cleanup on unmount
        return () => {
            mapServiceRef.current?.disconnect();
        };
    }, [currentSessionId, currentUserToken]);

    // Handle real-time location addition
    const handleLocationAdded = useCallback((newLocation: Location) => {
        setLocations(prev => {
            // Prevent duplicates using multiple checks
            const exists = prev.some(loc => {
                // Check by ID (most reliable)
                if (loc.id === newLocation.id) return true;
                
                // Check by name for same cities
                if (loc.name === newLocation.name) {
                    console.log(`⚠️ Location "${newLocation.name}" already exists`);
                    return true;
                }
                
                // Check by proximity (within 100 meters)
                const distance = calculateHaversineDistance(
                    loc.latitude, loc.longitude,
                    newLocation.latitude, newLocation.longitude
                );
                return distance < 100;
            });

            if (exists) {
                console.log("⚠️ Duplicate location detected, skipping");
                return prev;
            }

            console.log("✅ Adding new location:", newLocation);
            toast.success(`Added ${newLocation.name} to map`);
            return [...prev, newLocation];
        });
    }, []);

    // Handle real-time location removal
    const handleLocationRemoved = useCallback((locationId: string) => {
        setLocations(prev => {
            const filtered = prev.filter(loc => loc.id !== locationId);
            const removed = prev.find(loc => loc.id === locationId);
            if (removed) {
                toast.success(`Removed ${removed.name} from map`);
            }
            return filtered;
        });
    }, []);

    // Handle map clearing
    const handleMapCleared = useCallback(() => {
        setLocations([]);
        toast.success("Map cleared");
    }, []);
};
```

### Backend WebSocket Implementation

#### WebSocket Configuration
```java
// config/WebSocketConfig.java - Comprehensive WebSocket setup
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for broadcasting to topics
        config.enableSimpleBroker("/topic");
        
        // Set application destination prefix for client messages
        config.setApplicationDestinationPrefixes("/app");
        
        // Configure user-specific destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                    "http://localhost:3000",
                    "https://www.flomadtravel.com",
                    "https://flomadtravel.com"
                )
                .withSockJS(); // Enable SockJS fallback for browsers without WebSocket support
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add authentication interceptor for WebSocket connections
        registration.interceptors(new WebSocketAuthenticationInterceptor());
    }
}
```

#### WebSocket Authentication Interceptor
```java
// WebSocketAuthenticationInterceptor.java - Secure WebSocket connections
@Component
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {
    
    private final JwtTokenUtil jwtTokenUtil;
    
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = 
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract JWT token from connection headers
            String authToken = accessor.getFirstNativeHeader("Authorization");
            
            if (authToken != null && authToken.startsWith("Bearer ")) {
                String token = authToken.substring(7);
                
                try {
                    // Validate JWT token
                    if (jwtTokenUtil.isTokenValid(token)) {
                        String username = jwtTokenUtil.getUsernameFromToken(token);
                        List<String> roles = jwtTokenUtil.getRolesFromToken(token);
                        
                        // Set authenticated user in WebSocket session
                        Collection<GrantedAuthority> authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());
                            
                        UsernamePasswordAuthenticationToken auth = 
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                        accessor.setUser(auth);
                        
                        log.info("✅ WebSocket authenticated for user: {}", username);
                    } else {
                        log.warn("❌ Invalid WebSocket token");
                        throw new IllegalArgumentException("Invalid authentication token");
                    }
                } catch (Exception e) {
                    log.error("WebSocket authentication failed: {}", e.getMessage());
                    throw new IllegalArgumentException("Authentication failed");
                }
            } else {
                log.warn("❌ No WebSocket authentication token provided");
                throw new IllegalArgumentException("Authentication token required");
            }
        }
        
        return message;
    }
}
```

#### WebSocket Event Broadcasting Service
```java
// service/socket/WebSocketService.java - Event broadcasting
@Service
@Slf4j
public class WebSocketService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Broadcast location addition to all session subscribers
     */
    public void broadcastLocationAdded(String sessionId, Location location) {
        WebSocketEvent<Location> event = WebSocketEvent.<Location>builder()
            .type("LOCATION_ADDED")
            .payload(location)
            .timestamp(LocalDateTime.now())
            .sessionId(sessionId)
            .build();
            
        String destination = "/topic/locations/" + sessionId;
        log.info("📡 Broadcasting LOCATION_ADDED to {}: {}", destination, location.getName());
        
        messagingTemplate.convertAndSend(destination, event);
    }
    
    /**
     * Broadcast location removal to all session subscribers
     */
    public void broadcastLocationRemoved(String sessionId, String locationId, String locationName) {
        Map<String, String> payload = Map.of(
            "locationId", locationId,
            "locationName", locationName != null ? locationName : "Unknown"
        );
        
        WebSocketEvent<Map<String, String>> event = WebSocketEvent.<Map<String, String>>builder()
            .type("LOCATION_REMOVED")
            .payload(payload)
            .timestamp(LocalDateTime.now())
            .sessionId(sessionId)
            .build();
            
        String destination = "/topic/locations/" + sessionId;
        log.info("📡 Broadcasting LOCATION_REMOVED to {}: {}", destination, locationName);
        
        messagingTemplate.convertAndSend(destination, event);
    }
    
    /**
     * Broadcast map clearing to all session subscribers
     */
    public void broadcastMapCleared(String sessionId) {
        WebSocketEvent<Object> event = WebSocketEvent.builder()
            .type("MAP_CLEARED")
            .payload(Map.of("message", "All locations cleared"))
            .timestamp(LocalDateTime.now())
            .sessionId(sessionId)
            .build();
            
        String destination = "/topic/locations/" + sessionId;
        log.info("📡 Broadcasting MAP_CLEARED to {}", destination);
        
        messagingTemplate.convertAndSend(destination, event);
    }
    
    /**
     * Send error message to specific user
     */
    public void sendErrorToUser(String userId, String errorMessage) {
        WebSocketEvent<Object> event = WebSocketEvent.builder()
            .type("ERROR")
            .payload(Map.of("message", errorMessage))
            .timestamp(LocalDateTime.now())
            .build();
            
        messagingTemplate.convertAndSendToUser(userId, "/queue/errors", event);
    }
}
```

### WebSocket Event Types

#### Event Schema Definition
```java
// model/WebSocketEvent.java - Standardized event structure
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketEvent<T> {
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("payload")
    private T payload;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
    
    @JsonProperty("sessionId")
    private String sessionId;
    
    @JsonProperty("userId")
    private String userId;
    
    // Event type constants
    public static final String LOCATION_ADDED = "LOCATION_ADDED";
    public static final String LOCATION_REMOVED = "LOCATION_REMOVED";
    public static final String LOCATION_UPDATED = "LOCATION_UPDATED";
    public static final String MAP_CLEARED = "MAP_CLEARED";
    public static final String SESSION_JOINED = "SESSION_JOINED";
    public static final String SESSION_LEFT = "SESSION_LEFT";
    public static final String ERROR = "ERROR";
}
```

### Integration with AI Functions

#### Real-time Updates in AI Functions
```java
// ai/functions/AddLocationFunction.java - WebSocket integration
@Override
public String apply(AddLocationRequest request) {
    try {
        String sessionId = SessionContextHolder.getSessionId();
        
        // Create and save location
        Location location = Location.builder()
            .sessionId(sessionId)
            .name(request.getName())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .type(request.getType())
            .createdAt(LocalDateTime.now())
            .build();
        
        Location savedLocation = locationService.save(location);
        log.info("💾 Location saved: {} (ID: {})", savedLocation.getName(), savedLocation.getId());
        
        // Broadcast real-time update
        webSocketService.broadcastLocationAdded(sessionId, savedLocation);
        log.info("📡 WebSocket event broadcasted for location: {}", savedLocation.getName());
        
        return String.format("✅ Added %s to your travel map! You can see it marked on the map now.", 
                           request.getName());
                           
    } catch (Exception e) {
        log.error("❌ Failed to add location: {}", e.getMessage(), e);
        return "Sorry, I couldn't add that location. Please try again.";
    }
}
```

### Performance Optimizations

#### Connection Pooling and Resource Management
```java
// config/WebSocketPerformanceConfig.java
@Configuration
public class WebSocketPerformanceConfig {
    
    @Bean
    public TaskScheduler heartBeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("websocket-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }
    
    @Bean
    public SimpMessagingTemplate messagingTemplate(SimpMessageSendingOperations messageChannel) {
        SimpMessagingTemplate template = new SimpMessagingTemplate(messageChannel);
        template.setSendTimeout(10000); // 10 second timeout
        return template;
    }
}
```

#### Message Deduplication
```typescript
// Frontend message deduplication
class MessageDeduplicator {
    private processedMessages = new Set<string>();
    private readonly maxCacheSize = 1000;
    
    isProcessed(messageId: string): boolean {
        if (this.processedMessages.has(messageId)) {
            return true;
        }
        
        // Add to cache
        this.processedMessages.add(messageId);
        
        // Prevent memory leaks by limiting cache size
        if (this.processedMessages.size > this.maxCacheSize) {
            const iterator = this.processedMessages.values();
            for (let i = 0; i < 100; i++) { // Remove oldest 100 items
                const { value } = iterator.next();
                this.processedMessages.delete(value);
            }
        }
        
        return false;
    }
}
```

### Useful Links for Real-time Development

- [STOMP Protocol Specification](https://stomp.github.io/stomp-specification-1.2.html) - WebSocket messaging protocol
- [SockJS Documentation](https://github.com/sockjs/sockjs-client) - WebSocket fallback library
- [Spring WebSocket Reference](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket) - Spring WebSocket guide
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Browser WebSocket API
- [STOMP.js Client Library](https://stomp-js.github.io/stompjs/) - JavaScript STOMP client

---

## 8. Database & Data Models

### MongoDB Architecture Overview

The application uses **MongoDB** as the primary database with **Mongock** for version-controlled migrations and **Spring Data MongoDB** for object-document mapping.

```
Database Architecture:

┌─────────────────────────────────────────────────────────────────┐
│                     MongoDB Database                            │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │     users       │ │    sessions     │ │    messages     │   │
│  │   (User auth    │ │  (Chat sessions)│ │ (Chat history)  │   │
│  │   & profiles)   │ │                 │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   locations     │ │  destinations   │ │   migrations    │   │
│  │ (Map markers &  │ │(Travel targets) │ │ (Schema version │   │
│  │  coordinates)   │ │                 │ │    control)     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Relationships:
users (1) ────── (N) sessions ────── (N) messages
  │                 │
  │                 └────── (N) locations
  │
  └────── (N) destinations
```

### Entity Models

#### Base Model Class
```java
// model/entities/Model.java - Base entity with common fields
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class Model {
    
    @Id
    @Field("_id")
    private String id;
    
    @CreatedDate
    @Field("createdAt")
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Field("updatedAt")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### User Entity
```java
// model/entities/login/User.java - User authentication and profile
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User extends Model {
    
    @Field("username")
    @Indexed(unique = true)
    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    @Field("email")
    @Indexed(unique = true)
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email cannot be blank")
    private String email;
    
    @Field("password")
    private String password; // Encrypted password for local auth
    
    @Field("firstName")
    @Size(max = 100, message = "First name cannot exceed 100 characters")
    private String firstName;
    
    @Field("lastName")
    @Size(max = 100, message = "Last name cannot exceed 100 characters")
    private String lastName;
    
    @Field("profilePicture")
    private String profilePicture; // URL to profile image
    
    @Field("roles")
    @Builder.Default
    private List<String> roles = Arrays.asList("USER");
    
    @Field("isActive")
    @Builder.Default
    private Boolean isActive = true;
    
    @Field("isEmailVerified")
    @Builder.Default
    private Boolean isEmailVerified = false;
    
    @Field("lastLoginAt")
    private LocalDateTime lastLoginAt;
    
    // OAuth2 provider information
    @Field("oauthProviders")
    private List<OAuthProvider> oauthProviders;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OAuthProvider {
        private String provider; // "google", "linkedin", "facebook"
        private String providerId; // ID from OAuth provider
        private String providerEmail;
        private LocalDateTime connectedAt;
    }
}
```

#### Session Entity
```java
// model/entities/Session.java - Chat session management
@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "sessions")
public class Session extends Model {
    
    @Field("title")
    @Size(max = 200, message = "Session title cannot exceed 200 characters")
    @Builder.Default
    private String title = "New Travel Planning Session";
    
    @Field("userId")
    @Indexed
    private String userId; // Owner of the session
    
    @Field("isActive")
    @Builder.Default
    private Boolean isActive = true;
    
    @Field("isGuest")
    @Builder.Default
    private Boolean isGuest = false; // True for guest sessions
    
    @Field("sessionType")
    @Builder.Default
    private SessionType sessionType = SessionType.TRAVEL_PLANNING;
    
    @Field("metadata")
    private SessionMetadata metadata;
    
    @Field("sharedWith")
    private List<String> sharedWith; // User IDs with access to this session
    
    @Field("lastActivityAt")
    private LocalDateTime lastActivityAt;
    
    public enum SessionType {
        TRAVEL_PLANNING,
        FLIGHT_SEARCH,
        HOTEL_BOOKING,
        GENERAL_INQUIRY
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionMetadata {
        private String primaryDestination;
        private LocalDate travelStartDate;
        private LocalDate travelEndDate;
        private Integer travelers;
        private String budget;
        private List<String> interests;
        private Map<String, Object> customFields;
    }
}
```

#### Location Entity
```java
// model/entities/Location.java - Map location data
@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "locations")
public class Location extends Model {
    
    @Field("sessionId")
    @Indexed
    @NotBlank(message = "Session ID cannot be blank")
    private String sessionId;
    
    @Field("latitude")
    @NotNull(message = "Latitude cannot be null")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90 degrees")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90 degrees")
    private Double latitude;
    
    @Field("longitude")
    @NotNull(message = "Longitude cannot be null")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180 degrees")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180 degrees")
    private Double longitude;
    
    @Field("name")
    @Size(max = 200, message = "Location name cannot exceed 200 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-.,()\\u00C0-\\u017F]*$", 
             message = "Location name contains invalid characters")
    private String name;
    
    @Field("type")
    @Size(max = 50, message = "Location type cannot exceed 50 characters")
    @Pattern(regexp = "^(attraction|cafe|hotel|restaurant|transport|park|museum|beach|mountain|landmark|shopping|entertainment|religious|hospital|airport|station|viewpoint|nature|sports|accommodation)$", 
             message = "Invalid location type")
    private String type;
    
    @Field("description")
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
    
    @Field("address")
    private String address;
    
    @Field("placeId")
    private String placeId; // Google Places ID
    
    @Field("rating")
    @DecimalMin(value = "0.0", message = "Rating must be between 0 and 5")
    @DecimalMax(value = "5.0", message = "Rating must be between 0 and 5")
    private Double rating;
    
    @Field("priceLevel")
    private Integer priceLevel; // 0-4 scale from Google Places
    
    @Field("photos")
    private List<String> photos; // URLs to location images
    
    @Field("openingHours")
    private OpeningHours openingHours;
    
    @Field("metadata")
    private LocationMetadata metadata;
    
    // Geospatial index for location-based queries
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    @Field("coordinates")
    private Point coordinates; // GeoJSON Point for MongoDB geospatial queries
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OpeningHours {
        private List<String> weekdayText;
        private Boolean openNow;
        private List<Period> periods;
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Period {
            private Time open;
            private Time close;
            
            @Data
            @NoArgsConstructor
            @AllArgsConstructor
            public static class Time {
                private Integer day; // 0-6 (Sunday-Saturday)
                private String time; // HHMM format
            }
        }
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationMetadata {
        private String source; // "ai_generated", "user_added", "google_places"
        private LocalDateTime addedAt;
        private String addedBy; // User ID
        private Boolean isVisited;
        private Integer visitOrder; // Order in itinerary
        private String notes;
        private Map<String, Object> customFields;
    }
    
    // Pre-persist method to set coordinates for geospatial queries
    @PrePersist
    @PreUpdate
    private void updateCoordinates() {
        if (latitude != null && longitude != null) {
            this.coordinates = new Point(longitude, latitude);
        }
    }
}
```

#### Message Entity
```java
// model/entities/Message.java - Chat message storage
@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "messages")
public class Message extends Model {
    
    @Field("sessionId")
    @Indexed
    @NotBlank(message = "Session ID cannot be blank")
    private String sessionId;
    
    @Field("userId")
    @Indexed
    private String userId; // Message sender
    
    @Field("content")
    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 10000, message = "Message content cannot exceed 10000 characters")
    private String content;
    
    @Field("messageType")
    @Builder.Default
    private MessageType messageType = MessageType.USER;
    
    @Field("metadata")
    private MessageMetadata metadata;
    
    @Field("attachments")
    private List<Attachment> attachments;
    
    @Field("isDeleted")
    @Builder.Default
    private Boolean isDeleted = false;
    
    @Field("editedAt")
    private LocalDateTime editedAt;
    
    public enum MessageType {
        USER,           // User message
        ASSISTANT,      // AI assistant response
        SYSTEM,         // System notification
        ERROR,          // Error message
        FUNCTION_CALL,  // AI function execution result
        LOCATION_UPDATE // Location-related update
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageMetadata {
        private List<String> functionsUsed; // AI functions called
        private Integer tokens; // Token count for AI processing
        private String model; // AI model used
        private Double temperature; // AI generation temperature
        private String language; // Message language
        private Map<String, Object> aiContext; // AI processing context
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Attachment {
        private String type; // "image", "document", "location", "link"
        private String url;
        private String filename;
        private Long size;
        private String mimeType;
        private Map<String, Object> metadata;
    }
}
```

### Repository Interfaces

#### Custom Repository with Geospatial Queries
```java
// model/repository/LocationRepository.java - Advanced location queries
@Repository
public interface LocationRepository extends MongoRepository<Location, String> {
    
    // Find locations by session
    List<Location> findBySessionIdOrderByCreatedAtAsc(String sessionId);
    
    // Find locations by type within a session
    List<Location> findBySessionIdAndTypeOrderByCreatedAtAsc(String sessionId, String type);
    
    // Geospatial query: Find locations within radius
    @Query("{ 'coordinates': { $geoWithin: { $centerSphere: [ [?1, ?0], ?2 ] } } }")
    List<Location> findLocationsWithinRadius(Double latitude, Double longitude, Double radiusInRadians);
    
    // Find locations near a point (using GeoJSON)
    List<Location> findByCoordinatesNear(Point point, Distance distance);
    
    // Count locations in session
    long countBySessionId(String sessionId);
    
    // Find locations by name pattern (case-insensitive)
    @Query("{ 'name': { $regex: ?0, $options: 'i' } }")
    List<Location> findByNameContainingIgnoreCase(String namePattern);
    
    // Custom aggregation for location statistics
    @Aggregation(pipeline = {
        "{ $match: { sessionId: ?0 } }",
        "{ $group: { _id: '$type', count: { $sum: 1 } } }",
        "{ $sort: { count: -1 } }"
    })
    List<LocationTypeCount> getLocationStatsBySession(String sessionId);
    
    // Delete all locations in a session
    void deleteBySessionId(String sessionId);
    
    // Interface for aggregation results
    interface LocationTypeCount {
        String get_id(); // Location type
        Integer getCount(); // Count of locations
    }
}
```

#### Session Repository
```java
// model/repository/SessionRepository.java - Session management queries
@Repository
public interface SessionRepository extends MongoRepository<Session, String> {
    
    // Find active sessions for a user
    List<Session> findByUserIdAndIsActiveTrueOrderByLastActivityAtDesc(String userId);
    
    // Find guest sessions
    List<Session> findByIsGuestTrueAndCreatedAtBefore(LocalDateTime cutoffDate);
    
    // Find sessions by title pattern
    @Query("{ 'title': { $regex: ?0, $options: 'i' } }")
    List<Session> findByTitleContainingIgnoreCase(String titlePattern);
    
    // Count active sessions for user
    long countByUserIdAndIsActiveTrue(String userId);
    
    // Find sessions shared with user
    @Query("{ 'sharedWith': ?0 }")
    List<Session> findSessionsSharedWithUser(String userId);
    
    // Update last activity timestamp
    @Query("{ '_id': ?0 }")
    @Update("{ '$set': { 'lastActivityAt': ?1 } }")
    void updateLastActivity(String sessionId, LocalDateTime timestamp);
    
    // Cleanup old guest sessions
    void deleteByIsGuestTrueAndCreatedAtBefore(LocalDateTime cutoffDate);
}
```

### Database Configuration

#### MongoDB Configuration
```java
// config/MongoConfig.java - MongoDB setup with auditing
@Configuration
@EnableMongoAuditing
public class MongoConfig extends AbstractMongoClientConfiguration {
    
    @Value("${spring.data.mongodb.database}")
    private String databaseName;
    
    @Override
    protected String getDatabaseName() {
        return databaseName;
    }
    
    @Override
    public MongoClient mongoClient() {
        ConnectionString connectionString = new ConnectionString(
            System.getenv("SPRING_DATA_MONGODB_URI")
        );
        
        MongoClientSettings settings = MongoClientSettings.builder()
            .applyConnectionString(connectionString)
            .applyToConnectionPoolSettings(builder -> 
                builder.maxSize(20)
                       .minSize(5)
                       .maxWaitTime(30, TimeUnit.SECONDS)
                       .maxConnectionIdleTime(60, TimeUnit.SECONDS)
            )
            .build();
            
        return MongoClients.create(settings);
    }
    
    // Custom conversions for complex types
    @Override
    public MongoCustomConversions customConversions() {
        List<Converter<?, ?>> converters = Arrays.asList(
            new LocalDateTimeToStringConverter(),
            new StringToLocalDateTimeConverter(),
            new PointToDoubleArrayConverter(),
            new DoubleArrayToPointConverter()
        );
        return new MongoCustomConversions(converters);
    }
    
    // Geospatial index creation
    @Bean
    public MongoTemplate mongoTemplate() throws Exception {
        MongoTemplate template = new MongoTemplate(mongoClient(), getDatabaseName());
        
        // Create geospatial index for locations
        template.indexOps(Location.class)
                .ensureIndex(new GeospatialIndex("coordinates"));
        
        // Create compound indexes for performance
        template.indexOps(Location.class)
                .ensureIndex(new Index().on("sessionId", Sort.Direction.ASC)
                                      .on("type", Sort.Direction.ASC));
        
        template.indexOps(Message.class)
                .ensureIndex(new Index().on("sessionId", Sort.Direction.ASC)
                                      .on("createdAt", Sort.Direction.DESC));
        
        return template;
    }
}
```

### Database Migrations with Mongock

#### Migration Configuration
```java
// config/MongockConfig.java - Database migration setup
@Configuration
public class MongockConfig {
    
    @Bean
    public MongockSpring5.MongockApplicationRunner mongockApplicationRunner(
            ApplicationContext springContext,
            MongoTemplate mongoTemplate
    ) {
        return MongockSpring5.builder()
                .setDriver(SpringDataMongoV3Driver.withDefaultLock(mongoTemplate))
                .addMigrationScanPackage("com.springboot.FlomadAIplanner.changelogs")
                .setSpringContext(springContext)
                .setTransactionEnabled(false) // MongoDB doesn't support multi-document transactions in all deployments
                .build()
                .createApplicationRunner();
    }
}
```

#### Sample Migration
```java
// changelogs/InitialDataMigration.java - Database initialization
@ChangeLog(order = "001")
public class InitialDataMigration {
    
    @ChangeSet(order = "001", id = "createIndexes", author = "system")
    public void createIndexes(MongoTemplate mongoTemplate) {
        // Create indexes for better query performance
        mongoTemplate.indexOps(User.class)
                     .ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
        
        mongoTemplate.indexOps(User.class)
                     .ensureIndex(new Index().on("username", Sort.Direction.ASC).unique());
        
        mongoTemplate.indexOps(Session.class)
                     .ensureIndex(new Index().on("userId", Sort.Direction.ASC)
                                           .on("isActive", Sort.Direction.ASC));
        
        mongoTemplate.indexOps(Location.class)
                     .ensureIndex(new GeospatialIndex("coordinates"));
    }
    
    @ChangeSet(order = "002", id = "createDefaultRoles", author = "system")  
    public void createDefaultRoles(MongoTemplate mongoTemplate) {
        // Create default system roles if needed
        // This could include admin users, default configurations, etc.
    }
    
    @ChangeSet(order = "003", id = "migrateExistingData", author = "system")
    public void migrateExistingData(MongoTemplate mongoTemplate) {
        // Migration logic for existing data transformations
        Query query = new Query(Criteria.where("coordinates").exists(false));
        Update update = new Update().set("coordinates", null);
        
        mongoTemplate.updateMulti(query, update, Location.class);
    }
}
```

### Data Transfer Objects (DTOs)

#### Location DTO
```java
// dto/LocationDTO.java - API data transfer object
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LocationDTO {
    
    private String id;
    private String sessionId;
    private Double latitude;
    private Double longitude;
    private String name;
    private String type;
    private String description;
    private String address;
    private String placeId;
    private Double rating;
    private Integer priceLevel;
    private List<String> photos;
    private OpeningHoursDTO openingHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OpeningHoursDTO {
        private List<String> weekdayText;
        private Boolean openNow;
        private List<PeriodDTO> periods;
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PeriodDTO {
            private TimeDTO open;
            private TimeDTO close;
            
            @Data
            @NoArgsConstructor
            @AllArgsConstructor
            public static class TimeDTO {
                private Integer day;
                private String time;
            }
        }
    }
}
```

### Service Layer Integration

#### Location Service with Database Operations
```java
// service/model/LocationService.java - Business logic with database
@Service
@Slf4j
public class LocationService {
    
    private final LocationRepository locationRepository;
    private final WebSocketService webSocketService;
    private final LocationMapper locationMapper;
    
    public LocationService(LocationRepository locationRepository, 
                          WebSocketService webSocketService,
                          LocationMapper locationMapper) {
        this.locationRepository = locationRepository;
        this.webSocketService = webSocketService;
        this.locationMapper = locationMapper;
    }
    
    @Transactional
    public Location save(Location location) {
        try {
            // Validate location data
            validateLocation(location);
            
            // Check for duplicates in session
            List<Location> existingLocations = locationRepository
                .findBySessionIdOrderByCreatedAtAsc(location.getSessionId());
            
            boolean isDuplicate = existingLocations.stream()
                .anyMatch(existing -> isLocationDuplicate(existing, location));
            
            if (isDuplicate) {
                throw new IllegalArgumentException("Location already exists in this session");
            }
            
            // Set metadata
            if (location.getMetadata() == null) {
                location.setMetadata(Location.LocationMetadata.builder()
                    .source("ai_generated")
                    .addedAt(LocalDateTime.now())
                    .visitOrder(existingLocations.size() + 1)
                    .build());
            }
            
            // Save location
            Location savedLocation = locationRepository.save(location);
            log.info("💾 Location saved: {} (ID: {})", 
                    savedLocation.getName(), savedLocation.getId());
            
            // Broadcast WebSocket event
            webSocketService.broadcastLocationAdded(
                location.getSessionId(), savedLocation);
            
            return savedLocation;
            
        } catch (Exception e) {
            log.error("Failed to save location: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save location", e);
        }
    }
    
    public List<Location> getLocationsBySession(String sessionId) {
        return locationRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }
    
    public List<Location> findNearbyLocations(Double latitude, Double longitude, Double radiusKm) {
        // Convert radius from kilometers to radians
        Double radiusInRadians = radiusKm / 6371.0;
        
        return locationRepository.findLocationsWithinRadius(
            latitude, longitude, radiusInRadians);
    }
    
    @Transactional
    public void deleteLocation(String locationId) {
        Location location = locationRepository.findById(locationId)
            .orElseThrow(() -> new RuntimeException("Location not found"));
            
        locationRepository.deleteById(locationId);
        
        webSocketService.broadcastLocationRemoved(
            location.getSessionId(), locationId, location.getName());
    }
    
    @Transactional
    public void clearSessionLocations(String sessionId) {
        locationRepository.deleteBySessionId(sessionId);
        webSocketService.broadcastMapCleared(sessionId);
    }
    
    private boolean isLocationDuplicate(Location existing, Location newLocation) {
        // Check by name
        if (existing.getName() != null && existing.getName().equalsIgnoreCase(newLocation.getName())) {
            return true;
        }
        
        // Check by proximity (within 100 meters)
        double distance = calculateDistance(
            existing.getLatitude(), existing.getLongitude(),
            newLocation.getLatitude(), newLocation.getLongitude()
        );
        
        return distance < 0.1; // 100 meters
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula for distance calculation
        final int R = 6371; // Earth radius in kilometers
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}
```

### Useful Links for Database Development

- [MongoDB Documentation](https://docs.mongodb.com/) - Complete MongoDB guide
- [Spring Data MongoDB Reference](https://docs.spring.io/spring-data/mongodb/docs/current/reference/html/) - Spring MongoDB integration
- [Mongock Documentation](https://docs.mongock.io/) - Database migration framework
- [MongoDB Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/) - Location-based queries
- [MongoDB Indexes Guide](https://docs.mongodb.com/manual/indexes/) - Performance optimization
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Cloud MongoDB service
- [Spring Boot MongoDB Tutorial](https://spring.io/guides/gs/accessing-data-mongodb/) - Getting started guide

---

## 9. Testing Strategy

### Testing Architecture Overview

The application implements a comprehensive testing strategy covering **unit tests**, **integration tests**, **end-to-end tests**, and **API testing** across both frontend and backend components.

```
Testing Pyramid:

                    ┌─────────────────────┐
                    │   E2E Tests (Few)   │
                    │  - User workflows   │
                    │  - Full system      │
                    └─────────────────────┘
                 ┌─────────────────────────────┐
                 │ Integration Tests (Some)    │
                 │ - API endpoints            │
                 │ - Database operations      │
                 │ - WebSocket communication  │
                 │ - External service mocks   │
                 └─────────────────────────────┘
          ┌─────────────────────────────────────────────┐
          │        Unit Tests (Many)                    │
          │ - Component logic                           │
          │ - Service methods                           │
          │ - Utility functions                         │
          │ - AI function validation                    │
          │ - Authentication flows                      │
          └─────────────────────────────────────────────┘
```

### Frontend Testing (Jest + React Testing Library)

#### Jest Configuration
```typescript
// jest.config.ts - Comprehensive Jest setup
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Module path mapping for absolute imports
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  
  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-.*|rehype-.*|unified|bail|is-plain-obj|trough|vfile|unist-.*|mdast-.*|micromark|decode-named-character-reference|character-entities|property-information|hast-util-.*|comma-separated-tokens|space-separated-tokens|ccount|escape-string-regexp|markdown-table)/)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Test environment setup
  testTimeout: 30000,
  verbose: true,
}

export default createJestConfig(customJestConfig)
```

#### Jest Setup File
```typescript
// jest.setup.ts - Global test setup
import '@testing-library/jest-dom'

// Mock Google Maps JavaScript API
const mockGoogleMaps = {
  maps: {
    Map: jest.fn(() => ({
      setCenter: jest.fn(),
      setZoom: jest.fn(),
      addListener: jest.fn(),
      getCenter: jest.fn(() => ({ lat: () => 0, lng: () => 0 })),
      getZoom: jest.fn(() => 10),
    })),
    Marker: jest.fn(() => ({
      setMap: jest.fn(),
      setPosition: jest.fn(),
      setTitle: jest.fn(),
      addListener: jest.fn(),
    })),
    InfoWindow: jest.fn(() => ({
      setContent: jest.fn(),
      open: jest.fn(),
      close: jest.fn(),
    })),
    MarkerClusterer: jest.fn(() => ({
      addMarkers: jest.fn(),
      clearMarkers: jest.fn(),
    })),  
    places: {
      PlacesService: jest.fn(() => ({
        getDetails: jest.fn(),
        textSearch: jest.fn(),
      })),
    },
    geometry: {
      spherical: {
        computeDistanceBetween: jest.fn(() => 1000),
      },
    },
    LatLng: jest.fn((lat, lng) => ({ lat: () => lat, lng: () => lng })),
    Size: jest.fn(),
    Point: jest.fn(),
  },
};

// Make Google Maps available globally
(global as any).google = mockGoogleMaps;

// Mock WebSocket/STOMP
jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn(() => ({
    activate: jest.fn(),
    deactivate: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    onConnect: null,
    onDisconnect: null,
    onStompError: null,
    connected: true,
  })),
}));

// Mock SockJS
jest.mock('sockjs-client', () => jest.fn());

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Suppress console errors in tests unless debugging
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
```

#### Component Testing Examples

##### MapService Testing
```typescript
// src/services/__tests__/MapService.test.ts
import { MapService } from '../MapService';
import { Client } from '@stomp/stompjs';

// Mock the STOMP client
jest.mock('@stomp/stompjs');

describe('MapService', () => {
  let mapService: MapService;
  let mockStompClient: jest.Mocked<Client>;
  const mockToken = 'mock-jwt-token';
  const mockSessionId = 'test-session-123';

  beforeEach(() => {
    mockStompClient = {
      activate: jest.fn(),
      deactivate: jest.fn(),
      subscribe: jest.fn(),
      publish: jest.fn(),
      onConnect: null,
      onDisconnect: null,
      onStompError: null,
      connected: true,
    } as any;

    (Client as jest.Mock).mockImplementation(() => mockStompClient);
    
    mapService = new MapService(mockToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    test('should establish WebSocket connection with authentication', async () => {
      const connectPromise = mapService.connect(mockSessionId);
      
      // Simulate successful connection
      mockStompClient.onConnect({ command: 'CONNECTED', headers: {}, body: '' });
      
      await connectPromise;
      
      expect(Client).toHaveBeenCalledWith({
        webSocketFactory: expect.any(Function),
        connectHeaders: { Authorization: `Bearer ${mockToken}` },
        debug: expect.any(Function),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      
      expect(mockStompClient.activate).toHaveBeenCalled();
    });

    test('should handle connection errors gracefully', async () => {
      const connectPromise = mapService.connect(mockSessionId);
      
      // Simulate connection error
      const errorFrame = {
        command: 'ERROR',
        headers: { message: 'Authentication failed' },
        body: '',
      };
      mockStompClient.onStompError(errorFrame);
      
      await expect(connectPromise).rejects.toThrow('WebSocket error: Authentication failed');
    });

    test('should subscribe to session-specific topics', async () => {
      const connectPromise = mapService.connect(mockSessionId);
      
      // Simulate successful connection
      mockStompClient.onConnect({ command: 'CONNECTED', headers: {}, body: '' });
      
      await connectPromise;
      
      expect(mockStompClient.subscribe).toHaveBeenCalledWith(
        `/topic/locations/${mockSessionId}`,
        expect.any(Function)
      );
    });
  });

  describe('Message Handling', () => {
    test('should process LOCATION_ADDED events', async () => {
      const messageHandler = jest.fn();
      mapService.addMessageHandler(messageHandler);
      
      const connectPromise = mapService.connect(mockSessionId);
      mockStompClient.onConnect({ command: 'CONNECTED', headers: {}, body: '' });
      await connectPromise;
      
      // Get the subscription callback
      const subscriptionCallback = (mockStompClient.subscribe as jest.Mock).mock.calls[0][1];
      
      // Simulate receiving a location added event
      const mockEvent = {
        type: 'LOCATION_ADDED',
        payload: {
          id: 'loc-123',
          name: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
        },
        timestamp: '2024-01-01T12:00:00Z',
      };
      
      subscriptionCallback({
        body: JSON.stringify(mockEvent),
      });
      
      expect(messageHandler).toHaveBeenCalledWith(mockEvent);
    });

    test('should handle malformed messages gracefully', async () => {
      const messageHandler = jest.fn();
      mapService.addMessageHandler(messageHandler);
      
      const connectPromise = mapService.connect(mockSessionId);
      mockStompClient.onConnect({ command: 'CONNECTED', headers: {}, body: '' });
      await connectPromise;
      
      const subscriptionCallback = (mockStompClient.subscribe as jest.Mock).mock.calls[0][1];
      
      // Simulate malformed JSON
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      subscriptionCallback({
        body: 'invalid-json',
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      );
      expect(messageHandler).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('REST API Methods', () => {
    test('should fetch locations with retry mechanism', async () => {
      const mockLocations = [
        { id: '1', name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
        { id: '2', name: 'London', latitude: 51.5074, longitude: -0.1278 },
      ];

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLocations),
      });

      const locations = await mapService.getLocations(mockSessionId);

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL}/api/locations/${mockSessionId}`,
        {
          headers: { Authorization: `Bearer ${mockToken}` },
          signal: expect.any(AbortSignal),
        }
      );
      
      expect(locations).toEqual(mockLocations);
    });

    test('should handle API errors with retry', async () => {
      // Mock fetch to fail twice then succeed
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        });

      const locations = await mapService.getLocations(mockSessionId);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(locations).toEqual([]);
    });
  });
});
```

##### Component Integration Test
```typescript
// src/components/features/map/__tests__/RightMapPanel.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RightMapPanel } from '../RightMapPanel';
import { MapService } from '@/services/MapService';

// Mock the MapService
jest.mock('@/services/MapService');

describe('RightMapPanel', () => {
  const mockProps = {
    currentSessionId: 'test-session-123',
    currentUserToken: 'mock-token',
    onLocationUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render map component when Google Maps is available', async () => {
    render(<RightMapPanel {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('google-map-component')).toBeInTheDocument();
    });
  });

  test('should initialize MapService with correct parameters', async () => {
    const MockMapService = MapService as jest.MockedClass<typeof MapService>;
    const mockInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      addMessageHandler: jest.fn(),
      onConnectionStatusChange: null,
      onConnect: null,
      onDisconnect: null,
      onError: null,
    };

    MockMapService.mockImplementation(() => mockInstance as any);

    render(<RightMapPanel {...mockProps} />);

    await waitFor(() => {
      expect(MockMapService).toHaveBeenCalledWith(mockProps.currentUserToken);
      expect(mockInstance.connect).toHaveBeenCalledWith(mockProps.currentSessionId);
      expect(mockInstance.addMessageHandler).toHaveBeenCalled();
    });
  });

  test('should handle WebSocket location events', async () => {
    const MockMapService = MapService as jest.MockedClass<typeof MapService>;
    let messageHandler: any;
    
    const mockInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      addMessageHandler: jest.fn().mockImplementation((handler) => {
        messageHandler = handler;
      }),
      onConnectionStatusChange: null,
      onConnect: null,
      onDisconnect: null,
      onError: null,
    };

    MockMapService.mockImplementation(() => mockInstance as any);

    render(<RightMapPanel {...mockProps} />);

    await waitFor(() => {
      expect(mockInstance.addMessageHandler).toHaveBeenCalled();
    });

    // Simulate location added event
    const locationEvent = {
      type: 'LOCATION_ADDED',
      payload: {
        id: 'loc-123',
        name: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
      },
    };

    messageHandler(locationEvent);

    await waitFor(() => {
      expect(mockProps.onLocationUpdate).toHaveBeenCalled();
    });
  });

  test('should show loading state during initialization', () => {
    render(<RightMapPanel {...mockProps} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should handle connection errors gracefully', async () => {
    const MockMapService = MapService as jest.MockedClass<typeof MapService>;
    const mockInstance = {
      connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
      disconnect: jest.fn(),
      addMessageHandler: jest.fn(),
      onConnectionStatusChange: null,
      onConnect: null,
      onDisconnect: null,
      onError: null,
    };

    MockMapService.mockImplementation(() => mockInstance as any);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<RightMapPanel {...mockProps} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize WebSocket:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
```

### Backend Testing (JUnit 5 + Spring Boot Test)

#### Test Configuration
```java
// src/test/resources/application-test.properties
spring.profiles.active=test
spring.data.mongodb.database=flomad-test-db
spring.data.mongodb.uri=mongodb://localhost:27017/flomad-test-db

# Disable external API calls in tests
amadeus.api.enabled=false
google.api.enabled=false
viator.api.enabled=false

# Test-specific configurations
logging.level.com.springboot.FlomadAIplanner=DEBUG
spring.jpa.show-sql=true

# JWT test configuration
jwt.secret=test-secret-key-for-testing-only
jwt.expiration=86400000
```

#### Unit Test Examples

##### Service Layer Testing
```java
// src/test/java/com/springboot/FlomadAIplanner/service/LocationServiceTest.java
@ExtendWith(MockitoExtension.class)
class LocationServiceTest {
    
    @Mock
    private LocationRepository locationRepository;
    
    @Mock
    private WebSocketService webSocketService;
    
    @Mock
    private LocationMapper locationMapper;
    
    @InjectMocks
    private LocationService locationService;
    
    private Location testLocation;
    private LocationDTO testLocationDTO;
    
    @BeforeEach
    void setUp() {
        testLocation = Location.builder()
            .id("loc-123")
            .sessionId("session-123")
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .type("attraction")
            .build();
            
        testLocationDTO = LocationDTO.builder()
            .id("loc-123")
            .sessionId("session-123")
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .type("attraction")
            .build();
    }
    
    @Test
    @DisplayName("Should save location successfully")
    void shouldSaveLocationSuccessfully() {
        // Given
        when(locationRepository.findBySessionIdOrderByCreatedAtAsc("session-123"))
            .thenReturn(Collections.emptyList());
        when(locationRepository.save(any(Location.class)))
            .thenReturn(testLocation);
        
        // When
        Location result = locationService.save(testLocation);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Paris");
        assertThat(result.getMetadata()).isNotNull();
        assertThat(result.getMetadata().getSource()).isEqualTo("ai_generated");
        
        verify(locationRepository).save(any(Location.class));
        verify(webSocketService).broadcastLocationAdded("session-123", testLocation);
    }
    
    @Test
    @DisplayName("Should throw exception for duplicate location")
    void shouldThrowExceptionForDuplicateLocation() {
        // Given
        Location existingLocation = Location.builder()
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .sessionId("session-123")
            .build();
            
        when(locationRepository.findBySessionIdOrderByCreatedAtAsc("session-123"))
            .thenReturn(Arrays.asList(existingLocation));
        
        // When & Then
        assertThatThrownBy(() -> locationService.save(testLocation))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Location already exists in this session");
            
        verify(locationRepository, never()).save(any(Location.class));
        verify(webSocketService, never()).broadcastLocationAdded(anyString(), any(Location.class));
    }
    
    @Test
    @DisplayName("Should find nearby locations within radius")
    void shouldFindNearbyLocationsWithinRadius() {
        // Given
        Double latitude = 48.8566;
        Double longitude = 2.3522;
        Double radiusKm = 10.0;
        Double radiusInRadians = radiusKm / 6371.0;
        
        List<Location> nearbyLocations = Arrays.asList(testLocation);
        when(locationRepository.findLocationsWithinRadius(latitude, longitude, radiusInRadians))
            .thenReturn(nearbyLocations);
        
        // When
        List<Location> result = locationService.findNearbyLocations(latitude, longitude, radiusKm);
        
        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Paris");
        
        verify(locationRepository).findLocationsWithinRadius(latitude, longitude, radiusInRadians);
    }
    
    @Test
    @DisplayName("Should delete location and broadcast removal")
    void shouldDeleteLocationAndBroadcastRemoval() {
        // Given
        when(locationRepository.findById("loc-123"))
            .thenReturn(Optional.of(testLocation));
        
        // When
        locationService.deleteLocation("loc-123");
        
        // Then
        verify(locationRepository).deleteById("loc-123");
        verify(webSocketService).broadcastLocationRemoved("session-123", "loc-123", "Paris");
    }
    
    @Test
    @DisplayName("Should throw exception when deleting non-existent location")
    void shouldThrowExceptionWhenDeletingNonExistentLocation() {
        // Given
        when(locationRepository.findById("non-existent"))
            .thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> locationService.deleteLocation("non-existent"))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("Location not found");
            
        verify(locationRepository, never()).deleteById(anyString());
        verify(webSocketService, never()).broadcastLocationRemoved(anyString(), anyString(), anyString());
    }
}
```

##### AI Function Testing
```java
// src/test/java/com/springboot/FlomadAIplanner/ai/functions/AddLocationFunctionTest.java
@ExtendWith(MockitoExtension.class)
class AddLocationFunctionTest {
    
    @Mock
    private LocationService locationService;
    
    @Mock
    private WebSocketService webSocketService;
    
    @InjectMocks
    private AddLocationFunction addLocationFunction;
    
    @Test
    @DisplayName("Should add location successfully with valid request")
    void shouldAddLocationSuccessfullyWithValidRequest() {
        // Given
        AddLocationFunction.AddLocationRequest request = 
            AddLocationFunction.AddLocationRequest.builder()
                .sessionId("session-123")
                .name("Paris")
                .latitude(48.8566)
                .longitude(2.3522)
                .type("attraction")
                .build();
        
        Location savedLocation = Location.builder()
            .id("loc-123")
            .sessionId("session-123")
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .type("attraction")
            .build();
            
        when(locationService.save(any(Location.class))).thenReturn(savedLocation);
        
        // When
        String result = addLocationFunction.apply(request);
        
        // Then
        assertThat(result).contains("Added Paris to your travel map");
        verify(locationService).save(any(Location.class));
        verify(webSocketService).broadcastLocationAdded("session-123", savedLocation);
    }
    
    @Test
    @DisplayName("Should prevent duplicate requests")
    void shouldPreventDuplicateRequests() {
        // Given
        AddLocationFunction.AddLocationRequest request = 
            AddLocationFunction.AddLocationRequest.builder()
                .sessionId("session-123")
                .name("Paris")
                .latitude(48.8566)
                .longitude(2.3522)
                .type("attraction")
                .build();
        
        // First call
        addLocationFunction.apply(request);
        
        // When - Second call immediately
        String result = addLocationFunction.apply(request);
        
        // Then
        assertThat(result).contains("Location already processed: Paris");
        verify(locationService, times(1)).save(any(Location.class)); // Only called once
    }
    
    @Test
    @DisplayName("Should handle service exceptions gracefully")
    void shouldHandleServiceExceptionsGracefully() {
        // Given
        AddLocationFunction.AddLocationRequest request = 
            AddLocationFunction.AddLocationRequest.builder()
                .sessionId("session-123")
                .name("Paris")
                .latitude(48.8566)
                .longitude(2.3522)
                .type("attraction")
                .build();
        
        when(locationService.save(any(Location.class)))
            .thenThrow(new RuntimeException("Database error"));
        
        // When
        String result = addLocationFunction.apply(request);
        
        // Then
        assertThat(result).contains("Sorry, I couldn't add that location");
        verify(webSocketService, never()).broadcastLocationAdded(anyString(), any(Location.class));
    }
}
```

#### Integration Testing

##### API Integration Tests
```java
// src/test/java/com/springboot/FlomadAIplanner/controller/LocationControllerIntegrationTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.profiles.active=test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LocationControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private LocationRepository locationRepository;
    
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    
    @LocalServerPort
    private int port;
    
    private String baseUrl;
    private String validToken;
    private HttpHeaders headers;
    
    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port;
        validToken = jwtTokenUtil.generateTestToken("testuser");
        
        headers = new HttpHeaders();
        headers.setBearerAuth(validToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Clean database
        locationRepository.deleteAll();
    }
    
    @Test
    @DisplayName("Should create location via API")
    void shouldCreateLocationViaAPI() {
        // Given
        LocationCreationRequest request = LocationCreationRequest.builder()
            .sessionId("session-123")
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .type("attraction")
            .build();
        
        HttpEntity<LocationCreationRequest> entity = new HttpEntity<>(request, headers);
        
        // When
        ResponseEntity<LocationDTO> response = restTemplate.postForEntity(
            baseUrl + "/api/locations", entity, LocationDTO.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Paris");
        
        // Verify in database
        List<Location> locations = locationRepository.findBySessionIdOrderByCreatedAtAsc("session-123");
        assertThat(locations).hasSize(1);
        assertThat(locations.get(0).getName()).isEqualTo("Paris");
    }
    
    @Test
    @DisplayName("Should return 401 without valid token")
    void shouldReturn401WithoutValidToken() {
        // Given
        LocationCreationRequest request = LocationCreationRequest.builder()
            .sessionId("session-123")
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .type("attraction")
            .build();
        
        HttpEntity<LocationCreationRequest> entity = new HttpEntity<>(request); // No auth headers
        
        // When
        ResponseEntity<String> response = restTemplate.postForEntity(
            baseUrl + "/api/locations", entity, String.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
    
    @Test
    @DisplayName("Should validate request parameters")
    void shouldValidateRequestParameters() {
        // Given - Invalid request (missing latitude)
        LocationCreationRequest request = LocationCreationRequest.builder()
            .sessionId("session-123")
            .name("Paris")
            .longitude(2.3522)
            .type("attraction")
            .build();
        
        HttpEntity<LocationCreationRequest> entity = new HttpEntity<>(request, headers);
        
        // When
        ResponseEntity<String> response = restTemplate.postForEntity(
            baseUrl + "/api/locations", entity, String.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
    
    @Test
    @DisplayName("Should retrieve locations by session")
    void shouldRetrieveLocationsBySession() {
        // Given - Create test locations
        Location location1 = locationRepository.save(Location.builder()
            .sessionId("session-123")
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .type("attraction")
            .build());
            
        Location location2 = locationRepository.save(Location.builder()
            .sessionId("session-123")
            .name("London")
            .latitude(51.5074)
            .longitude(-0.1278)
            .type("attraction")
            .build());
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        // When
        ResponseEntity<LocationDTO[]> response = restTemplate.exchange(
            baseUrl + "/api/locations/session-123", 
            HttpMethod.GET, 
            entity, 
            LocationDTO[].class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody()[0].getName()).isIn("Paris", "London");
        assertThat(response.getBody()[1].getName()).isIn("Paris", "London");
    }
}
```

##### WebSocket Integration Test
```java
// src/test/java/com/springboot/FlomadAIplanner/websocket/WebSocketIntegrationTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.profiles.active=test")
class WebSocketIntegrationTest {
    
    @LocalServerPort
    private int port;
    
    @Autowired
    private WebSocketService webSocketService;
    
    @Autowired
    private JwtTokenUtil jwtTokenUtil;
    
    private StompSession stompSession;
    private String validToken;
    
    @BeforeEach
    void setUp() throws Exception {
        validToken = jwtTokenUtil.generateTestToken("testuser");
        
        WebSocketClient client = new StandardWebSocketClient();
        WebSocketStompClient stompClient = new WebSocketStompClient(client);
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
        
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + validToken);
        
        String url = "ws://localhost:" + port + "/ws";
        stompSession = stompClient.connect(url, new WebSocketHttpHeaders(), 
                                         connectHeaders, new StompSessionHandlerAdapter() {})
                                 .get(10, TimeUnit.SECONDS);
    }
    
    @AfterEach
    void tearDown() {
        if (stompSession != null && stompSession.isConnected()) {
            stompSession.disconnect();
        }
    }
    
    @Test
    @DisplayName("Should receive location added events")
    void shouldReceiveLocationAddedEvents() throws Exception {
        // Given
        String sessionId = "test-session-123";
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<WebSocketEvent<Location>> receivedEvent = new AtomicReference<>();
        
        stompSession.subscribe("/topic/locations/" + sessionId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return new ParameterizedTypeReference<WebSocketEvent<Location>>() {}.getType();
            }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                receivedEvent.set((WebSocketEvent<Location>) payload);
                latch.countDown();
            }
        });
        
        // When
        Location testLocation = Location.builder()
            .id("loc-123")
            .sessionId(sessionId)
            .name("Paris")
            .latitude(48.8566)
            .longitude(2.3522)
            .type("attraction")
            .build();
            
        webSocketService.broadcastLocationAdded(sessionId, testLocation);
        
        // Then
        assertThat(latch.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(receivedEvent.get()).isNotNull();
        assertThat(receivedEvent.get().getType()).isEqualTo("LOCATION_ADDED");
        assertThat(receivedEvent.get().getPayload().getName()).isEqualTo("Paris");
    }
    
    @Test
    @DisplayName("Should reject connection without valid token")
    void shouldRejectConnectionWithoutValidToken() {
        // Given
        WebSocketClient client = new StandardWebSocketClient();
        WebSocketStompClient stompClient = new WebSocketStompClient(client);
        
        String url = "ws://localhost:" + port + "/ws";
        
        // When & Then
        assertThatThrownBy(() -> {
            stompClient.connect(url, new StompSessionHandlerAdapter() {})
                      .get(5, TimeUnit.SECONDS);
        }).hasCauseInstanceOf(IllegalArgumentException.class);
    }
}
```

### Test Utilities and Helpers

#### Test Data Builders
```java
// src/test/java/com/springboot/FlomadAIplanner/testutils/TestDataBuilder.java
public class TestDataBuilder {
    
    public static class LocationBuilder {
        private Location location = new Location();
        
        public static LocationBuilder aLocation() {
            return new LocationBuilder();
        }
        
        public LocationBuilder withId(String id) {
            location.setId(id);
            return this;
        }
        
        public LocationBuilder withSessionId(String sessionId) {
            location.setSessionId(sessionId);
            return this;
        }
        
        public LocationBuilder withName(String name) {
            location.setName(name);
            return this;
        }
        
        public LocationBuilder withCoordinates(Double latitude, Double longitude) {
            location.setLatitude(latitude);
            location.setLongitude(longitude);
            return this;
        }
        
        public LocationBuilder withType(String type) {
            location.setType(type);
            return this;
        }
        
        public Location build() {
            if (location.getSessionId() == null) location.setSessionId("default-session");
            if (location.getName() == null) location.setName("Test Location");
            if (location.getLatitude() == null) location.setLatitude(48.8566);
            if (location.getLongitude() == null) location.setLongitude(2.3522);
            if (location.getType() == null) location.setType("attraction");
            return location;
        }
    }
    
    public static class UserBuilder {
        private User user = new User();
        
        public static UserBuilder aUser() {
            return new UserBuilder();
        }
        
        public UserBuilder withUsername(String username) {
            user.setUsername(username);
            return this;
        }
        
        public UserBuilder withEmail(String email) {
            user.setEmail(email);
            return this;
        }
        
        public UserBuilder withRoles(String... roles) {
            user.setRoles(Arrays.asList(roles));
            return this;
        }
        
        public User build() {
            if (user.getUsername() == null) user.setUsername("testuser");
            if (user.getEmail() == null) user.setEmail("test@example.com");
            if (user.getRoles() == null) user.setRoles(Arrays.asList("USER"));
            return user;
        }
    }
}
```

### Testing Scripts and Automation

#### NPM Test Scripts
```json
// package.json - Frontend testing commands
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:map": "jest \"src/(services|components/features/map)/__tests__/\"",
    "test:map:coverage": "jest \"src/(services|components/features/map)/__tests__/\" --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

#### Maven Test Configuration
```xml
<!-- Backend testing configuration in pom.xml -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.0.0-M9</version>
            <configuration>
                <includes>
                    <include>**/*Test.java</include>
                    <include>**/*Tests.java</include>
                </includes>
                <excludes>
                    <exclude>**/*IntegrationTest.java</exclude>
                </excludes>
            </configuration>
        </plugin>
        
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-failsafe-plugin</artifactId>
            <version>3.0.0-M9</version>
            <configuration>
                <includes>
                    <include>**/*IntegrationTest.java</include>
                </includes>
            </configuration>
            <executions>
                <execution>
                    <goals>
                        <goal>integration-test</goal>
                        <goal>verify</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
        
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <version>0.8.8</version>
            <executions>
                <execution>
                    <goals>
                        <goal>prepare-agent</goal>
                    </goals>
                </execution>
                <execution>
                    <id>report</id>
                    <phase>test</phase>
                    <goals>
                        <goal>report</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

### Useful Links for Testing

- [Jest Documentation](https://jestjs.io/docs/getting-started) - JavaScript testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React component testing
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/) - Java testing framework
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/) - Spring Boot test strategies
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html) - Java mocking framework
- [Testcontainers](https://www.testcontainers.org/) - Integration testing with Docker
- [WebSocket Testing Guide](https://spring.io/guides/gs/messaging-stomp-websocket/) - WebSocket integration testing

---

## 10. Deployment & Configuration

### Overview

The AI Travel Planner supports multiple deployment environments including **local development**, **staging**, and **production** with Docker-based containerization and orchestration.

```
Deployment Architecture:

┌─────────────────────────────────────────────────────────┐
│                    Production Environment                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │   Database   │  │
│  │   Next.js    │  │ Spring Boot  │  │   MongoDB    │  │
│  │   (Port 80)  │  │ (Port 8080)  │  │ (Port 27017) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │        │
│         └──────────────────┼──────────────────┘        │
│                            │                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Nginx      │  │ Elasticsearch│  │   Logstash   │  │
│  │ (Reverse     │  │  (Logging)   │  │ (Log Proc.)  │  │
│  │  Proxy)      │  │ (Port 9200)  │  │ (Port 5000)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Environment Configuration

#### Frontend Environment Variables
```bash
# .env.local (Development)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_APP_VERSION=1.0.0

# .env.production (Production)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_google_maps_key
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Backend Application Properties
```properties
# application-local.properties (Local Development)
server.port=8080
spring.profiles.active=local

# Database
spring.data.mongodb.uri=mongodb://localhost:27017/flomad-local-db
spring.data.mongodb.database=flomad-local-db

# AI Configuration
spring.ai.openai.api-key=${SPRING_AI_OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-3.5-turbo
spring.ai.openai.chat.options.max-tokens=4000
spring.ai.openai.chat.options.temperature=0.7

# External APIs
amadeus.api.key=${AMADEUS_API_KEY}
amadeus.api.secret=${AMADEUS_API_SECRET}
amadeus.api.base-url=https://test.api.amadeus.com
google.api.key=${GOOGLE_API_KEY}
viator.api.key=${VIATOR_API_KEY}

# Security
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000
cors.allowed-origins=http://localhost:3000

# WebSocket
websocket.enabled=true
websocket.stomp.endpoint=/ws

# Logging
logging.level.com.springboot.FlomadAIplanner=DEBUG
logging.level.org.springframework.ai=DEBUG
```

```properties
# application-prod.properties (Production)
server.port=8080
spring.profiles.active=prod

# Database
spring.data.mongodb.uri=${MONGODB_URI}
spring.data.mongodb.database=${MONGODB_DATABASE}

# AI Configuration
spring.ai.openai.api-key=${SPRING_AI_OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-3.5-turbo
spring.ai.openai.chat.options.max-tokens=4000
spring.ai.openai.chat.options.temperature=0.7

# External APIs  
amadeus.api.key=${AMADEUS_API_KEY}
amadeus.api.secret=${AMADEUS_API_SECRET}
amadeus.api.base-url=https://api.amadeus.com
google.api.key=${GOOGLE_API_KEY}
viator.api.key=${VIATOR_API_KEY}

# Security
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000
cors.allowed-origins=${CORS_ALLOWED_ORIGINS}

# WebSocket
websocket.enabled=true
websocket.stomp.endpoint=/ws

# Production optimizations
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.com.springboot.FlomadAIplanner=INFO
logging.level.root=WARN

# Health checks
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized
```

### Docker Configuration

#### Frontend Dockerfile
```dockerfile
# AITravelPlannerFrontendNextjs/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_APP_VERSION

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else npm run build; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Backend Dockerfile
```dockerfile
# AITravelPlannerBackEnd/Dockerfile
FROM openjdk:17-jdk-slim as build

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .

# Make Maven wrapper executable
RUN chmod +x ./mvnw

# Download dependencies (for Docker layer caching)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Production stage
FROM openjdk:17-jre-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy the jar file from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown appuser:appuser app.jar

USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

#### Production Docker Compose
```yaml
# docker-compose.prod.yml - Full production setup
version: '3.8'

services:
  # Frontend Service
  frontend:
    build:
      context: ./AITravelPlannerFrontendNextjs
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://backend:8080}
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        NEXT_PUBLIC_APP_VERSION: ${NEXT_PUBLIC_APP_VERSION:-1.0.0}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped
    environment:
      - NODE_ENV=production

  # Backend Service
  backend:
    build:
      context: ./AITravelPlannerBackEnd
      dockerfile: Dockerfile.prod
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
      - elasticsearch
    networks:
      - app-network
    restart: unless-stopped
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - MONGODB_URI=mongodb://mongodb:27017/flomad-prod-db
      - MONGODB_DATABASE=flomad-prod-db
      - SPRING_AI_OPENAI_API_KEY=${SPRING_AI_OPENAI_API_KEY}
      - AMADEUS_API_KEY=${AMADEUS_API_KEY}
      - AMADEUS_API_SECRET=${AMADEUS_API_SECRET}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - VIATOR_API_KEY=${VIATOR_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-http://localhost:3000}
    volumes:
      - app-logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Database
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    networks:
      - app-network
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGODB_DATABASE:-flomad-prod-db}
    volumes:
      - mongodb-data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro

  # Elasticsearch for logging
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    networks:
      - app-network
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    restart: unless-stopped

  # Logstash for log processing
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    ports:
      - "5000:5000"
      - "9600:9600"
    networks:
      - app-network
    volumes:
      - ./config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
      - app-logs:/app/logs:ro
    depends_on:
      - elasticsearch
    restart: unless-stopped

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    networks:
      - app-network
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  mongodb-data:
  elasticsearch-data:
  app-logs:

networks:
  app-network:
    driver: bridge
```

#### Development Docker Compose
```yaml
# docker-compose.yml - Development environment
version: '3.8'

services:
  # MongoDB for development
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    networks:
      - dev-network
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: flomad-local-db
    volumes:
      - mongodb-dev-data:/data/db

  # Elasticsearch for development
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms256m -Xmx256m
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    networks:
      - dev-network
    volumes:
      - elasticsearch-dev-data:/usr/share/elasticsearch/data

volumes:
  mongodb-dev-data:
  elasticsearch-dev-data:

networks:
  dev-network:
    driver: bridge
```

### Environment Setup Scripts

#### Environment Validation Script
```typescript
// scripts/checkEnv.ts - Validates required environment variables
import { config } from 'dotenv';
import chalk from 'chalk';

config();

interface EnvConfig {
  required: string[];
  optional: string[];
  description: Record<string, string>;
}

const envConfig: EnvConfig = {
  required: [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  ],
  optional: [
    'NEXT_PUBLIC_APP_VERSION',
  ],
  description: {
    NEXT_PUBLIC_API_URL: 'Backend API URL (e.g., http://localhost:8080)',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'Google Maps JavaScript API key',
    NEXT_PUBLIC_APP_VERSION: 'Application version for display',
  },
};

function checkEnvironment(): boolean {
  console.log(chalk.blue('🔍 Checking environment configuration...\n'));

  let isValid = true;
  const missing: string[] = [];
  const present: string[] = [];

  // Check required variables
  for (const envVar of envConfig.required) {
    if (process.env[envVar]) {
      present.push(envVar);
    } else {
      missing.push(envVar);
      isValid = false;
    }
  }

  // Display results
  if (present.length > 0) {
    console.log(chalk.green('✅ Present environment variables:'));
    for (const envVar of present) {
      const value = process.env[envVar];
      const maskedValue = envVar.includes('KEY') || envVar.includes('SECRET') 
        ? `${value?.substring(0, 8)}...` 
        : value;
      console.log(`  ${chalk.cyan(envVar)}: ${maskedValue}`);
      console.log(`    ${chalk.gray(envConfig.description[envVar])}`);
    }
    console.log();
  }

  if (missing.length > 0) {
    console.log(chalk.red('❌ Missing required environment variables:'));
    for (const envVar of missing) {
      console.log(`  ${chalk.cyan(envVar)}`);
      console.log(`    ${chalk.gray(envConfig.description[envVar])}`);
    }
    console.log();
  }

  // Check optional variables
  const optionalPresent = envConfig.optional.filter(envVar => process.env[envVar]);
  if (optionalPresent.length > 0) {
    console.log(chalk.yellow('⚠️  Optional environment variables:'));
    for (const envVar of optionalPresent) {
      console.log(`  ${chalk.cyan(envVar)}: ${process.env[envVar]}`);
    }
    console.log();
  }

  // Final result
  if (isValid) {
    console.log(chalk.green('🎉 All required environment variables are configured!'));
    return true;
  } else {
    console.log(chalk.red('❌ Environment configuration incomplete.'));
    console.log(chalk.yellow('\nTo fix this:'));
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in the missing values');
    console.log('3. Run this script again');
    return false;
  }
}

if (require.main === module) {
  const isValid = checkEnvironment();
  process.exit(isValid ? 0 : 1);
}

export default checkEnvironment;
```

#### Backend Environment Setup
```bash
#!/bin/bash
# scripts/setup-backend-env.sh - Backend environment setup

echo "🔧 Setting up backend environment..."

# Create application properties if not exists
if [ ! -f "src/main/resources/application-local.properties" ]; then
    echo "📝 Creating local application properties..."
    cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
fi

# Check for required environment variables
required_vars=(
    "SPRING_AI_OPENAI_API_KEY"
    "AMADEUS_API_KEY" 
    "AMADEUS_API_SECRET"
    "GOOGLE_API_KEY"
    "JWT_SECRET"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please set these variables in your environment or .env file."
    exit 1
else
    echo "✅ All required environment variables are set!"
fi

# Start MongoDB if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Starting MongoDB with Docker..."
    docker-compose up -d mongodb
    echo "✅ MongoDB started on port 27017"
else
    echo "⚠️  Docker not found. Please start MongoDB manually."
fi

echo "🎉 Backend environment setup complete!"
```

### CI/CD Configuration

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml - Continuous Integration
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  # Frontend Tests
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./AITravelPlannerFrontendNextjs
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'pnpm'
        cache-dependency-path: './AITravelPlannerFrontendNextjs/pnpm-lock.yaml'
    
    - name: Install pnpm
      run: npm install -g pnpm
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Check environment
      run: pnpm run check-env
      env:
        NEXT_PUBLIC_API_URL: http://localhost:8080
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
    
    - name: Run tests
      run: pnpm run test:ci
      env:
        NEXT_PUBLIC_API_URL: http://localhost:8080
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
    
    - name: Build application
      run: pnpm run build
      env:
        NEXT_PUBLIC_API_URL: http://localhost:8080
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
        NEXT_PUBLIC_APP_VERSION: ${{ github.sha }}
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./AITravelPlannerFrontendNextjs/coverage/lcov.info

  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./AITravelPlannerBackEnd
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand({ping:1})'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Java
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Cache Maven dependencies
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2
    
    - name: Run unit tests
      run: ./mvnw clean test
      env:
        SPRING_PROFILES_ACTIVE: test
        MONGODB_URI: mongodb://localhost:27017/flomad-test-db
    
    - name: Run integration tests
      run: ./mvnw clean verify
      env:
        SPRING_PROFILES_ACTIVE: test
        MONGODB_URI: mongodb://localhost:27017/flomad-test-db
        SPRING_AI_OPENAI_API_KEY: ${{ secrets.SPRING_AI_OPENAI_API_KEY }}
        JWT_SECRET: test-jwt-secret-key
    
    - name: Build application
      run: ./mvnw clean package -DskipTests
    
    - name: Upload JAR artifact
      uses: actions/upload-artifact@v3
      with:
        name: backend-jar
        path: ./AITravelPlannerBackEnd/target/*.jar

  # Security Scanning
  security-scan:
    runs-on: ubuntu-latest
    needs: [frontend-test, backend-test]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run frontend security audit
      run: |
        cd AITravelPlannerFrontendNextjs
        npm audit --audit-level=moderate
    
    - name: Run backend security scan
      run: |
        cd AITravelPlannerBackEnd
        ./mvnw org.owasp:dependency-check-maven:check

  # Docker Build
  docker-build:
    runs-on: ubuntu-latest
    needs: [frontend-test, backend-test, security-scan]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to DockerHub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push frontend
      uses: docker/build-push-action@v5
      with:
        context: ./AITravelPlannerFrontendNextjs
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/ai-travel-planner-frontend:latest
        build-args: |
          NEXT_PUBLIC_API_URL=${{ secrets.PROD_API_URL }}
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${{ secrets.GOOGLE_MAPS_API_KEY }}
          NEXT_PUBLIC_APP_VERSION=${{ github.sha }}
    
    - name: Build and push backend
      uses: docker/build-push-action@v5
      with:
        context: ./AITravelPlannerBackEnd
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/ai-travel-planner-backend:latest
```

### Nginx Configuration

```nginx
# config/nginx.conf - Production reverse proxy
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:8080;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=5r/s;
    
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        
        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;
        
        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Handle Next.js hot reloading in development
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }
        
        # Backend API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers for API requests
            add_header Access-Control-Allow-Origin "$http_origin" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials true always;
            
            if ($request_method = OPTIONS) {
                return 204;
            }
        }
        
        # WebSocket routes
        location /ws {
            limit_req zone=websocket burst=10 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket timeout settings
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Health checks
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://frontend;
        }
    }
}
```

### Deployment Scripts

#### Production Deployment Script
```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

echo "🚀 Starting production deployment..."

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | xargs)
fi

# Validate required variables
required_vars=(
    "SPRING_AI_OPENAI_API_KEY"
    "MONGODB_URI"
    "JWT_SECRET"
    "GOOGLE_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

# Build and deploy services
echo "📦 Building services..."
docker-compose -f docker-compose.prod.yml build

echo "🔄 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

echo "🏃 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🏥 Running health checks..."
backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health)
frontend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$backend_health" -eq 200 ] && [ "$frontend_health" -eq 200 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend: http://localhost:8080"
    echo "📊 Backend Health: http://localhost:8080/actuator/health"
else
    echo "❌ Deployment failed - health checks unsuccessful"
    echo "Backend health: $backend_health"
    echo "Frontend health: $frontend_health"
    exit 1
fi

echo "🎉 Production deployment complete!"
```

### Useful Links for Deployment

- [Next.js Deployment Guide](https://nextjs.org/docs/deployment) - Frontend deployment strategies
- [Spring Boot Production Deployment](https://spring.io/guides/gs/spring-boot-docker/) - Backend containerization
- [Docker Compose Production Guide](https://docs.docker.com/compose/production/) - Multi-container deployment
- [MongoDB Docker Setup](https://hub.docker.com/_/mongo) - Database containerization
- [Nginx Configuration Guide](https://nginx.org/en/docs/) - Reverse proxy setup
- [GitHub Actions Documentation](https://docs.github.com/en/actions) - CI/CD automation
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/) - Container optimization

---

## 11. Development Workflow

### Getting Started Guide

This comprehensive guide will get new developers up and running with the AI Travel Planner application in under 30 minutes.

#### Prerequisites
```bash
# Required Software
- Node.js 18+ (https://nodejs.org/)
- Java 17+ (https://adoptopenjdk.net/)
- Maven 3.6+ (https://maven.apache.org/)
- Docker & Docker Compose (https://docker.com/)
- MongoDB (https://mongodb.com/) or Docker
- Git (https://git-scm.com/)

# Recommended Tools
- VS Code (https://code.visualstudio.com/)
- Postman (https://postman.com/) for API testing
- MongoDB Compass (https://mongodb.com/compass) for database management
```

#### Quick Setup (5 Minutes)
```bash
# 1. Clone the repositories
git clone https://github.com/your-org/ai-travel-planner-frontend.git
git clone https://github.com/your-org/ai-travel-planner-backend.git

# 2. Setup frontend
cd AITravelPlannerFrontendNextjs
npm install -g pnpm
pnpm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your API keys

# Validate environment
pnpm run check-env

# 3. Setup backend
cd ../AITravelPlannerBackEnd
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
# Edit application-local.properties with your configurations

# 4. Start services with Docker
docker-compose up -d mongodb elasticsearch

# 5. Start backend
./mvnw spring-boot:run

# 6. Start frontend (in new terminal)
cd ../AITravelPlannerFrontendNextjs
pnpm dev
```

### Development Environment Setup

#### Complete Environment Configuration

##### Frontend Setup (`AITravelPlannerFrontendNextjs`)
```bash
# Install package manager
npm install -g pnpm

# Install dependencies
pnpm install

# Environment setup
cp .env.example .env.local

# Configure .env.local
cat << EOF > .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_APP_VERSION=development
EOF

# Validate configuration
pnpm run check-env

# Start development server
pnpm dev

# Available at: http://localhost:3000
```

##### Backend Setup (`AITravelPlannerBackEnd`)
```bash
# Create local configuration
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties

# Configure application-local.properties
cat << EOF > src/main/resources/application-local.properties
# Server
server.port=8080
spring.profiles.active=local

# Database
spring.data.mongodb.uri=mongodb://localhost:27017/flomad-local-db
spring.data.mongodb.database=flomad-local-db

# AI Configuration
spring.ai.openai.api-key=${SPRING_AI_OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-3.5-turbo

# External APIs
amadeus.api.key=${AMADEUS_API_KEY}
amadeus.api.secret=${AMADEUS_API_SECRET}
google.api.key=${GOOGLE_API_KEY}
viator.api.key=${VIATOR_API_KEY}

# Security
jwt.secret=${JWT_SECRET}
cors.allowed-origins=http://localhost:3000

# Development settings
logging.level.com.springboot.FlomadAIplanner=DEBUG
spring.jpa.show-sql=true
EOF

# Set environment variables
export SPRING_AI_OPENAI_API_KEY="your_openai_api_key"
export AMADEUS_API_KEY="your_amadeus_key"
export AMADEUS_API_SECRET="your_amadeus_secret"
export GOOGLE_API_KEY="your_google_api_key"
export VIATOR_API_KEY="your_viator_key"
export JWT_SECRET="your_jwt_secret_key"

# Start application
./mvnw spring-boot:run

# Available at: http://localhost:8080
```

### Development Best Practices

#### Code Organization Standards

##### Frontend Project Structure
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── (auth)/            # Route groups for authentication
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   ├── features/          # Feature-specific components
│   │   ├── auth/          # Authentication components
│   │   ├── chat/          # Chat interface components
│   │   └── map/           # Map-related components
│   └── layout/            # Layout components (Header, Footer, etc.)
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # Authentication context
│   └── WebSocketContext.tsx # WebSocket context
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── api.ts            # API client configuration
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # General utilities
├── services/              # External service integrations
│   ├── MapService.ts      # Map service integration
│   └── LocationService.ts # Location management
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

##### Backend Project Structure
```
src/main/java/com/springboot/FlomadAIplanner/
├── ai/                    # AI and function calling
│   ├── functions/         # OpenAI function implementations
│   ├── config/           # AI configuration
│   └── services/         # AI-related services
├── controller/           # REST API controllers
├── service/              # Business logic services
├── model/               # Entity models (MongoDB documents)
├── repository/          # Data access layer
├── dto/                 # Data Transfer Objects
├── config/              # Spring configuration classes
├── security/            # Security configuration
├── websocket/           # WebSocket configuration and handlers
└── utils/               # Utility classes
```

#### Coding Standards

##### TypeScript/React Standards
```typescript
// Component naming: PascalCase
export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  // Hook usage at top of component
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser } = useAuth();
  
  // Event handlers: handleActionName
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  // Early returns for loading/error states
  if (!user) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="user-profile">
      {/* JSX content */}
    </div>
  );
};

// Props interface: ComponentNameProps
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

// Custom hooks: useFeatureName
export const useUserProfile = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Implementation
  
  return { user, loading, updateUser };
};
```

##### Java/Spring Boot Standards
```java
// Service layer pattern
@Service
@Transactional
@Slf4j
public class LocationService {
    
    private final LocationRepository locationRepository;
    private final WebSocketService webSocketService;
    
    // Constructor injection (preferred)
    public LocationService(LocationRepository locationRepository, 
                          WebSocketService webSocketService) {
        this.locationRepository = locationRepository;
        this.webSocketService = webSocketService;
    }
    
    // Public API methods with clear contracts
    public Location saveLocation(Location location, String sessionId) {
        validateLocation(location);
        
        Location savedLocation = locationRepository.save(location);
        webSocketService.broadcastLocationAdded(sessionId, savedLocation);
        
        log.info("Location saved: {} for session: {}", savedLocation.getName(), sessionId);
        return savedLocation;
    }
    
    // Private helper methods
    private void validateLocation(Location location) {
        if (location == null || location.getName() == null) {
            throw new IllegalArgumentException("Location and name cannot be null");
        }
    }
}

// AI Function pattern
@Component
@Description("Searches for flights between cities using natural language")
public class FlightSearchFunction implements Function<FlightRequest, FlightResponse> {
    
    private final FlightService flightService;
    
    @Override
    public FlightResponse apply(FlightRequest request) {
        log.debug("Flight search request: {}", request);
        
        try {
            return flightService.searchFlights(request);
        } catch (Exception e) {
            log.error("Flight search failed", e);
            return FlightResponse.error("Sorry, I couldn't search for flights right now.");
        }
    }
}
```

#### Git Workflow

##### Branch Strategy
```bash
# Branch naming convention
feature/add-user-authentication
bugfix/fix-websocket-connection  
hotfix/security-patch
chore/update-dependencies

# Feature development workflow
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "feat: add user authentication with JWT"

# Push and create PR
git push origin feature/new-feature-name
# Create Pull Request to develop branch
```

##### Commit Message Standards
```bash
# Format: type(scope): description
# Types: feat, fix, docs, style, refactor, test, chore

# Examples
feat(auth): add JWT token authentication
fix(websocket): resolve connection timeout issues
docs(api): update authentication endpoint documentation
style(components): fix linting issues in UserProfile
refactor(services): extract location validation logic
test(api): add integration tests for location endpoints
chore(deps): update Spring Boot to 3.4.0
```

### Development Scripts and Tools

#### Frontend Development Scripts
```json
// package.json scripts for development
{
  "scripts": {
    // Development
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    
    // Building
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    
    // Testing
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:map": "jest \"src/(services|components/features/map)/__tests__/\"",
    "test:ci": "jest --ci --coverage --watchAll=false",
    
    // Code Quality
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    
    // Environment
    "check-env": "tsx scripts/checkEnv.ts",
    "clear-tokens": "node scripts/clearTokens.js",
    
    // Utilities
    "clean": "rm -rf .next out dist coverage",
    "reset": "npm run clean && rm -rf node_modules && pnpm install"
  }
}
```

#### Backend Development Scripts (Maven)
```bash
# Development commands
./mvnw spring-boot:run                    # Start development server
./mvnw spring-boot:run -Dspring-boot.run.profiles=local  # With specific profile

# Testing
./mvnw test                               # Run unit tests
./mvnw verify                             # Run integration tests
./mvnw test -Dtest=LocationServiceTest    # Run specific test
./mvnw jacoco:report                      # Generate coverage report

# Building
./mvnw clean compile                      # Compile sources
./mvnw clean package                      # Build JAR
./mvnw clean package -DskipTests          # Build without tests

# Code Quality
./mvnw spotless:check                     # Check code formatting
./mvnw spotless:apply                     # Fix code formatting
./mvnw dependency:analyze                 # Analyze dependencies

# Database
./mvnw mongock:update                     # Run database migrations
./mvnw mongock:rollback                   # Rollback last migration
```

### IDE Configuration

#### VS Code Settings
```json
// .vscode/settings.json - Recommended VS Code settings
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.compile.nullAnalysis.mode": "automatic",
  "spring-boot.ls.problem.application-properties.enable": true
}
```

#### Recommended Extensions
```json
// .vscode/extensions.json - Recommended VS Code extensions
{
  "recommendations": [
    // Frontend
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    
    // Backend
    "redhat.java",
    "vscjava.vscode-java-pack",
    "pivotal.vscode-spring-boot",
    "vmware.vscode-spring-boot-dashboard",
    
    // Database
    "mongodb.mongodb-vscode",
    
    // General
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "github.copilot"
  ]
}
```

### Debugging Guide

#### Frontend Debugging
```typescript
// Debug configuration for Next.js
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}

// Debugging WebSocket connections
const debugWebSocket = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('WebSocket State:', {
      connected: client?.connected,
      sessionId,
      token: token ? 'present' : 'missing'
    });
  }
};

// React DevTools debugging
const DebugInfo: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-0 right-0 bg-gray-900 text-white p-2 text-xs">
      <div>Session: {sessionId}</div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>Locations: {locations.length}</div>
    </div>
  );
};
```

#### Backend Debugging
```java
// Debug configuration for Spring Boot
// .vscode/launch.json
{
  "type": "java",
  "name": "Debug Spring Boot",
  "request": "launch",
  "mainClass": "com.springboot.FlomadAIplanner.FlomadAiPlannerApplication",
  "projectName": "FlomadAIplanner",
  "args": "--spring.profiles.active=local",
  "vmArgs": "-Dspring.output.ansi.enabled=always"
}

// Logging configuration for debugging
@Slf4j
@Component
public class DebugInterceptor implements WebSocketInterceptor {
    
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, 
                                 ServerHttpResponse response,
                                 WebSocketHandler wsHandler, 
                                 Map<String, Object> attributes) {
        
        if (log.isDebugEnabled()) {
            log.debug("WebSocket handshake: URI={}, Headers={}", 
                     request.getURI(), request.getHeaders());
        }
        
        return true;
    }
}

// AI Function debugging
@Component
public class AddLocationFunction implements Function<AddLocationRequest, String> {
    
    @Override
    public String apply(AddLocationRequest request) {
        log.debug("AI Function called: AddLocation with request: {}", request);
        
        try {
            Location result = locationService.save(buildLocation(request));
            log.debug("Location saved successfully: {}", result);
            return "Added " + result.getName() + " to your travel map!";
        } catch (Exception e) {
            log.error("Failed to add location: {}", request, e);
            return "Sorry, I couldn't add that location. Please try again.";
        }
    }
}
```

### Performance Monitoring

#### Frontend Performance
```typescript
// Performance monitoring setup
// src/lib/performance.ts
export const performanceMonitor = {
  // Track component render times
  measureComponentRender: (componentName: string, renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered in ${end - start}ms`);
    }
  },
  
  // Track API call performance
  measureApiCall: async <T>(apiName: string, apiCall: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      
      console.log(`API ${apiName} completed in ${end - start}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`API ${apiName} failed after ${end - start}ms:`, error);
      throw error;
    }
  }
};

// Web Vitals monitoring
// src/lib/vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}
```

#### Backend Performance
```java
// Performance monitoring aspect
@Aspect
@Component
@Slf4j
public class PerformanceMonitoringAspect {
    
    @Around("@annotation(org.springframework.web.bind.annotation.RequestMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.GetMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PostMapping)")
    public Object monitorApiPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            log.info("API {} executed in {}ms", methodName, executionTime);
            
            if (executionTime > 1000) {
                log.warn("Slow API detected: {} took {}ms", methodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("API {} failed after {}ms", methodName, executionTime, e);
            throw e;
        }
    }
}

// Database query monitoring
@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {
    
    @Override
    public MongoClient mongoClient() {
        MongoClientSettings.Builder builder = MongoClientSettings.builder()
            .applyConnectionString(new ConnectionString(mongoUri));
            
        // Add command monitoring for debugging
        if (log.isDebugEnabled()) {
            builder.addCommandListener(new CommandListener() {
                @Override
                public void commandStarted(CommandStartedEvent event) {
                    log.debug("MongoDB command started: {}", event.getCommand().toJson());
                }
                
                @Override
                public void commandSucceeded(CommandSucceededEvent event) {
                    log.debug("MongoDB command succeeded in {}ms", 
                             event.getElapsedTime(TimeUnit.MILLISECONDS));
                }
            });
        }
        
        return MongoClients.create(builder.build());
    }
}
```

### Useful Links for Development

- [Next.js Documentation](https://nextjs.org/docs) - Frontend framework
- [Spring Boot Reference](https://spring.io/projects/spring-boot) - Backend framework
- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/) - AI integration
- [MongoDB Documentation](https://docs.mongodb.com/) - Database
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Frontend testing
- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/) - Backend testing
- [Docker Documentation](https://docs.docker.com/) - Containerization
- [VS Code Java Extensions](https://code.visualstudio.com/docs/languages/java) - IDE setup

---

## 12. Troubleshooting Guide

### Common Issues and Solutions

This section provides solutions for the most frequently encountered issues during development, deployment, and runtime.

#### Frontend Issues

##### Issue: Google Maps Not Loading
```
🔍 Symptoms:
- Blank map area
- Console errors: "Google Maps JavaScript API error"
- "InvalidKeyMapError" or "RefererNotAllowedMapError"

✅ Solutions:
1. Verify API key is correctly set:
   ```bash
   echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   ```

2. Check Google Cloud Console API restrictions:
   - Enable Maps JavaScript API, Places API, Geocoding API
   - Configure API key restrictions for your domain
   - Verify billing is enabled

3. Clear browser cache and restart development server:
   ```bash
   pnpm run clean
   pnpm install
   pnpm dev
   ```

4. Test with curl to verify API key:
   ```bash
   curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"
   ```
```

##### Issue: WebSocket Connection Failed
```
🔍 Symptoms:
- "WebSocket connection failed" errors
- Real-time map updates not working
- Console shows STOMP connection errors

✅ Solutions:
1. Verify backend WebSocket endpoint:
   ```bash
   curl -I http://localhost:8080/ws
   # Should return 101 Switching Protocols
   ```

2. Check CORS configuration in backend:
   ```java
   // WebSocketConfig.java
   @Override
   public void registerStompEndpoints(StompEndpointRegistry registry) {
       registry.addEndpoint("/ws")
           .setAllowedOrigins("http://localhost:3000")
           .withSockJS();
   }
   ```

3. Verify JWT token in request headers:
   ```typescript
   // Check in browser DevTools > Network > WS
   // Should see Authorization: Bearer <token>
   ```

4. Test WebSocket connection manually:
   ```javascript
   const socket = new WebSocket('ws://localhost:8080/ws');
   socket.onopen = () => console.log('Connected');
   socket.onerror = (error) => console.error('WebSocket error:', error);
   ```
```

##### Issue: Authentication Token Expired
```
🔍 Symptoms:
- 401 Unauthorized errors
- User suddenly logged out
- API calls failing intermittently

✅ Solutions:
1. Check token expiration:
   ```typescript
   const token = localStorage.getItem('token');
   if (token) {
     const payload = JSON.parse(atob(token.split('.')[1]));
     const expiry = new Date(payload.exp * 1000);
     console.log('Token expires:', expiry);
   }
   ```

2. Implement token refresh:
   ```typescript
   // In api.ts
   axios.interceptors.response.use(
     (response) => response,
     async (error) => {
       if (error.response?.status === 401) {
         // Try to refresh token or redirect to login
         const newToken = await refreshToken();
         if (newToken) {
           error.config.headers.Authorization = `Bearer ${newToken}`;
           return axios.request(error.config);
         }
       }
       return Promise.reject(error);
     }
   );
   ```

3. Clear stored tokens and restart:
   ```bash
   pnpm run clear-tokens
   ```
```

##### Issue: Build Failures
```
🔍 Symptoms:
- "Module not found" errors during build
- TypeScript compilation errors
- Out of memory errors

✅ Solutions:
1. Check for missing dependencies:
   ```bash
   pnpm install
   pnpm run type-check
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm run build
   ```

3. Increase Node.js memory for large builds:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm run build
   ```

4. Check for circular dependencies:
   ```bash
   npx madge --circular --extensions ts,tsx src/
   ```
```

#### Backend Issues

##### Issue: MongoDB Connection Failed
```
🔍 Symptoms:
- "MongoSocketOpenException" errors
- Application fails to start
- Database operations timing out

✅ Solutions:
1. Verify MongoDB is running:
   ```bash
   # Docker
   docker ps | grep mongo
   
   # Local installation
   mongosh --eval "db.runCommand({ping:1})"
   ```

2. Check connection string format:
   ```properties
   # application-local.properties
   spring.data.mongodb.uri=mongodb://localhost:27017/flomad-local-db
   # NOT: mongodb://localhost:27017/flomad-local-db/
   ```

3. Test connection manually:
   ```bash
   mongosh "mongodb://localhost:27017/flomad-local-db"
   ```

4. Start MongoDB with Docker:
   ```bash
   docker-compose up -d mongodb
   # Or
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

5. Check for port conflicts:
   ```bash
   lsof -i :27017
   netstat -tulpn | grep 27017
   ```
```

##### Issue: OpenAI API Integration Failure
```
🔍 Symptoms:
- "Invalid API key" errors
- AI functions not responding
- Rate limit exceeded errors

✅ Solutions:
1. Verify OpenAI API key:
   ```bash
   curl -H "Authorization: Bearer $SPRING_AI_OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

2. Check Spring AI configuration:
   ```properties
   # application.properties
   spring.ai.openai.api-key=${SPRING_AI_OPENAI_API_KEY}
   spring.ai.openai.chat.model=gpt-3.5-turbo
   logging.level.org.springframework.ai=DEBUG
   ```

3. Handle rate limiting:
   ```java
   @Component
   public class OpenAIErrorHandler {
       @EventListener
       public void handleApiError(OpenAIApiException e) {
           if (e.getStatusCode() == 429) {
               log.warn("Rate limit exceeded, implementing backoff");
               // Implement exponential backoff
           }
       }
   }
   ```

4. Test AI function registration:
   ```bash
   # Check logs for function registration
   grep "Registering function" logs/application.log
   ```
```

##### Issue: Spring Boot Startup Failures
```
🔍 Symptoms:
- Application fails to start
- "Port already in use" errors
- Bean creation failures

✅ Solutions:
1. Check port availability:
   ```bash
   lsof -i :8080
   # Kill process if needed
   kill -9 $(lsof -t -i:8080)
   ```

2. Verify Java version:
   ```bash
   java -version  # Should be 17+
   ./mvnw --version
   ```

3. Clean and rebuild:
   ```bash
   ./mvnw clean compile
   ./mvnw dependency:resolve
   ```

4. Check for configuration conflicts:
   ```bash
   # Validate properties file syntax
   ./mvnw spring-boot:run -Dspring-boot.run.arguments=--debug
   ```

5. Review application logs:
   ```bash
   tail -f logs/spring.log
   # Look for ERROR and WARN messages
   ```
```

#### Integration Issues

##### Issue: CORS Policy Violations
```
🔍 Symptoms:
- "Access-Control-Allow-Origin" errors
- API calls blocked in browser
- Preflight OPTIONS requests failing

✅ Solutions:
1. Configure CORS in Spring Boot:
   ```java
   @Configuration
   public class CorsConfig {
       @Bean
       public CorsConfigurationSource corsConfigurationSource() {
           CorsConfiguration configuration = new CorsConfiguration();
           configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
           configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
           configuration.setAllowedHeaders(Arrays.asList("*"));
           configuration.setAllowCredentials(true);
           
           UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
           source.registerCorsConfiguration("/**", configuration);
           return source;
       }
   }
   ```

2. Test CORS configuration:
   ```bash
   curl -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Authorization, Content-Type" \
        -X OPTIONS \
        http://localhost:8080/api/locations
   ```

3. Check Nginx configuration (production):
   ```nginx
   # Add to nginx.conf
   add_header Access-Control-Allow-Origin "$http_origin" always;
   add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
   add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
   ```
```

##### Issue: JWT Token Validation Failures
```
🔍 Symptoms:
- "Invalid JWT signature" errors
- Authentication working locally but not in production
- Token validation intermittently failing

✅ Solutions:
1. Verify JWT secret consistency:
   ```bash
   # Check that JWT_SECRET is same across environments
   echo $JWT_SECRET | base64
   ```

2. Check token format:
   ```typescript
   // Decode JWT to inspect claims
   const token = "your.jwt.token";
   const [header, payload, signature] = token.split('.');
   console.log(JSON.parse(atob(header)));
   console.log(JSON.parse(atob(payload)));
   ```

3. Debug JWT validation:
   ```java
   @Component
   public class JwtDebugger {
       @EventListener
       public void handleJwtError(JwtException e) {
           log.error("JWT validation failed: {}", e.getMessage());
           log.debug("Token details: {}", e);
       }
   }
   ```

4. Test JWT creation and validation:
   ```java
   @Test
   public void testJwtTokenFlow() {
       String token = jwtTokenUtil.generateToken("testuser");
       assertTrue(jwtTokenUtil.validateToken(token, "testuser"));
   }
   ```
```

### Performance Issues

##### Issue: Slow Map Rendering
```
🔍 Symptoms:
- Map takes long time to load
- Markers appear slowly
- Browser becomes unresponsive

✅ Solutions:
1. Implement marker clustering:
   ```typescript
   import { MarkerClusterer } from "@googlemaps/markerclusterer";
   
   const clusterer = new MarkerClusterer({
     map,
     markers,
     gridSize: 60,
     maxZoom: 15
   });
   ```

2. Use marker pooling for large datasets:
   ```typescript
   class MarkerPool {
     private pool: google.maps.Marker[] = [];
     
     getMarker(): google.maps.Marker {
       return this.pool.pop() || new google.maps.Marker();
     }
     
     releaseMarker(marker: google.maps.Marker) {
       marker.setMap(null);
       this.pool.push(marker);
     }
   }
   ```

3. Optimize component re-renders:
   ```typescript
   const MapComponent = React.memo(({ locations, onLocationClick }) => {
     // Component implementation
   }, (prevProps, nextProps) => {
     return prevProps.locations.length === nextProps.locations.length;
   });
   ```

4. Lazy load map components:
   ```typescript
   const MapPanel = dynamic(() => import('./MapPanel'), {
     loading: () => <MapSkeleton />,
     ssr: false
   });
   ```
```

##### Issue: High Memory Usage
```
🔍 Symptoms:
- Application becomes slow over time
- OutOfMemoryError in Java
- Browser tab crashes

✅ Solutions:
1. Monitor memory usage:
   ```bash
   # Frontend
   chrome://memory-internals/
   
   # Backend
   jcmd <pid> VM.classloader_stats
   jcmd <pid> GC.run_finalization
   ```

2. Implement proper cleanup:
   ```typescript
   useEffect(() => {
     const client = new Client(/* config */);
     
     return () => {
       // Cleanup WebSocket connections
       if (client.connected) {
         client.deactivate();
       }
     };
   }, []);
   ```

3. Configure JVM heap size:
   ```bash
   java -Xms512m -Xmx2g -jar app.jar
   ```

4. Use memory profiling tools:
   ```bash
   # Java heap dump
   jcmd <pid> GC.dump_heap /tmp/heap.hprof
   
   # Analyze with Eclipse MAT or VisualVM
   ```
```

### Database Issues

##### Issue: MongoDB Query Performance
```
🔍 Symptoms:
- Slow database queries
- High CPU usage on MongoDB
- Timeout errors

✅ Solutions:
1. Add proper indexes:
   ```javascript
   // MongoDB shell
   db.locations.createIndex({ "sessionId": 1, "createdAt": -1 })
   db.locations.createIndex({ "coordinates": "2dsphere" })
   db.users.createIndex({ "email": 1 }, { unique: true })
   ```

2. Analyze query performance:
   ```javascript
   db.locations.find({ sessionId: "123" }).explain("executionStats")
   ```

3. Use Spring Data projections:
   ```java
   public interface LocationSummary {
       String getName();
       Double getLatitude();
       Double getLongitude();
   }
   
   List<LocationSummary> findBySessionId(String sessionId);
   ```

4. Implement query result caching:
   ```java
   @Cacheable(value = "locations", key = "#sessionId")
   public List<Location> getLocationsBySession(String sessionId) {
       return locationRepository.findBySessionId(sessionId);
   }
   ```
```

### Deployment Issues

##### Issue: Docker Build Failures
```
🔍 Symptoms:
- "No space left on device" errors
- Layer caching issues
- Long build times

✅ Solutions:
1. Clean Docker system:
   ```bash
   docker system prune -af
   docker builder prune
   ```

2. Optimize Dockerfile layers:
   ```dockerfile
   # Bad: Invalidates cache on every change
   COPY . .
   RUN npm install
   
   # Good: Cache dependencies separately
   COPY package*.json ./
   RUN npm install
   COPY . .
   ```

3. Use multi-stage builds:
   ```dockerfile
   FROM node:18-alpine AS deps
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM node:18-alpine AS runner
   COPY --from=deps /app/node_modules ./node_modules
   ```

4. Check available disk space:
   ```bash
   df -h
   docker system df
   ```
```

##### Issue: Production Environment Variables
```
🔍 Symptoms:
- Application works locally but fails in production
- "Environment variable not found" errors
- Configuration mismatch

✅ Solutions:
1. Validate environment variables:
   ```bash
   # Create validation script
   #!/bin/bash
   required_vars=("SPRING_AI_OPENAI_API_KEY" "MONGODB_URI" "JWT_SECRET")
   
   for var in "${required_vars[@]}"; do
     if [ -z "${!var}" ]; then
       echo "Missing: $var"
       exit 1
     fi
   done
   ```

2. Use Docker secrets for sensitive data:
   ```yaml
   # docker-compose.yml
   services:
     backend:
       environment:
         - JWT_SECRET_FILE=/run/secrets/jwt_secret
       secrets:
         - jwt_secret
   
   secrets:
     jwt_secret:
       external: true
   ```

3. Test configuration loading:
   ```java
   @EventListener
   public void onApplicationReady(ApplicationReadyEvent event) {
       log.info("Active profiles: {}", 
               Arrays.toString(environment.getActiveProfiles()));
       log.info("MongoDB URI configured: {}", 
               environment.getProperty("spring.data.mongodb.uri") != null);
   }
   ```
```

### Monitoring and Debugging Tools

#### Frontend Debugging Tools
```typescript
// Development debugging utilities
// src/utils/debug.ts
export const debugTools = {
  // Log component props changes
  logPropsChanges: (componentName: string, prevProps: any, nextProps: any) => {
    if (process.env.NODE_ENV === 'development') {
      const changes = Object.keys(nextProps).filter(key => 
        prevProps[key] !== nextProps[key]
      );
      if (changes.length > 0) {
        console.log(`${componentName} props changed:`, changes);
      }
    }
  },
  
  // Monitor WebSocket events
  monitorWebSocket: (client: Client) => {
    if (process.env.NODE_ENV === 'development') {
      client.debug = (str) => console.log('STOMP Debug:', str);
      
      const originalOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        console.log('WebSocket Connected:', frame);
        originalOnConnect?.(frame);
      };
      
      const originalOnDisconnect = client.onDisconnect;
      client.onDisconnect = (frame) => {
        console.log('WebSocket Disconnected:', frame);
        originalOnDisconnect?.(frame);
      };
    }
  }
};
```

#### Backend Debugging Configuration
```properties
# application-debug.properties
# Enable debug logging for key packages
logging.level.com.springboot.FlomadAIplanner=DEBUG
logging.level.org.springframework.ai=DEBUG
logging.level.org.springframework.web.socket=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.springframework.data.mongodb=DEBUG

# SQL/MongoDB query logging
spring.data.mongodb.repositories.enabled=true
logging.level.org.springframework.data.mongodb.core.MongoTemplate=DEBUG

# WebSocket debugging
logging.level.org.springframework.web.socket.config=DEBUG
logging.level.org.springframework.messaging=DEBUG

# HTTP request/response logging
logging.level.org.springframework.web.servlet.DispatcherServlet=DEBUG
logging.level.org.apache.http.wire=DEBUG

# AI function call debugging
spring.ai.openai.chat.options.stream=false
spring.ai.openai.chat.options.temperature=0.1
```

### Health Checks and Monitoring

#### Application Health Endpoints
```java
// Custom health indicators
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    private final LocationRepository locationRepository;
    
    @Override
    public Health health() {
        try {
            long count = locationRepository.count();
            return Health.up()
                .withDetail("database", "MongoDB")
                .withDetail("location_count", count)
                .withDetail("timestamp", Instant.now())
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("database", "MongoDB")
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}

@Component  
public class OpenAIHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            // Test OpenAI API connectivity
            String response = openAIService.testConnection();
            return Health.up()
                .withDetail("openai", "Connected")
                .withDetail("model", "gpt-3.5-turbo")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("openai", "Disconnected")
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

### Emergency Procedures

#### Production Incident Response
```bash
#!/bin/bash
# scripts/emergency-restart.sh

echo "🚨 Emergency restart procedure initiated"

# 1. Stop services gracefully
echo "Stopping services..."
docker-compose -f docker-compose.prod.yml down

# 2. Check for resource issues
echo "Checking system resources..."
df -h
free -h
docker system df

# 3. Clean up if needed
if [ "$1" == "clean" ]; then
    echo "Cleaning Docker resources..."
    docker system prune -f
fi

# 4. Restart services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# 5. Wait and verify
echo "Waiting for services to start..."
sleep 30

# 6. Health checks
echo "Running health checks..."
curl -f http://localhost:8080/actuator/health || echo "❌ Backend unhealthy"
curl -f http://localhost:3000/api/health || echo "❌ Frontend unhealthy"

echo "✅ Emergency restart completed"
```

#### Rollback Procedure
```bash
#!/bin/bash
# scripts/rollback.sh

# Get previous version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# 1. Checkout previous version
git checkout $PREVIOUS_VERSION

# 2. Rebuild and redeploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify rollback
sleep 30
curl -f http://localhost:8080/actuator/health

echo "✅ Rollback completed to $PREVIOUS_VERSION"
```

### Useful Links for Troubleshooting

- [Next.js Debugging Guide](https://nextjs.org/docs/advanced-features/debugging) - Frontend debugging
- [Spring Boot Troubleshooting](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html) - Backend issues
- [MongoDB Troubleshooting](https://docs.mongodb.com/manual/faq/diagnostics/) - Database problems
- [Docker Debugging Guide](https://docs.docker.com/config/containers/logging/) - Container issues
- [Google Maps API Troubleshooting](https://developers.google.com/maps/documentation/javascript/error-messages) - Map integration
- [OpenAI API Error Codes](https://platform.openai.com/docs/guides/error-codes) - AI integration issues
- [WebSocket Debugging](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time communication

---

## Conclusion

This comprehensive onboarding guide provides new team members with everything needed to understand, develop, and maintain the AI Travel Planner application. The system represents a sophisticated integration of modern web technologies, AI capabilities, and real-time communication features.

### Key Takeaways

1. **Architecture**: The application follows a clean separation between frontend (Next.js) and backend (Spring Boot) with well-defined APIs and real-time WebSocket communication.

2. **AI Integration**: Spring AI framework enables seamless integration with OpenAI's GPT models through function calling, providing natural language interaction for travel planning.

3. **Real-time Features**: WebSocket implementation using STOMP enables live collaboration and map synchronization across multiple users.

4. **Security**: JWT-based authentication with OAuth2 integration provides secure access while supporting both authenticated users and guest sessions.

5. **Testing**: Comprehensive testing strategy covering unit tests, integration tests, and end-to-end scenarios ensures code quality and reliability.

6. **Deployment**: Docker-based containerization with CI/CD pipelines enables consistent deployments across environments.

### Getting Help

- 📚 **Documentation**: Refer to the `/Documentation` folder for detailed technical specifications
- 🐛 **Issues**: Check the troubleshooting section first, then create GitHub issues
- 💬 **Team Chat**: Join the development Slack channel for quick questions
- 🔄 **Code Reviews**: All changes require peer review through pull requests

### Contributing

1. Follow the established coding standards and patterns
2. Write comprehensive tests for new features
3. Update documentation for significant changes
4. Use the provided development tools and scripts
5. Participate in code reviews and knowledge sharing

Welcome to the AI Travel Planner development team! 🚀✈️
