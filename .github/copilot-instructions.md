# AI Travel Planner Frontend - AI Development Guide

This is a Next.js 14 frontend for an AI-powered travel planning application with real-time map integration and WebSocket communication.

## Architecture Overview

**Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Google Maps API, WebSocket (STOMP)
**State Management**: React Context for auth (`AuthContext`), direct API calls with axios interceptors
**Backend Integration**: Spring Boot API at `NEXT_PUBLIC_API_URL`, MongoDB for persistence

### Key Service Boundaries
- **Authentication**: Guest token system with auto-refresh in `src/lib/api.ts` - handles 401s transparently
- **Chat System**: Real-time messaging through `ChatPageContent.tsx` with session management
- **Map Integration**: Google Maps with clustering, location extraction from chat, real-time sync via WebSocket
- **Location Services**: Multiple specialized services in `src/services/` for different map operations

## Critical Patterns & Conventions

### Authentication Flow
```typescript
// Guest users get auto-created tokens, full users via OAuth
const token = getToken() || await createGuestToken();
// All API calls include auto-refreshing bearer tokens via axios interceptors
```

### Map System Integration
The map system is **production-ready** and fully documented in `Documentation/COMPLETE_MAP_SYSTEM_GUIDE.md`. Key files:
- `GoogleMapComponent.tsx` - Main map with clustering and place enrichment
- `MapService.ts` - WebSocket client for real-time location sync
- `LocationExtractionService.ts` - Extracts locations from AI chat responses

### Component Structure
- Feature-based organization: `src/components/features/{auth,chat,landing,map}/`
- Shared UI components from shadcn/ui in `src/components/ui/`
- Each feature has self-contained logic with proper service injection

### API Communication
```typescript
// Centralized API client with token management
const apiClient = axios.create({ baseURL: API_BASE_URL });
// Auto-retry on 401 with guest token refresh
apiClient.interceptors.response.use(/* token refresh logic */);
```

## Development Workflows

### Environment Setup
```bash
pnpm install                    # Use pnpm (defined in package.json)
pnpm check-env                 # Validates required env vars
pnpm dev                       # Development with NODE_ENV=development
```

### Testing
```bash
pnpm test                      # Jest with jsdom environment
pnpm test:watch               # Watch mode for TDD
```

### Build Commands
```bash
pnpm build                     # Production build (--no-lint flag set)
pnpm start                     # Production server
```

## Integration Points

### Backend Communication
- REST API: Authentication, sessions, location CRUD via `src/lib/api.ts`
- WebSocket: Real-time map updates via STOMP over SockJS in `MapService.ts`
- Error Handling: Centralized in API client with user-friendly toast notifications

### Google Maps Integration
- Libraries loaded: `["places", "geocoding"]` in `GoogleMapComponent.tsx`
- Place enrichment through Google Places API for detailed location info
- Marker clustering for performance with large location sets

### Real-time Features
- WebSocket connection per chat session for map synchronization
- Location extraction from AI responses triggers map updates
- Session management with automatic reconnection logic

## Project-Specific Considerations

- **Windows Development**: Scripts use `set NODE_ENV=` syntax for Windows PowerShell
- **ESLint Disabled**: Build ignores linting (`ignoreDuringBuilds: true`) for deployment speed
- **Guest User System**: No registration required - auto-creates guest tokens for immediate usage
- **Mobile Optimization**: Responsive design with collapsible panels and touch-friendly controls

## Key Files to Reference
- `src/lib/api.ts` - API client setup and token management
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/components/features/chat/ChatPageContent.tsx` - Main chat interface
- `Documentation/COMPLETE_MAP_SYSTEM_GUIDE.md` - Comprehensive map system documentation
