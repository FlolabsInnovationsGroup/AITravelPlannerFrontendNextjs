# AI Travel Planner - Architecture Guide (Junior-Friendly)

**Date:** October 22, 2025  
**Version:** 2.0 (Beginner's Guide)  
**Target Audience:** Junior Developers  
**Purpose:** Understand how all the pieces fit together

---

## What This Document Does

This document explains **how all the parts of our system work together**. Think of it as a map of our application.

**You'll Learn:**
- How the system is organized
- How data flows through the system
- How different components talk to each other
- Why we made certain architectural decisions

---

## The 30-Second Overview

```
┌─────────────┐
│   Browser   │  ← User types here
└──────┬──────┘
       │
       │ (1) Send message via HTTPS
       ▼
┌─────────────┐
│   Next.js   │  ← Our frontend (Vercel)
│   Frontend  │
└──────┬──────┘
       │
       │ (2) API call: POST /api/chat/call
       ▼
┌─────────────┐
│ Spring Boot │  ← Our backend (AWS EC2)
│   Backend   │
└──────┬──────┘
       │
       ├──(3a)─> OpenAI API    ← Ask AI what to say
       │
       ├──(3b)─> Amadeus API   ← Search flights
       │
       ├──(3c)─> Google Maps   ← Search locations
       │
       └──(3d)─> MongoDB       ← Save everything
```

**In Plain English:**
1. User types in browser
2. Frontend sends to backend
3. Backend talks to AI and other services
4. Backend saves data
5. Response goes back to user

---

## System Architecture (Current State)

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                      │
│                      (What Users Interact With)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Homepage   │  │  Chat Page  │  │  Auth Pages │            │
│  │             │  │             │  │             │            │
│  │ - Hero      │  │ - Chat UI   │  │ - Sign In   │            │
│  │ - Features  │  │ - Map View  │  │ - Sign Up   │            │
│  │ - CTA       │  │ - History   │  │ - OAuth     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│         Hosted on: Vercel (Automatic Deployment)               │
│         Technology: Next.js 15 + React 18 + Tailwind          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS REST API
                             │ WebSocket (for map updates)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                        │
│                       (Business Logic)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Auth Service  │  │  Chat Service  │  │  Map Service   │   │
│  │                │  │                │  │                │   │
│  │ - Sign Up      │  │ - AI Calls     │  │ - Add Location │   │
│  │ - Sign In      │  │ - History      │  │ - WebSocket    │   │
│  │ - OAuth        │  │ - Function     │  │ - Broadcasting │   │
│  │ - JWT          │  │   Calling      │  │                │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                 │
│         Hosted on: AWS EC2 Ubuntu Server                       │
│         Technology: Spring Boot 3 + Java 17                    │
└─────────────────────────────────────────────────────────────────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                             │
│                    (Where Everything is Stored)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐         ┌──────────────────────┐      │
│  │  MongoDB Atlas      │         │  External APIs       │      │
│  │                     │         │                      │      │
│  │  Collections:       │         │  - OpenAI GPT        │      │
│  │  - users            │         │  - Amadeus Flights   │      │
│  │  - sessions         │         │  - Google Maps       │      │
│  │  - messages         │         │  - Viator Tours      │      │
│  │  - locations        │         │  - FreeCurrency      │      │
│  │  - destinations     │         │  - PositionStack     │      │
│  │                     │         │                      │      │
│  └─────────────────────┘         └──────────────────────┘      │
│                                                                 │
│         Hosted on: MongoDB Atlas Cloud                         │
│         Technology: MongoDB 6.0                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown (What Each Part Does)

### Frontend Components (Next.js)

#### 1. Page Components
**What They Are:** Top-level UI that represents full pages

**Examples:**
- `app/page.tsx` → Homepage (/)
- `app/chat/page.tsx` → Chat interface (/chat)
- `app/auth/signin/page.tsx` → Sign in page

**Responsibility:**
- Render page layout
- Load data
- Handle routing

---

#### 2. Feature Components
**What They Are:** Reusable components for specific features

**Examples:**
- `ChatPageContent.tsx` → Main chat interface
- `RightMapPanel.tsx` → Map with markers
- `SignIn.tsx` → Sign in form

**Responsibility:**
- Implement feature logic
- Manage local state
- Call API services

---

#### 3. UI Components
**What They Are:** Generic, reusable UI elements

**Examples:**
- `Button.tsx` → Styled button
- `Input.tsx` → Text input
- `Toast.tsx` → Notification popup

**Responsibility:**
- Provide consistent UI
- Accept props for customization
- No business logic

---

#### 4. Services
**What They Are:** Business logic that doesn't fit in components

**Examples:**
- `MapService.ts` → WebSocket connection, map logic
- `ChatHistoryService.ts` → Message loading/caching
- `api.ts` → API client

**Responsibility:**
- API calls
- Data transformation
- Complex logic

---

#### 5. Contexts
**What They Are:** Global state management

**Examples:**
- `AuthContext.tsx` → User authentication state

**Responsibility:**
- Share data across components
- Avoid prop drilling

---

### Backend Components (Spring Boot)

#### 1. Controllers
**What They Are:** Handle incoming HTTP requests

**File:** `ChatController.java`
```java
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @PostMapping("/call")
    public String handleChat(@RequestBody AIMessageDTO message) {
        return chatService.processMessage(message);
    }
}
```

**Responsibility:**
- Receive HTTP requests
- Validate input
- Call service layer
- Return response

---

#### 2. Services
**What They Are:** Contain business logic

**File:** `ChatCallService.java`
```java
@Service
public class ChatCallService {
    public String processMessage(AIMessageDTO message) {
        // 1. Call AI
        // 2. Handle function calls
        // 3. Save to database
        // 4. Return response
    }
}
```

**Responsibility:**
- Implement business rules
- Coordinate between repositories
- Handle complex operations

---

#### 3. Repositories
**What They Are:** Database access layer

**File:** `MessageRepository.java`
```java
@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findBySessionId(String sessionId);
}
```

**Responsibility:**
- CRUD operations (Create, Read, Update, Delete)
- Database queries
- Data persistence

---

#### 4. Entities (Models)
**What They Are:** Represent data structure

**File:** `Message.java`
```java
@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    private String sessionId;
    private String content;
    private MessageType messageType;
    private Date createdAt;
}
```

**Responsibility:**
- Define data structure
- Map to database collections
- Validation rules

---

#### 5. AI Functions
**What They Are:** Functions AI can call

**File:** `AddLocationFunction.java`
```java
@Component("addLocationFunction")
public class AddLocationFunction implements Function<LocationRequest, String> {
    @Override
    public String apply(LocationRequest request) {
        // Save location to database
        // Notify via WebSocket
        return "Location added!";
    }
}
```

**Responsibility:**
- Implement specific actions
- Called by AI automatically
- Return results to AI

---

## Data Flow Diagrams

### Flow 1: User Sends Chat Message

```
Step 1: User Types Message
┌─────────────┐
│  Browser    │
│             │
│  ┌────────┐ │
│  │ "Plan a│ │ ← User types
│  │ trip to│ │
│  │ Paris" │ │
│  └────────┘ │
└──────┬──────┘
       │
       │ onClick handleSend()
       ▼

Step 2: Frontend Sends to Backend
┌─────────────┐
│  Frontend   │
│  React      │
│             │
│  const data = {
│    message: "Plan a trip to Paris",
│    sessionId: "session123"
│  }
│             │
│  POST /api/chat/call
└──────┬──────┘
       │
       │ HTTP Request
       │ Content-Type: application/json
       │ Authorization: Bearer <token>
       ▼

Step 3: Backend Receives Request
┌─────────────┐
│  Spring     │
│  Controller │
│             │
│  @PostMapping("/call")
│  handleChat(message) {
│    return chatService
│           .processMessage(message);
│  }
└──────┬──────┘
       │
       │ Call service
       ▼

Step 4: Service Calls AI
┌─────────────┐
│  Chat       │
│  Service    │
│             │
│  1. Build AI prompt
│  2. Call OpenAI API
│  3. Get response
└──────┬──────┘
       │
       │ HTTP to OpenAI
       ▼
┌─────────────┐
│  OpenAI     │
│  GPT-3.5    │
│             │
│  Response:
│  "Paris is beautiful!
│   When do you want to go?"
└──────┬──────┘
       │
       │ Return AI response
       ▼

Step 5: Save to Database
┌─────────────┐
│  Message    │
│  Repository │
│             │
│  save(userMessage)
│  save(aiResponse)
└──────┬──────┘
       │
       │ MongoDB insert
       ▼
┌─────────────┐
│  MongoDB    │
│             │
│  messages collection
│  + new documents
└─────────────┘

Step 6: Return to Frontend
       │
       │ HTTP Response
       │ Status: 200 OK
       │ Body: { content: "Paris is beautiful!..." }
       ▼
┌─────────────┐
│  Frontend   │
│             │
│  setMessages([
│    ...messages,
│    aiResponse
│  ])
└──────┬──────┘
       │
       │ React re-renders
       ▼
┌─────────────┐
│  Browser    │
│             │
│  User sees:
│  🤖 Paris is beautiful!
│     When do you want to go?
└─────────────┘
```

---

### Flow 2: AI Adds Location to Map (With WebSocket)

```
Step 1: User Asks About Location
User: "Tell me about the Eiffel Tower"

       │ Message sent (same as Flow 1)
       ▼

Step 2: AI Decides to Add Location
┌─────────────────────┐
│  OpenAI             │
│                     │
│  Decides to call:
│  addLocationFunction({
│    name: "Eiffel Tower",
│    lat: 48.8584,
│    lng: 2.2945
│  })
└──────┬──────────────┘
       │
       │ Spring AI intercepts
       ▼

Step 3: Function Executes
┌─────────────────────┐
│ AddLocationFunction │
│                     │
│ 1. Create Location object
│ 2. Save to MongoDB
│ 3. Send WebSocket event
└──────┬──────────────┘
       │
       ├────(Save)────> MongoDB
       │
       └──(Notify)────┐
                      ▼
Step 4: WebSocket Broadcast
┌─────────────────────┐
│  WebSocket          │
│  Controller         │
│                     │
│  messagingTemplate
│   .convertAndSend(
│     "/topic/session123",
│     locationEvent
│   )
└──────┬──────────────┘
       │
       │ WebSocket message
       ▼

Step 5: Frontend Receives Event
┌─────────────────────┐
│  MapService         │
│  (Frontend)         │
│                     │
│  stompClient.subscribe(
│    "/topic/session123",
│    (event) => {
│      addMarker(event.location)
│    }
│  )
└──────┬──────────────┘
       │
       │ Update map
       ▼

Step 6: Map Updates
┌─────────────────────┐
│  Google Map         │
│                     │
│  📍 Eiffel Tower
│     appears instantly!
└─────────────────────┘

Total Time: ~2 seconds
(No page refresh needed!)
```

---

### Flow 3: Guest User Signs Up

```
Step 1: Guest Browses Site
┌─────────────┐
│  Browser    │
│             │
│  Guest token created automatically:
│  eyJhbGci... (stored in localStorage)
│             │
│  Guest has session: "guest-abc123"
│  Guest has 5 messages in chat
│  Guest has 3 locations on map
└─────────────┘

Step 2: Guest Clicks "Sign Up"
       │
       │ Navigate to /auth/signup
       ▼
┌─────────────┐
│  Sign Up    │
│  Form       │
│             │
│  Email: sarah@example.com
│  Password: ••••••••
│  [Create Account Button]
└──────┬──────┘
       │
       │ POST /api/auth/signup
       ▼

Step 3: Backend Creates User
┌─────────────────────┐
│  AuthController     │
│                     │
│  1. Validate email
│  2. Hash password (bcrypt)
│  3. Create User entity
│  4. Save to MongoDB
│  5. Generate JWT token
│  6. CRITICAL: Migrate guest session
└──────┬──────────────┘
       │
       ├──(Save User)──> MongoDB users collection
       │
       └──(Migrate)────┐
                       ▼
Step 4: Migrate Guest Data
┌─────────────────────────┐
│  SessionService         │
│                         │
│  migrateGuestSession(
│    guestSessionId: "guest-abc123",
│    newUserId: "user123"
│  ) {
│    1. Find session "guest-abc123"
│    2. Update userId to "user123"
│    3. Messages auto-transfer (linked by sessionId)
│    4. Locations auto-transfer (linked by sessionId)
│    5. Return success
│  }
└──────┬──────────────────┘
       │
       │ Update MongoDB
       ▼
┌─────────────────────────┐
│  MongoDB                │
│                         │
│  sessions collection:
│  {
│    sessionId: "guest-abc123",
│    userId: "user123"  ← Changed from "guest"
│  }
│                         │
│  messages collection:
│  Still linked by sessionId (no change needed)
│                         │
│  locations collection:
│  Still linked by sessionId (no change needed)
└─────────────────────────┘

Step 5: Return to Frontend
       │
       │ HTTP Response:
       │ {
       │   token: "eyJhbGci...",
       │   user: { id: "user123", email: "sarah@example.com" }
       │ }
       ▼
┌─────────────┐
│  Frontend   │
│             │
│  1. Save new token
│  2. Update AuthContext
│  3. router.push('/chat')  ← NO page reload!
│  4. Load messages (now with userId)
│  5. All 5 previous messages load
│  6. All 3 locations still on map
└──────┬──────┘
       │
       │ User sees:
       ▼
┌─────────────┐
│  Browser    │
│             │
│  ✅ Welcome, Sarah!
│  ✅ Your trip has been saved!
│  ✅ All messages still there
│  ✅ Map still has markers
└─────────────┘

**Key Point:**
Guest data MUST transfer smoothly.
Losing data = losing the user forever!
```

---

## Security Architecture

### Authentication Flow (JWT)

```
Step 1: User Signs In
┌─────────────┐
│  Frontend   │
│             │
│  POST /api/auth/signin
│  {
│    username: "sarah",
│    password: "MyPassword123"
│  }
└──────┬──────┘
       │
       │ HTTPS (encrypted)
       ▼
┌─────────────────────┐
│  Backend            │
│  AuthController     │
│                     │
│  1. Find user by username
│  2. Verify password (bcrypt)
│  3. Generate JWT token
└──────┬──────────────┘
       │
       │ Generate token
       ▼
┌─────────────────────┐
│  JwtUtil            │
│                     │
│  token = JWT.create()
│    .withSubject(userId)
│    .withExpiresAt(now + 24 hours)
│    .sign(SECRET_KEY)
│                     │
│  Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
└──────┬──────────────┘
       │
       │ Return token
       ▼
┌─────────────┐
│  Frontend   │
│             │
│  localStorage.setItem('token', token)
│             │
│  ⚠️ PROBLEM: Vulnerable to XSS!
│  ✅ FIX (Sprint 1): Use httpOnly cookies
└─────────────┘

Step 2: Making Authenticated Requests
┌─────────────┐
│  Frontend   │
│             │
│  Axios interceptor adds token:
│  config.headers.Authorization = `Bearer ${token}`
└──────┬──────┘
       │
       │ Every request includes token
       ▼
┌─────────────────────┐
│  Backend            │
│  JwtRequestFilter   │
│                     │
│  1. Extract token from header
│  2. Validate token (check signature)
│  3. Check expiration
│  4. Get userId from token
│  5. Load user from database
│  6. Add to Spring Security context
└──────┬──────────────┘
       │
       │ If valid, proceed
       │ If invalid, return 401 Unauthorized
       ▼
┌─────────────────────┐
│  Controller         │
│                     │
│  User is authenticated ✅
│  Can access protected endpoints
└─────────────────────┘
```

---

### CORS Configuration (Security)

**What is CORS?**
Browsers block requests from one domain to another (security feature).

**Problem:**
```
Frontend:  https://www.flomadtravel.com  (Vercel)
Backend:   https://api.flomadtravel.com  (AWS EC2)
           ↑ Different domain = blocked by browser!
```

**Solution:**
Backend explicitly allows frontend domain.

```java
// CorsConfig.java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins(
                        "https://www.flomadtravel.com",  // Production
                        "http://localhost:3000"          // Development
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

**⚠️ Security Issue Found:**
Some code has `allowedOriginPatterns("*")` → Allows ALL domains!
**Fix in Sprint 1:** Use specific domains only.

---

## Session & Token Management Architecture

### Current Issues & Improvements

#### Problem 1: Client-Side Only Storage
**Current (Insecure):**
```
┌─────────────┐
│  Browser    │
│             │
│ localStorage:
│   token: "eyJhbGci..."
│   sessionId: "abc-123"
│             │
│ ⚠️ Vulnerable to XSS
│ ⚠️ Lost on browser clear
└─────────────┘
```

**Improved (Sprint 1):**
```
┌─────────────┐           ┌─────────────┐
│  Browser    │           │  Backend    │
│             │           │             │
│ httpOnly Cookie:        │ Database:   │
│   refreshToken          │   refresh_tokens
│   (secure, XSS-safe)    │   session_mappings
│             │           │             │
│ localStorage:           │             │
│   accessToken (short)   │             │
│   deviceId              │             │
└─────────────┘           └─────────────┘
```

---

#### Problem 2: No Session Restoration
**Current Flow (Data Loss):**
```
Day 1:
User → Creates session → Closes tab
  sessionStorage.clear() ← Session ID lost!

Day 2:  
User → Opens site → New session created
  All previous work GONE!
```

**Improved Flow (Sprint 1):**
```
Day 1:
User → Creates session → Session mapped to deviceId → Closes tab
                         localStorage: deviceId
                         Backend: deviceId→sessionId mapping

Day 2:
User → Opens site → Frontend sends deviceId
       Backend finds last session (if <7 days old)
       Frontend: "Continue your Paris trip?" ✅
       User clicks "Continue"
       All messages and locations restored!
```

---

#### Problem 3: Token Expiration Without Refresh
**Current (Broken):**
```
Time 0:   User signs in → Gets 24hr token
Time 23h: User still active...
Time 24h: Token expires → 401 error → Creates guest token
          ❌ User loses authenticated session!
          ❌ Becomes guest user unexpectedly!
```

**Improved (Sprint 1):**
```
Time 0:    User signs in → Access token (15min) + Refresh token (7days)
Time 10min: Frontend checks: "Token expires in 5min"
            Auto-refreshes in background
            User continues working seamlessly ✅
Time 14min: New access token issued
            Refresh token rotated (security)
Time 6days: Still working fine...
Time 7days: Refresh token expires → Gentle prompt: "Please sign in again"
```

---

### Token Refresh Flow (New Implementation)

```
Step 1: Token About to Expire
┌─────────────┐
│  Frontend   │
│             │
│  setInterval(() => {
│    const timeLeft = tokenExpiresAt - Date.now();
│    if (timeLeft < 5 * 60 * 1000) {  // Less than 5 minutes
│      refreshToken();
│    }
│  }, 60000);  // Check every minute
└──────┬──────┘
       │
       │ Token needs refresh
       ▼
Step 2: Call Refresh Endpoint
┌─────────────┐
│  Frontend   │
│             │
│  POST /auth/refresh
│  Cookie: refreshToken=xyz...
│             │
│  ⚠️ Only ONE refresh at a time
│     (prevent race condition)
└──────┬──────┘
       │
       │ HTTPS with httpOnly cookie
       ▼
Step 3: Backend Validates
┌─────────────────────┐
│  AuthController     │
│                     │
│  1. Extract refresh token from cookie
│  2. Find in database
│  3. Check if expired
│  4. Check if revoked
│  5. Generate new access token (15min)
│  6. Generate new refresh token (7days)
│  7. Revoke old refresh token
│  8. Save new refresh token
└──────┬──────────────┘
       │
       │ Return new tokens
       ▼
Step 4: Frontend Updates
┌─────────────┐
│  Frontend   │
│             │
│  1. Save new access token
│  2. Update token expiration time
│  3. Retry any failed requests
│  4. User doesn't notice anything ✅
└─────────────┘
```

---

### Session Restoration Flow (New Implementation)

```
User Opens App (First Time):
┌─────────────┐
│  Frontend   │
│             │
│  1. Check localStorage for deviceId
│  2. None found → Generate new UUID
│  3. Save deviceId to localStorage
│  4. Check for last session:
│     GET /sessions/last?deviceId=abc-123
│  5. Backend: No session found
│  6. Create new guest session
└─────────────┘

User Returns (Within 7 Days):
┌─────────────┐
│  Frontend   │
│             │
│  1. Get deviceId from localStorage: "abc-123"
│  2. GET /sessions/last?deviceId=abc-123
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Backend            │
│                     │
│  1. Find mapping: deviceId="abc-123" → sessionId="paris-trip-456"
│  2. Check session.updatedAt
│  3. If < 7 days → Return session details
│  4. If > 7 days → Return null (expired)
└──────┬──────────────┘
       │
       │ Session found!
       ▼
┌─────────────┐
│  Frontend   │
│             │
│  Show modal:
│  "Welcome back! Continue planning your Paris trip?"
│  [Continue] [Start New]
│             │
│  If Continue:
│    - Load session messages
│    - Load locations
│    - Restore map state
│  ✅ User's work preserved!
└─────────────┘
```

---

### Security Improvements Summary

| Current | Improved (Sprint 1) | Benefit |
|---------|---------------------|---------|
| localStorage for tokens | httpOnly cookies for refresh tokens | XSS protection |
| 24hr tokens, no refresh | 15min access + 7day refresh | Better security |
| sessionStorage for session | localStorage + backend mapping | Survives tab close |
| No token rotation | Refresh tokens rotate on use | Prevents token theft |
| window.location reloads | router.push navigation | Preserves state |
| No device tracking | Device UUID for restoration | Session continuity |

---

## Database Schema (MongoDB)

### Collection: users

**Purpose:** Store user accounts

```javascript
{
  "_id": "user123",
  "username": "sarah",
  "email": "sarah@example.com",
  "password": "$2a$10$hashed...",  // Bcrypt hashed
  "roles": ["ROLE_USER"],
  "provider": "LOCAL",  // or "GOOGLE", "LINKEDIN", "FACEBOOK"
  "providerId": null,
  "createdAt": "2025-10-22T10:00:00Z",
  "lastActive": "2025-10-22T15:30:00Z"
}
```

**Indexes:**
- `username` (unique)
- `email` (unique)
- `providerId` (for OAuth users)

---

### Collection: sessions

**Purpose:** Store trip/chat sessions

```javascript
{
  "_id": "session123",
  "sessionId": "abc-123-def",  // Unique ID
  "userId": "user123",         // Who owns this
  "title": "Paris Trip",       // Auto-generated or user-set
  "createdAt": "2025-10-22T11:00:00Z",
  "updatedAt": "2025-10-22T12:00:00Z",
  "isPublic": false,           // For sharing (Sprint 5)
  "shareToken": null           // For sharing (Sprint 5)
}
```

**Indexes:**
- `sessionId` (unique)
- `userId` (frequently queried)

**Queries:**
```javascript
// Get all sessions for a user
db.sessions.find({ userId: "user123" })

// Get specific session
db.sessions.findOne({ sessionId: "abc-123-def" })
```

---

### Collection: guestDeviceMappings (NEW - Sprint 1)

**Purpose:** Map guest devices to their last session for restoration

```javascript
{
  "_id": "mapping123",
  "deviceId": "abc-123-uuid",      // UUID from browser localStorage
  "lastSessionId": "session456",   // Most recent session
  "lastAccessedAt": "2025-10-22T15:00:00Z",
  "expiresAt": "2025-10-29T15:00:00Z"  // 7 days from last access
}
```

**Indexes:**
- `deviceId` (unique)
- `expiresAt` (for automatic cleanup)

**Queries:**
```javascript
// Find last session for a device
db.guestDeviceMappings.findOne({ deviceId: "abc-123-uuid" })

// Clean up expired mappings
db.guestDeviceMappings.deleteMany({ expiresAt: { $lt: new Date() } })
```

**Use Case:**
When a guest user returns after closing their browser, we can restore their last session:
1. Frontend sends deviceId from localStorage
2. Backend finds mapping
3. Checks if session is < 7 days old
4. Returns session details if valid
5. User continues where they left off ✅

---

### Collection: refreshTokens (NEW - Sprint 1)

**Purpose:** Store refresh tokens for secure token rotation

```javascript
{
  "_id": "token123",
  "token": "$2a$10$hashed...",      // Hashed refresh token
  "userId": "user123",              // Token owner
  "deviceInfo": "Chrome/Windows",   // For security audit
  "issuedAt": "2025-10-22T10:00:00Z",
  "expiresAt": "2025-10-29T10:00:00Z",  // 7 days
  "lastUsedAt": "2025-10-22T10:00:00Z",
  "revoked": false                  // Set to true on logout
}
```

**Indexes:**
- `token` (unique, hashed)
- `userId` (frequently queried)
- `expiresAt` (for automatic cleanup)

**Queries:**
```javascript
// Find valid refresh token
db.refreshTokens.findOne({ 
  token: hashedToken, 
  revoked: false,
  expiresAt: { $gt: new Date() }
})

// Revoke all tokens for a user (logout)
db.refreshTokens.updateMany(
  { userId: "user123" },
  { $set: { revoked: true } }
)

// Clean up expired tokens
db.refreshTokens.deleteMany({ expiresAt: { $lt: new Date() } })
```

**Security Features:**
- Tokens are hashed before storage (bcrypt)
- One-time use: revoked immediately after refresh
- New token issued on each refresh (rotation)
- Device info logged for audit trail
- Automatic expiration after 7 days

---

### Collection: messages

**Purpose:** Store chat messages

```javascript
{
  "_id": "msg123",
  "sessionId": "session123",
  "messageType": "USER",  // or "ASSISTANT"
  "content": "I want to visit Paris",
  "metadata": {
    "functionCalls": ["addLocationFunction"],
    "tokens": 150
  },
  "createdAt": "2025-10-22T11:05:00Z"
}
```

**Indexes:**
- `sessionId` + `createdAt` (compound index for sorting)

**Queries:**
```javascript
// Get messages for a session (sorted)
db.messages.find({ sessionId: "session123" })
  .sort({ createdAt: 1 })  // Oldest first

// Paginated messages
db.messages.find({ sessionId: "session123" })
  .sort({ createdAt: -1 })  // Newest first
  .limit(50)
  .skip(0)
```

**⚠️ Performance Issue:**
No index on `sessionId` + `createdAt` = slow queries!
**Fix in Sprint 4:** Add compound index.

---

### Collection: locations

**Purpose:** Store map markers

```javascript
{
  "_id": "loc123",
  "sessionId": "session123",
  "name": "Eiffel Tower",
  "latitude": 48.8584,
  "longitude": 2.2945,
  "type": "attraction",  // or "hotel", "restaurant", etc.
  "metadata": {
    "address": "Champ de Mars, Paris",
    "rating": 4.7,
    "placeId": "ChIJLU7jZClu5kcR4PcOOO6p3I0"
  },
  "createdAt": "2025-10-22T11:10:00Z"
}
```

**Indexes:**
- `sessionId` (frequently queried)
- `latitude` + `longitude` (for geospatial queries - future)

---

## WebSocket Architecture (Real-Time Updates)

### Why WebSocket?

**Problem with HTTP:**
Frontend must constantly poll: "Any new locations? Any new locations?"

**Solution with WebSocket:**
Backend pushes updates when they happen.

```
HTTP Polling (Inefficient):
Frontend  →  "Any updates?"  →  Backend
          ←  "Nope"          ←
(wait 2 seconds)
Frontend  →  "Any updates?"  →  Backend
          ←  "Nope"          ←
(wait 2 seconds)
Frontend  →  "Any updates?"  →  Backend
          ←  "Yes! Location added"  ←

WebSocket (Efficient):
Frontend  →  Connect once  →  Backend
(connection stays open)
Backend   →  "Location added!"  →  Frontend  ← Instant!
```

---

### WebSocket Configuration

**Backend:**
```java
// WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint
        registry.addEndpoint("/ws")
            .setAllowedOrigins("https://www.flomadtravel.com")
            .withSockJS();  // Fallback for old browsers
    }
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Clients subscribe to /topic/*
        registry.enableSimpleBroker("/topic");
    }
}
```

**Frontend:**
```typescript
// MapService.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('https://api.flomadtravel.com/ws'),
  
  onConnect: () => {
    // Subscribe to session-specific topic
    client.subscribe(`/topic/${sessionId}`, (message) => {
      const event = JSON.parse(message.body);
      
      if (event.type === 'LOCATION_ADDED') {
        addMarkerToMap(event.location);
      }
    });
  }
});

client.activate();
```

---

### WebSocket Message Flow

```
Scenario: AI adds Eiffel Tower to map

Step 1: AI Function Executes
┌─────────────────────┐
│ AddLocationFunction │
│                     │
│ 1. Save to MongoDB
│ 2. Call WebSocket controller
└──────┬──────────────┘
       │
       ▼

Step 2: Broadcast Event
┌─────────────────────────┐
│  WebSocketController    │
│                         │
│  messagingTemplate.convertAndSend(
│    "/topic/session123",
│    {
│      type: "LOCATION_ADDED",
│      location: {
│        name: "Eiffel Tower",
│        lat: 48.8584,
│        lng: 2.2945
│      }
│    }
│  )
└──────┬──────────────────┘
       │
       │ WebSocket broadcast
       ▼
┌─────────────────────────┐
│  All Clients Subscribed │
│  to /topic/session123   │
│                         │
│  Client 1 (Sarah's laptop) ✅
│  Client 2 (Sarah's phone)  ✅
│  Client 3 (Friend viewing) ✅
└──────┬──────────────────┘
       │
       │ All see update instantly!
       ▼
┌─────────────┐
│  Map        │
│             │
│  📍 Eiffel Tower
│     appears!
└─────────────┘

Total latency: < 500ms
```

---

## Deployment Architecture

### Production Deployment (Current)

```
┌──────────────────────────────────────────────────────────────┐
│                        USERS (Internet)                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│   Vercel CDN    │           │   AWS EC2       │
│                 │           │   Ubuntu Server │
│  Frontend       │           │                 │
│  Next.js 15     │           │  Backend        │
│                 │           │  Spring Boot 3  │
│  Domain:        │           │                 │
│  flomadtravel   │           │  Domain:        │
│  .com           │           │  api.flomad     │
│                 │           │  travel.com     │
│                 │           │                 │
│  - Static files │           │  - REST API     │
│  - SSR pages    │           │  - WebSocket    │
│  - Edge cache   │           │  - AI calls     │
└────────┬────────┘           └────────┬────────┘
         │                             │
         │                   ┌─────────┴──────────┐
         │                   │                    │
         │                   ▼                    ▼
         │           ┌─────────────┐     ┌─────────────┐
         │           │  MongoDB    │     │  External   │
         │           │  Atlas      │     │  APIs       │
         │           │             │     │             │
         │           │  - users    │     │  - OpenAI   │
         │           │  - sessions │     │  - Amadeus  │
         │           │  - messages │     │  - Google   │
         │           │  - locations│     │  - Viator   │
         │           └─────────────┘     └─────────────┘
         │
         └─── Also makes API calls to backend ───┘
```

---

### Development Setup (Local)

```
Developer's Computer
┌────────────────────────────────────────────────────┐
│                                                    │
│  Terminal 1:                  Terminal 2:          │
│  ┌─────────────────┐         ┌─────────────────┐  │
│  │ Frontend        │         │ Backend         │  │
│  │                 │         │                 │  │
│  │ cd frontend     │         │ cd backend      │  │
│  │ pnpm dev        │         │ ./mvnw spring-  │  │
│  │                 │         │   boot:run      │  │
│  │ localhost:3000  │         │ localhost:8080  │  │
│  └─────────────────┘         └─────────────────┘  │
│           │                           │            │
│           │  HTTP calls               │            │
│           └──────────────────────────>│            │
│                                       │            │
│                          ┌────────────┴──────┐     │
│                          │                   │     │
│                          ▼                   ▼     │
│                  ┌─────────────┐    ┌─────────────┐│
│                  │ MongoDB     │    │ External    ││
│                  │ Local       │    │ APIs        ││
│                  │ or Atlas    │    │ (staging)   ││
│                  └─────────────┘    └─────────────┘│
│                                                    │
│  Browser: http://localhost:3000                   │
└────────────────────────────────────────────────────┘
```

---

## Error Handling Architecture

### Layered Error Handling

```
┌───────────────────────────────────────────────────────┐
│ Layer 1: Frontend Input Validation                   │
│                                                       │
│  if (!message.trim()) {
│    toast.error("Please enter a message");
│    return;  // Stop here, don't call API
│  }
└───────────────────────────────────────────────────────┘
                        │
                        │ Valid input
                        ▼
┌───────────────────────────────────────────────────────┐
│ Layer 2: API Client Error Handling                   │
│                                                       │
│  try {
│    const response = await api.post('/chat', data);
│    return response.data;
│  } catch (error) {
│    if (error.response?.status === 401) {
│      // Token expired, try refresh
│      await refreshToken();
│      retry();
│    } else {
│      throw error;  // Pass to next layer
│    }
│  }
└───────────────────────────────────────────────────────┘
                        │
                        │ API error
                        ▼
┌───────────────────────────────────────────────────────┐
│ Layer 3: Component Error Handling                    │
│                                                       │
│  try {
│    await sendMessage(message);
│    toast.success("Message sent!");
│  } catch (error) {
│    // Transform to user-friendly message
│    toast.error(ERROR_MESSAGES[error.code] ||
│      "Something went wrong. Please try again.");
│    
│    // Log to monitoring
│    Sentry.captureException(error);
│  }
└───────────────────────────────────────────────────────┘
                        │
                        │ Unexpected error
                        ▼
┌───────────────────────────────────────────────────────┐
│ Layer 4: Error Boundary (React)                      │
│                                                       │
│  <ErrorBoundary fallback={<ErrorPage />}>
│    <App />
│  </ErrorBoundary>
│                                                       │
│  Catches any uncaught errors in React tree
└───────────────────────────────────────────────────────┘
```

**Backend Error Handling:**
```
┌───────────────────────────────────────────────────────┐
│ Layer 1: Input Validation                            │
│                                                       │
│  @Valid @RequestBody AIMessageDTO message
│  → Spring validates automatically
│  → Returns 400 Bad Request if invalid
└───────────────────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│ Layer 2: Service Try-Catch                           │
│                                                       │
│  try {
│    return openAIService.chat(message);
│  } catch (OpenAIException e) {
│    log.error("OpenAI error", e);
│    throw new ServiceException("AI service unavailable");
│  }
└───────────────────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│ Layer 3: Global Exception Handler                    │
│                                                       │
│  @ControllerAdvice
│  public class GlobalExceptionHandler {
│    
│    @ExceptionHandler(ServiceException.class)
│    public ResponseEntity<?> handleServiceError(e) {
│      return ResponseEntity
│        .status(503)
│        .body(new ErrorResponse(e.getMessage()));
│    }
│  }
└───────────────────────────────────────────────────────┘
```

---

## Caching Strategy (Future - Sprint 4)

### What to Cache

```
┌──────────────────────────────────────────────────────┐
│ Cache Level 1: Browser Cache                        │
│                                                      │
│  - Static assets (CSS, JS, images)
│  - Cache-Control headers
│  - Service Worker (future)
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Cache Level 2: CDN Cache (Vercel)                   │
│                                                      │
│  - Entire pages (for static content)
│  - API responses (if marked cacheable)
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Cache Level 3: Application Cache (React Query/SWR)  │
│                                                      │
│  - API responses (client-side)
│  - Dedupe requests
│  - Stale-while-revalidate
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Cache Level 4: Server Cache (Redis - future)        │
│                                                      │
│  - Flight search results (30 min)
│  - Hotel search results (1 hour)
│  - Weather data (3 hours)
│  - Session data (15 min)
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ No Cache: Always Fresh                              │
│                                                      │
│  - Chat messages
│  - User authentication
│  - Location updates
└──────────────────────────────────────────────────────┘
```

---

## Scalability Considerations (Future)

### Current Limitations

**Single Server:**
- Backend runs on one EC2 instance
- If it goes down, entire app is down
- Limited concurrent users (~1000)

**No Load Balancer:**
- Can't distribute traffic
- Can't auto-scale

**MongoDB Atlas:**
- ✅ Already scalable
- ✅ Automatic backups
- ✅ Replication

---

### Future Architecture (v2)

```
Users
  │
  ▼
┌─────────────┐
│ Cloudflare  │  ← DDoS protection, CDN
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Load        │  ← Distribute traffic
│ Balancer    │
│ (AWS ALB)   │
└──────┬──────┘
       │
       ├─────┬─────┬─────┐
       ▼     ▼     ▼     ▼
     ┌──┐  ┌──┐  ┌──┐  ┌──┐
     │BE│  │BE│  │BE│  │BE│  ← Multiple backend instances
     │#1│  │#2│  │#3│  │#4│    (Auto-scaling)
     └──┘  └──┘  └──┘  └──┘
       │     │     │     │
       └─────┴─────┴─────┘
              │
              ▼
       ┌─────────────┐
       │   Redis     │  ← Shared cache
       │   Cluster   │
       └─────────────┘
              │
              ▼
       ┌─────────────┐
       │   MongoDB   │  ← Database (already scalable)
       │   Atlas     │
       └─────────────┘
```

---

## Monitoring & Observability (Future)

### What to Monitor

**Application Metrics:**
- Request rate (requests/second)
- Error rate (%)
- Response time (p50, p95, p99)
- Active users

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

**Business Metrics:**
- Sign-ups per day
- Messages sent
- API costs
- Conversion rate (guest → user)

### Tools to Use (Sprint 4-5)

**Sentry:**
- Error tracking
- Performance monitoring
- User feedback

**Vercel Analytics:**
- Page views
- Core Web Vitals
- Deployment metrics

**AWS CloudWatch:**
- EC2 metrics
- Logs
- Alarms

---

## Architectural Decisions (Why We Chose This)

### Decision 1: Next.js for Frontend

**Alternatives Considered:**
- Create React App
- Vite
- Plain React

**Why Next.js:**
- ✅ SEO friendly (Server-Side Rendering)
- ✅ Built-in routing
- ✅ API routes (if needed)
- ✅ Optimized images
- ✅ Easy deployment (Vercel)

---

### Decision 2: Spring Boot for Backend

**Alternatives Considered:**
- Node.js + Express
- Django (Python)
- Ruby on Rails

**Why Spring Boot:**
- ✅ Mature ecosystem
- ✅ Type safety (Java)
- ✅ Spring AI integration
- ✅ Enterprise features
- ✅ Team familiarity

---

### Decision 3: MongoDB for Database

**Alternatives Considered:**
- PostgreSQL
- MySQL
- DynamoDB

**Why MongoDB:**
- ✅ Flexible schema (AI responses vary)
- ✅ JSON-like documents (matches JavaScript)
- ✅ Easy to scale (Atlas)
- ✅ Geospatial queries (future)
- ❌ Weak transactions (not critical for us)

---

### Decision 4: JWT for Authentication

**Alternatives Considered:**
- Session cookies
- OAuth only

**Why JWT:**
- ✅ Stateless (no session store needed)
- ✅ Works with mobile apps
- ✅ Easy to validate
- ❌ Can't revoke (unless we add blacklist)
- ⚠️ Security: Move to httpOnly cookies (Sprint 1)

---

## Troubleshooting Guide

### Common Architecture Issues

**Issue: WebSocket Won't Connect**

**Symptoms:**
- Map doesn't update in real-time
- Console error: "WebSocket connection failed"

**Possible Causes:**
1. Backend not running
2. CORS blocking WebSocket
3. Firewall blocking port
4. Wrong WebSocket URL

**How to Debug:**
```typescript
// Check WebSocket URL
console.log('Connecting to:', webSocketUrl);

// Check connection state
client.onConnect = () => {
  console.log('✅ WebSocket connected!');
};

client.onStompError = (error) => {
  console.error('❌ WebSocket error:', error);
};
```

---

**Issue: Infinite Loop in useEffect**

**Symptoms:**
- App freezes
- Same API call repeating
- Browser becomes unresponsive

**Cause:**
Missing dependencies in useEffect

**Fix:**
```typescript
// ❌ WRONG - Infinite loop
useEffect(() => {
  setCount(count + 1);  // Updates count
}, [count]);  // Re-runs when count changes = loop!

// ✅ CORRECT - Runs once
useEffect(() => {
  fetchData();
}, []);  // Empty array = run once

// ✅ CORRECT - Controlled updates
useEffect(() => {
  if (shouldFetch) {
    fetchData();
  }
}, [shouldFetch]);  // Only when this changes
```

---

## Glossary (Architecture Terms)

**API Gateway** = Single entry point for all API requests (we don't have this yet)

**CDN (Content Delivery Network)** = Servers around the world that cache content (Vercel provides this)

**Horizontal Scaling** = Adding more servers (future v2)

**Vertical Scaling** = Making server bigger (current approach)

**Load Balancer** = Distributes traffic across servers (future v2)

**Microservices** = Breaking app into smaller services (not using, we're monolithic)

**Monolithic** = All code in one application (current architecture)

**Serverless** = Functions that run on-demand (we don't use, but Vercel does)

**SSR (Server-Side Rendering)** = Next.js renders pages on server before sending to browser

**Stateless** = Server doesn't remember previous requests (JWT approach)

**Stateful** = Server remembers (session cookies approach)

---

## Next Steps for Developers

**To Understand This Architecture:**

1. **Draw It Yourself**
   - Sketch the system on paper
   - Draw data flow for one feature
   - Label each component

2. **Trace a Request**
   - Pick one feature (e.g., send message)
   - Follow it through every layer
   - Note what each component does

3. **Run Locally**
   - See all pieces working together
   - Break something intentionally
   - Fix it to understand better

4. **Read the Code**
   - Start with one controller
   - Follow it to service
   - Then to repository
   - See the pattern

5. **Ask Questions**
   - "Why do we use WebSocket here?"
   - "Could we use HTTP polling instead?"
   - "What would break if we removed this?"

**Remember:** Architecture evolves. What we have now is v1. We'll improve it based on what we learn!

---

## Conclusion

**Key Takeaways:**
1. **Layered Architecture:** Frontend → Backend → Database
2. **Clear Responsibilities:** Each component has one job
3. **Real-Time Updates:** WebSocket for instant map updates
4. **Security:** JWT authentication (improving in Sprint 1)
5. **Scalability:** Current setup works for MVP, v2 for growth

**This Architecture Supports:**
- Fast development
- Easy debugging
- Clear separation of concerns
- Room to scale

**Next Documents to Read:**
- `SprintBreakdown.md` - What to build next
- `TechnicalSpecification.md` - Implementation details
- `FunctionalSpecification.md` - User features

---

**Questions?** Architecture might seem complex at first, but once you see how pieces fit together, it makes sense! Ask the team anytime. 🚀
