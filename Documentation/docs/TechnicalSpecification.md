# AI Travel Planner - Technical Specification (Junior-Friendly)

**Date:** October 22, 2025  
**Version:** 2.0 (Beginner's Guide)  
**Target Audience:** Junior Developers  
**Purpose:** Understand how the system is built

---

## How to Use This Document

**If you're new to development:**
- Don't worry if you don't understand everything at first
- Look up unfamiliar terms in the Glossary at the end
- Ask senior devs for explanations
- Come back to sections as you learn more

**This document explains:**
- What technologies we use (and why)
- How the frontend and backend talk to each other
- How data is stored
- How to set up your development environment

---

## The Big Picture (Very Simple Explanation)

```
┌─────────────────────────────────────────────────────────┐
│         USER'S BROWSER (What the user sees)             │
│  - Website made with Next.js (React)                    │
│  - Runs on Vercel servers                               │
│  - Shows chat interface and map                         │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Internet (HTTPS)
                        ▼
┌─────────────────────────────────────────────────────────┐
│        OUR SERVER (The "brain" of the app)              │
│  - Java Spring Boot application                         │
│  - Runs on AWS EC2 (Amazon computer)                    │
│  - Talks to AI and saves data                           │
└─────────────────────────────────────────────────────────┘
                        │
                ┌───────┴────────┐
                ▼                ▼
        ┌──────────┐      ┌──────────┐
        │ MongoDB  │      │  OpenAI  │
        │ Database │      │    AI    │
        └──────────┘      └──────────┘
```

**In Simple Words:**
1. User types message in browser
2. Browser sends message to our server
3. Our server asks OpenAI what to say
4. Our server saves everything to MongoDB
5. Response goes back to browser
6. User sees AI's reply

---

## Technology Stack (What We Use)

### Frontend (What Users See)

**Next.js 15**
- **What it is:** Framework for building websites with React
- **Why we use it:** Makes React easier, handles routing automatically
- **Learn more:** https://nextjs.org

**React 18**
- **What it is:** Library for building user interfaces
- **Why we use it:** Components are reusable, updates UI efficiently
- **Learn more:** https://react.dev

**TypeScript 5**
- **What it is:** JavaScript with types
- **Why we use it:** Catches bugs before running code
- **Example:**
```typescript
// JavaScript (no types)
function add(a, b) {
  return a + b;
}
add("hello", 5); // Bug! But JavaScript won't tell you

// TypeScript (with types)
function add(a: number, b: number): number {
  return a + b;
}
add("hello", 5); // ❌ TypeScript error! Can't add string and number
```

**Tailwind CSS**
- **What it is:** CSS framework with utility classes
- **Why we use it:** Faster styling, consistent design
- **Example:**
```html
<!-- Traditional CSS -->
<button class="my-button">Click</button>
<style>
.my-button {
  background-color: blue;
  color: white;
  padding: 0.5rem 1rem;
}
</style>

<!-- Tailwind CSS -->
<button class="bg-blue-500 text-white px-4 py-2">Click</button>
```

---

### Backend (The Server)

**Spring Boot 3.2.9**
- **What it is:** Framework for building Java web applications
- **Why we use it:** Industry standard, lots of features built-in
- **Learn more:** https://spring.io

**Java 17**
- **What it is:** Programming language
- **Why we use it:** Type-safe, reliable, good for servers
- **Note:** Different from JavaScript!

**Spring AI**
- **What it is:** Framework for integrating AI into Spring apps
- **Why we use it:** Makes it easy to use OpenAI and other AI services
- **Cool feature:** Function calling (AI can trigger our code)

---

### Database

**MongoDB Atlas**
- **What it is:** NoSQL database hosted in the cloud
- **Why we use it:** Flexible data structure, easy to scale
- **How it works:** Stores data as JSON-like documents
- **Example document:**
```javascript
{
  "_id": "abc123",
  "username": "sarah",
  "email": "sarah@example.com",
  "createdAt": "2025-10-22T10:00:00Z"
}
```

---

### External Services (APIs We Use)

**OpenAI GPT-3.5 Turbo**
- **What it does:** Generates AI chat responses
- **Cost:** ~$0.002 per 1000 tokens

**Google Maps**
- **What it does:** Shows maps and location search
- **Note:** API key needed

**Amadeus API**
- **What it does:** Flight search
- **Note:** Test mode vs production mode

**Viator API**
- **What it does:** Tours and activities search

---

## How to Set Up Development Environment

### Step 1: Install Required Software

**Node.js 20+**
```bash
# Check if installed:
node --version

# Should show: v20.x.x
```
Download from: https://nodejs.org

**pnpm**
```bash
# Install pnpm:
npm install -g pnpm

# Check version:
pnpm --version
```

**Java 17**
```bash
# Check if installed:
java --version

# Should show: java version "17.x.x"
```
Download from: https://adoptium.net

**Maven**
```bash
# Check if installed:
mvn --version
```
Download from: https://maven.apache.org

---

### Step 2: Clone the Repository

```bash
# Clone the project
git clone <repository-url>
cd travel-app

# You should see two main folders:
# - AITravelPlannerFrontendNextjs
# - AITravelPlannerBackEnd
```

---

### Step 3: Set Up Frontend

```bash
# Go to frontend folder
cd AITravelPlannerFrontendNextjs

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your values:
# NEXT_PUBLIC_API_URL=http://localhost:8080
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here

# Start development server
pnpm dev

# Open browser: http://localhost:3000
```

**Common Issues:**
- **"pnpm: command not found"** → Install pnpm first
- **"Module not found"** → Run `pnpm install` again
- **Port 3000 already in use** → Kill other process or use different port

---

### Step 4: Set Up Backend

```bash
# Go to backend folder
cd AITravelPlannerBackEnd

# Copy environment file
cp .env.example .env

# Edit .env with your values (ask team for credentials)

# Start MongoDB locally OR use MongoDB Atlas
# (Ask team for connection string)

# Run the application
./mvnw spring-boot:run

# Backend should start on: http://localhost:8080
```

**Common Issues:**
- **"Port 8080 already in use"** → Change port in application.properties
- **"Cannot connect to MongoDB"** → Check MongoDB is running
- **"API key errors"** → Check .env file has correct keys

---

## Frontend Architecture (How It's Organized)

### Folder Structure

```
AITravelPlannerFrontendNextjs/
├── src/
│   ├── app/                    # Pages (Next.js App Router)
│   │   ├── page.tsx            # Homepage (/)
│   │   ├── chat/page.tsx       # Chat page (/chat)
│   │   ├── auth/
│   │   │   ├── signin/page.tsx # Sign in page
│   │   │   └── signup/page.tsx # Sign up page
│   │   └── layout.tsx          # Root layout (wraps all pages)
│   │
│   ├── components/             # Reusable UI components
│   │   ├── features/           # Feature-specific components
│   │   │   ├── chat/
│   │   │   │   └── ChatPageContent.tsx  # Main chat component
│   │   │   ├── map/
│   │   │   │   ├── RightMapPanel.tsx    # Map sidebar
│   │   │   │   └── GoogleMapComponent.tsx
│   │   │   └── auth/
│   │   │       ├── SignIn.tsx
│   │   │       └── SignUp.tsx
│   │   └── ui/                 # Generic UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── toast.tsx
│   │
│   ├── contexts/               # React Context (global state)
│   │   └── AuthContext.tsx     # Authentication state
│   │
│   ├── services/               # Business logic
│   │   ├── MapService.ts       # Map & WebSocket logic
│   │   └── ChatHistoryService.ts
│   │
│   ├── lib/                    # Utilities
│   │   └── api.ts              # API calls to backend
│   │
│   └── styles/
│       └── globals.css         # Global styles
│
├── public/                     # Static files
│   └── image/                  # Images
│
└── package.json                # Dependencies
```

---

### How Pages Work (Next.js App Router)

**File → URL Mapping:**
```
app/page.tsx              →  /
app/chat/page.tsx         →  /chat
app/auth/signin/page.tsx  →  /auth/signin
app/about/page.tsx        →  /about
```

**Example Page:**
```typescript
// app/chat/page.tsx
export default function ChatPage() {
  return (
    <div>
      <h1>Chat with AI</h1>
      <ChatPageContent />
    </div>
  );
}
```

---

### How Components Work (React)

**What is a Component?**
A reusable piece of UI, like a LEGO block.

**Example:**
```typescript
// Button component
function Button({ text, onClick }) {
  return (
    <button 
      className="bg-blue-500 text-white px-4 py-2"
      onClick={onClick}
    >
      {text}
    </button>
  );
}

// Use it anywhere:
<Button text="Send" onClick={handleSend} />
<Button text="Cancel" onClick={handleCancel} />
```

---

### How State Works (React)

**What is State?**
Data that can change over time.

**Example:**
```typescript
import { useState } from 'react';

function Counter() {
  // Create state variable
  const [count, setCount] = useState(0);
  
  // Update state
  const increment = () => {
    setCount(count + 1);  // This re-renders component
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

**Important:** When state changes, React re-renders the component!

---

### How We Talk to the Backend (API Calls)

**File:** `src/lib/api.ts`

**Example API Call:**
```typescript
// Function to send chat message
export const sendMessage = async (
  message: string,
  sessionId: string
): Promise<ChatResponse> => {
  // Make HTTP POST request to backend
  const response = await apiClient.post('/api/chat/call', {
    message,
    sessionId
  });
  
  return response.data;
};

// Use in component:
const handleSend = async () => {
  const response = await sendMessage("Hello AI", "session123");
  console.log(response.content); // AI's reply
};
```

**What Happens:**
1. JavaScript calls `sendMessage()`
2. Makes HTTP POST to `http://localhost:8080/api/chat/call`
3. Backend processes and responds
4. JavaScript gets response
5. Update UI with response

---

### How Authentication Works (Updated - Sprint 1)

#### Token Strategy: Two-Token System

**Why Two Tokens?**
We use two different tokens for better security:

1. **Access Token (Short-Lived)**
   - Type: JWT
   - Lifespan: 15 minutes
   - Storage: `localStorage` (needs JavaScript access for API calls)
   - Purpose: Authenticate API requests
   - Security: Short lifespan limits damage if stolen

2. **Refresh Token (Long-Lived)**
   - Type: Random UUID (stored in database)
   - Lifespan: 7 days
   - Storage: httpOnly cookie (browser-only, JavaScript can't access)
   - Purpose: Get new access tokens
   - Security: httpOnly prevents XSS attacks

**The Problem with Single Token:**
```typescript
// ❌ Current: Single 24hr token in localStorage
// Problem: If stolen via XSS, attacker has 24hr access
localStorage.setItem('token', 'eyJhbGci...');  // Vulnerable!
```

**Improved Approach:**
```typescript
// ✅ Improved: Short access token + secure refresh token
localStorage.setItem('accessToken', 'eyJ...');  // Only 15min if stolen
document.cookie = 'refreshToken=xyz; HttpOnly; Secure; SameSite=Strict';
// JavaScript can't read this → XSS protection ✅
```

---

#### Frontend Token Management

**Device Identification:**
```typescript
// Generate or retrieve device UUID for session restoration
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    // Generate new UUID for this device/browser
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
};
```

**Token Refresh Implementation:**
```typescript
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Check token expiration regularly
setInterval(() => {
  const token = getAccessToken();
  if (!token) return;
  
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  
  // Refresh when less than 5 minutes remaining
  if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
    refreshAccessToken();
  }
}, 60000); // Check every minute

const refreshAccessToken = async (): Promise<string> => {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Send httpOnly cookie
      });
      
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      
      const { accessToken } = await response.json();
      setAccessToken(accessToken);
      
      return accessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
};

// Axios interceptor for 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        router.push('/auth/signin');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

**Session Restoration:**
```typescript
// On app initialization
useEffect(() => {
  const restoreSession = async () => {
    const deviceId = getDeviceId();
    
    try {
      const response = await fetch(
        `/api/sessions/last?deviceId=${deviceId}`
      );
      
      if (response.ok) {
        const lastSession = await response.json();
        
        // Show restoration prompt
        const shouldRestore = await showRestorePrompt(lastSession);
        
        if (shouldRestore) {
          setCurrentSession(lastSession);
          const messages = await getSessionMessages(lastSession.sessionId);
          setMessages(messages);
          // User continues where they left off ✅
        }
      }
    } catch (error) {
      // No session to restore, start fresh
      console.log('No previous session found');
    }
  };
  
  restoreSession();
}, []);
```

---

#### Backend Token Management

**Backend Refresh Endpoint:**
```java
@PostMapping("/auth/refresh")
public ResponseEntity<TokenResponse> refreshToken(
    @CookieValue(name = "refreshToken", required = false) String refreshTokenValue,
    HttpServletResponse response
) {
    if (refreshTokenValue == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    
    try {
        // 1. Find refresh token in database
        RefreshToken refreshToken = refreshTokenRepository
            .findByToken(hashToken(refreshTokenValue))
            .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        
        // 2. Validate
        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // 3. Generate new access token
        String newAccessToken = jwtUtil.generateToken(refreshToken.getUserId());
        
        // 4. Generate new refresh token (rotation)
        String newRefreshTokenValue = UUID.randomUUID().toString();
        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setToken(hashToken(newRefreshTokenValue));
        newRefreshToken.setUserId(refreshToken.getUserId());
        newRefreshToken.setExpiresAt(Date.from(Instant.now().plus(7, ChronoUnit.DAYS)));
        refreshTokenRepository.save(newRefreshToken);
        
        // 5. Revoke old refresh token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        
        // 6. Set new refresh token cookie
        Cookie cookie = new Cookie("refreshToken", newRefreshTokenValue);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // HTTPS only
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        response.addCookie(cookie);
        
        // 7. Return new access token
        return ResponseEntity.ok(new TokenResponse(newAccessToken));
        
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
```

**Session Restoration Backend:**
```java
@GetMapping("/sessions/last")
public ResponseEntity<SessionDTO> getLastSession(@RequestParam String deviceId) {
    try {
        // Find device mapping
        Optional<GuestDeviceMapping> mapping = 
            guestDeviceMappingRepository.findByDeviceId(deviceId);
        
        if (mapping.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        GuestDeviceMapping deviceMapping = mapping.get();
        
        // Check if expired (>7 days)
        if (deviceMapping.getExpiresAt().before(new Date())) {
            return ResponseEntity.notFound().build();
        }
        
        // Get session
        Optional<Session> session = 
            sessionRepository.findById(deviceMapping.getLastSessionId());
        
        if (session.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(sessionMapper.toDTO(session.get()));
        
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

**⚠️ Important Changes from Current Implementation:**
1. **Removed**: Single token in localStorage (vulnerable to XSS)
2. **Added**: Two-token system with httpOnly cookies
3. **Added**: Device UUID for session restoration
4. **Added**: Automatic token refresh before expiration
5. **Added**: Session restoration after browser close

---

## Backend Architecture (How the Server Works)

### Folder Structure

```
AITravelPlannerBackEnd/
└── src/main/java/com/springboot/FlomadAIplanner/
    ├── controller/              # Handles HTTP requests
    │   ├── ChatController.java  # Chat endpoints
    │   └── AuthController.java  # Auth endpoints
    │
    ├── service/                 # Business logic
    │   ├── ChatCallService.java
    │   └── UserService.java
    │
    ├── model/
    │   ├── entities/            # Data models
    │   │   ├── User.java
    │   │   ├── Session.java
    │   │   └── Message.java
    │   └── repository/          # Database access
    │       ├── UserRepository.java
    │       └── MessageRepository.java
    │
    ├── ai/                      # AI-related code
    │   ├── functions/           # AI functions
    │   │   ├── AddLocationFunction.java
    │   │   └── FlightSearchFunction.java
    │   └── agents/              # AI agents
    │
    └── config/                  # Configuration
        ├── SecurityConfig.java
        └── WebSocketConfig.java
```

---

### The Three Layers (MVC Pattern)

**1. Controller Layer** (Handles requests)
```java
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    @PostMapping("/call")
    public String handleChat(@RequestBody AIMessageDTO message) {
        // 1. Receive request from frontend
        // 2. Call service layer
        // 3. Return response
        return chatService.processMessage(message);
    }
}
```

**2. Service Layer** (Business logic)
```java
@Service
public class ChatCallService {
    
    public String processMessage(AIMessageDTO message) {
        // 1. Validate message
        // 2. Call AI
        // 3. Save to database
        // 4. Return response
        return aiResponse;
    }
}
```

**3. Repository Layer** (Database access)
```java
@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    // Spring automatically implements these methods!
    List<Message> findBySessionId(String sessionId);
    void deleteBySessionId(String sessionId);
}
```

**How They Work Together:**
```
HTTP Request → Controller → Service → Repository → Database
                   ↓
HTTP Response ← Controller ← Service ← Repository ← Database
```

---

### How Spring Boot Works (Simplified)

**Dependency Injection (Magic!):**

```java
// Spring automatically creates and injects dependencies

@Service
public class ChatService {
    // Spring sees this and automatically provides MessageRepository
    private final MessageRepository messageRepo;
    
    // Constructor (Spring calls this)
    public ChatService(MessageRepository messageRepo) {
        this.messageRepo = messageRepo;  // Spring injects this
    }
    
    public void saveMessage(Message msg) {
        messageRepo.save(msg);  // We can use it now!
    }
}
```

**Why This is Cool:**
- You don't have to create objects manually
- Spring manages object lifecycle
- Easy to swap implementations for testing

---

### How AI Integration Works (Spring AI)

**The Magic: Function Calling**

```java
// 1. Define a function the AI can call
@Component("addLocationFunction")
@Description("Adds a location to the user's trip")
public class AddLocationFunction implements Function<LocationRequest, String> {
    
    @Override
    public String apply(LocationRequest request) {
        // This code runs when AI decides to add a location
        Location location = new Location();
        location.setName(request.getLocationName());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        
        locationRepository.save(location);
        
        return "Location added successfully!";
    }
}

// 2. AI automatically calls this when user says:
// "Add the Eiffel Tower to my trip"
```

**How It Works:**
1. User: "Add Eiffel Tower to my trip"
2. Spring AI tells OpenAI about available functions
3. OpenAI decides: "I should call addLocationFunction"
4. Spring AI executes `AddLocationFunction.apply()`
5. Function saves location to database
6. AI tells user: "I've added the Eiffel Tower to your trip!"

**Mind-Blowing, Right?** AI can trigger actual code!

---

### Available AI Functions

| Function | What It Does | When AI Calls It |
|----------|--------------|------------------|
| AddLocationFunction | Saves location to trip | User wants to add a place |
| RemoveLocationFunction | Removes location | User wants to remove a place |
| FlightSearchFunction | Searches for flights | User asks about flights |
| HotelsSearchFunction | Searches for hotels | User asks about hotels |
| EmergencyAssistanceFunction | Provides emergency help | User has emergency |
| BudgetOptimizationFunction | Gives money-saving tips | User mentions budget |

---

### Database Schema (MongoDB Collections)

**What is a Collection?**
Like a table in SQL, but stores JSON-like documents.

**Our Collections:**

**1. users**
```javascript
{
  "_id": "user123",
  "username": "sarah",
  "email": "sarah@example.com",
  "password": "$2a$10$hashed...",  // Encrypted!
  "roles": ["ROLE_USER"],
  "createdAt": "2025-10-22T10:00:00Z"
}
```

**2. sessions**
```javascript
{
  "_id": "session123",
  "sessionId": "abc-123-def",
  "userId": "user123",
  "title": "Paris Trip",
  "createdAt": "2025-10-22T11:00:00Z",
  "updatedAt": "2025-10-22T12:00:00Z"
}
```

**3. messages**
```javascript
{
  "_id": "msg123",
  "sessionId": "session123",
  "messageType": "USER",  // or "ASSISTANT"
  "content": "I want to visit Paris",
  "createdAt": "2025-10-22T11:05:00Z"
}
```

**4. locations**
```javascript
{
  "_id": "loc123",
  "sessionId": "session123",
  "name": "Eiffel Tower",
  "latitude": 48.8584,
  "longitude": 2.2945,
  "type": "attraction",
  "createdAt": "2025-10-22T11:10:00Z"
}
```

---

### How WebSocket Works (Real-Time Updates)

**What is WebSocket?**
Two-way communication channel (unlike HTTP which is request-response).

**Why We Need It:**
When AI adds a location, the map should update INSTANTLY without refreshing the page.

**How It Works:**

```
Frontend                          Backend
   │                                 │
   │  1. Connect to WebSocket        │
   ├────────────────────────────────>│
   │  2. Subscribe to session topic  │
   ├────────────────────────────────>│
   │                                 │
   │                    3. AI adds location
   │                    4. Save to database
   │                                 │
   │  5. Send "location added" event │
   │<─────────────────────────────────┤
   │  6. Update map instantly         │
   │                                 │
```

**Backend Code:**
```java
@Controller
public class WebSocketController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public void notifyLocationAdded(String sessionId, Location location) {
        // Send message to all clients subscribed to this session
        messagingTemplate.convertAndSend(
            "/topic/" + sessionId,
            new LocationAddedEvent(location)
        );
    }
}
```

**Frontend Code:**
```typescript
// Connect to WebSocket
const client = new Client({
  brokerURL: 'ws://localhost:8080/ws'
});

// Subscribe to session updates
client.subscribe(`/topic/${sessionId}`, (message) => {
  const event = JSON.parse(message.body);
  
  if (event.type === 'LOCATION_ADDED') {
    // Add marker to map instantly!
    addMarkerToMap(event.location);
  }
});
```

---

## API Endpoints (What You Can Call)

### Authentication Endpoints

**POST /api/auth/signup**
- **What it does:** Create new user account
- **Request:**
```json
{
  "username": "sarah",
  "email": "sarah@example.com",
  "password": "MyPassword123"
}
```
- **Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "user123",
    "username": "sarah"
  }
}
```

---

**POST /api/auth/signin**
- **What it does:** Log in existing user
- **Request:**
```json
{
  "username": "sarah",
  "password": "MyPassword123"
}
```
- **Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "user123",
    "username": "sarah"
  }
}
```

---

### Chat Endpoints

**POST /api/chat/call**
- **What it does:** Send message to AI and get response
- **Request:**
```json
{
  "message": "I want to visit Paris",
  "sessionId": "session123"
}
```
- **Response:**
```json
{
  "content": "Paris is beautiful! When are you planning to go?"
}
```

---

### Session Endpoints

**POST /sessions**
- **What it does:** Create new trip session
- **Request:**
```json
{
  "title": "Paris Trip",
  "userId": "user123"
}
```
- **Response:**
```json
{
  "sessionId": "session123",
  "title": "Paris Trip",
  "userId": "user123",
  "createdAt": "2025-10-22T11:00:00Z"
}
```

---

**GET /sessions/user-sessions?userId=user123**
- **What it does:** Get all trips for a user
- **Response:**
```json
[
  {
    "sessionId": "session123",
    "title": "Paris Trip",
    "createdAt": "2025-10-22T11:00:00Z"
  },
  {
    "sessionId": "session456",
    "title": "Tokyo Trip",
    "createdAt": "2025-10-21T10:00:00Z"
  }
]
```

---

### Location Endpoints

**GET /api/locations/{sessionId}**
- **What it does:** Get all locations for a trip
- **Response:**
```json
[
  {
    "id": "loc123",
    "name": "Eiffel Tower",
    "latitude": 48.8584,
    "longitude": 2.2945,
    "type": "attraction"
  }
]
```

---

## Common Patterns & Pitfalls

### Pattern 1: Async/Await (JavaScript/TypeScript)

**What is it?**
Way to handle asynchronous operations (like API calls).

**Example:**
```typescript
// ❌ WRONG - This won't work!
function getData() {
  const response = apiClient.get('/data');  // Returns Promise, not data!
  return response.data;  // ❌ response.data is undefined
}

// ✅ CORRECT - Use async/await
async function getData() {
  const response = await apiClient.get('/data');  // Wait for response
  return response.data;  // ✅ Now response has data
}

// Use it:
const data = await getData();  // Must also use await!
```

**Common Mistake:**
Forgetting to `await` = Getting a Promise instead of the actual value!

---

### Pattern 2: Try-Catch (Error Handling)

**What is it?**
Way to handle errors gracefully.

**Example:**
```typescript
// ❌ WRONG - No error handling
async function sendMessage(message) {
  const response = await api.post('/chat', { message });
  return response.data;
  // If API fails, app crashes!
}

// ✅ CORRECT - Handle errors
async function sendMessage(message) {
  try {
    const response = await api.post('/chat', { message });
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    toast.error('Could not send message. Please try again.');
    return null;
  }
}
```

---

### Pattern 3: Optional Chaining (Safe Access)

**What is it?**
Safely access nested properties that might not exist.

**Example:**
```typescript
// ❌ WRONG - Can crash if user or user.profile is null
const name = user.profile.name;

// ✅ CORRECT - Use optional chaining
const name = user?.profile?.name;
// If user is null → name is undefined (no crash)
// If user.profile is null → name is undefined (no crash)

// Even better with default value:
const name = user?.profile?.name ?? 'Anonymous';
```

---

### Pitfall 1: State Mutation (React)

**❌ WRONG - Mutating state directly:**
```typescript
const [items, setItems] = useState([1, 2, 3]);

// ❌ This doesn't work!
items.push(4);  // Mutating state directly
setItems(items);  // React won't detect the change!
```

**✅ CORRECT - Create new array:**
```typescript
const [items, setItems] = useState([1, 2, 3]);

// ✅ Create new array
setItems([...items, 4]);  // Spread operator creates new array
```

---

### Pitfall 2: Forgetting Dependencies (useEffect)

**❌ WRONG:**
```typescript
useEffect(() => {
  fetchData(userId);  // Uses userId
}, []);  // ❌ Missing userId in dependencies!
// If userId changes, fetchData won't run!
```

**✅ CORRECT:**
```typescript
useEffect(() => {
  fetchData(userId);  // Uses userId
}, [userId]);  // ✅ Include userId in dependencies
// Now runs when userId changes!
```

---

## Environment Variables

### What Are They?

Settings that change based on where the code runs (local computer vs production server).

**Examples:**
- API URL: `http://localhost:8080` (local) vs `https://api.flomadtravel.com` (production)
- API Keys: Different keys for testing vs production
- Database URL: Local MongoDB vs MongoDB Atlas

---

### Frontend Environment Variables

**File:** `.env.local` (NOT committed to Git!)

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Note: NEXT_PUBLIC_ prefix makes it available in browser
```

**How to Use:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
// On local: "http://localhost:8080"
// On production: "https://api.flomadtravel.com"
```

---

### Backend Environment Variables

**File:** `.env` or `application.properties`

```properties
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017/travelapp

# OpenAI API Key
SPRING_AI_OPENAI_API_KEY=sk-...

# JWT Secret
JWT_SECRET=your-secret-key-here

# Server Port
SERVER_PORT=8080
```

**⚠️ NEVER commit .env files to Git!**
Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

---

## Testing

### What is Testing?

Writing code that checks if your code works correctly.

**Why Test?**
- Catch bugs before users do
- Confidence when changing code
- Documentation of how code should work

---

### Unit Tests (Test One Thing)

**Example - Testing a function:**
```typescript
// Function to test
function add(a: number, b: number): number {
  return a + b;
}

// Test
test('add function adds two numbers', () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
  expect(add(0, 0)).toBe(0);
});
```

---

### Component Tests (Test React Components)

**Example:**
```typescript
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('button shows correct text', () => {
  render(<Button text="Click me" onClick={() => {}} />);
  
  const button = screen.getByText('Click me');
  expect(button).toBeInTheDocument();
});

test('button calls onClick when clicked', () => {
  const handleClick = jest.fn();  // Mock function
  render(<Button text="Click" onClick={handleClick} />);
  
  const button = screen.getByText('Click');
  button.click();
  
  expect(handleClick).toHaveBeenCalled();
});
```

---

## Deployment

### Frontend Deployment (Vercel)

**What is Vercel?**
Platform that hosts Next.js apps (very easy!).

**How It Works:**
1. Push code to GitHub
2. Vercel detects changes
3. Automatically builds and deploys
4. Live in ~2 minutes!

**Setup:**
1. Connect GitHub repo to Vercel
2. Configure environment variables in Vercel dashboard
3. Every push to `main` branch deploys automatically

---

### Backend Deployment (AWS EC2)

**What is EC2?**
Virtual computer in Amazon's cloud.

**How It Works:**
1. Build JAR file: `mvn clean package`
2. Upload JAR to EC2 server
3. Run: `java -jar app.jar`

**Better Way: Use systemd**
Create service that auto-starts on boot.

---

## Common Troubleshooting

### Issue: "Module not found"

**Cause:** Missing dependency or wrong import path

**Fix:**
```bash
# Frontend
pnpm install

# Backend
mvn clean install
```

---

### Issue: "Cannot connect to database"

**Cause:** MongoDB not running or wrong connection string

**Fix:**
1. Check MongoDB is running: `mongo --version`
2. Check connection string in `.env`
3. Try connecting with MongoDB Compass

---

### Issue: "CORS error"

**Cause:** Frontend and backend on different ports, browser blocks request

**Example Error:**
```
Access to fetch at 'http://localhost:8080' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Fix:**
Backend must allow frontend origin (already configured in our CorsConfig.java)

---

### Issue: "Token expired"

**Cause:** JWT token has expiration time (24 hours)

**Fix:**
1. Sign in again
2. Or implement token refresh (Sprint 1 task)

---

## Glossary (Simple Definitions)

**API** = Application Programming Interface - way for programs to talk to each other

**Async/Await** = Way to handle operations that take time (like API calls)

**Component** = Reusable piece of UI in React

**CORS** = Cross-Origin Resource Sharing - security feature in browsers

**Dependency** = External code library we use (npm package, Maven dependency)

**Endpoint** = URL path that accepts HTTP requests (like `/api/chat/call`)

**Environment Variable** = Configuration value that changes based on where code runs

**Function** = Reusable block of code that does one thing

**HTTP** = Protocol browsers use to communicate with servers (GET, POST, etc.)

**JSON** = JavaScript Object Notation - way to structure data

**JWT** = JSON Web Token - way to handle authentication

**MongoDB** = NoSQL database that stores data as JSON-like documents

**Props** = Data passed to React components

**Repository** = Class that handles database operations

**REST API** = Type of API that uses HTTP methods (GET, POST, PUT, DELETE)

**State** = Data that changes over time in a component

**TypeScript** = JavaScript with type checking

**WebSocket** = Two-way communication channel for real-time updates

---

## Next Steps

**After Reading This:**
1. Set up your development environment
2. Run the app locally
3. Make a small change and see it work
4. Read the codebase starting with a simple page
5. Ask questions when stuck!

**Other Documents to Read:**
- `SprintBreakdown.md` - What to build in each sprint
- `Architecture.md` - System design overview
- `FunctionalSpecification.md` - What the app does from user perspective

---

**Remember:** Everyone was a beginner once. Ask questions, experiment, and learn by doing!

**Stuck?** Ask the team on Slack/Discord. We're here to help! 🚀
