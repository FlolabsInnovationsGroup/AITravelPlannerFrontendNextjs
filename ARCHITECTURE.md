# AI Travel Planner - Architecture Documentation

## Table of Contents
1. [Streaming Chat Architecture](#streaming-chat-architecture)
2. [Map Features](#map-features)
3. [WebSocket Connection Management](#websocket-connection-management)
4. [Offline Queue System](#offline-queue-system)
5. [Performance Monitoring](#performance-monitoring)
6. [Error Handling Strategies](#error-handling-strategies)

---

## Streaming Chat Architecture

### Overview
The streaming chat system provides ChatGPT-style progressive message rendering using Server-Sent Events (SSE) over ReadableStream API.

### Key Components

#### useStreamingChat Hook
Location: `src/hooks/useStreamingChat.ts`

**Features:**
- Real-time streaming with ReadableStream API
- Optimistic UI updates for instant user feedback
- Error recovery and retry logic
- Stream cancellation support
- Message history management

**API:**
```typescript
const {
  messages,          // Message array with full history
  isStreaming,       // Current streaming state
  sendMessage,       // Send message and stream response
  cancelStream,      // Cancel active stream
  clearMessages      // Reset message history
} = useStreamingChat({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  sessionId: session.id,
  onError: (error) => toast.error(error.message),
  onComplete: () => console.log('Stream complete')
});
```

**Message Flow:**
1. User sends message → optimistically added to UI
2. API request initiated with AbortController for cancellation
3. ReadableStream reader processes SSE chunks
4. Each chunk parsed as JSON and content extracted
5. Assistant message updated incrementally
6. Stream completion triggers onComplete callback

### Testing Strategy
Location: `src/hooks/__tests__/useStreamingChat.test.ts`

**12 comprehensive test cases covering:**
- Hook initialization with default state
- Message sending and streaming
- Chunk accumulation and processing
- Stream cancellation
- Error recovery after failures
- Malformed JSON handling
- Connection state management
- Message history management

**Test Coverage:**
- TextEncoder/TextDecoder polyfills for Node environment
- Mock ReadableStream API
- Simulated network errors and failures
- Async state updates with act() and waitFor()

---

## Map Features

### Marker Clustering
Location: `src/components/features/map/EnhancedGoogleMap.tsx`

**Implementation:**
```typescript
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';

const clustererRef = useRef<MarkerClusterer>();

// Initialize clustering for 5+ markers
if (markers.length >= 5) {
  clustererRef.current = new MarkerClusterer({
    map: mapInstance,
    markers,
    algorithm: new SuperClusterAlgorithm({ radius: 120, maxZoom: 15 }),
    renderer: customClusterRenderer
  });
}
```

**Cluster Styling:**
- Blue gradient based on marker count
- 10+ markers: #3B82F6 (60px)
- 6-10 markers: #60A5FA (50px)
- ≤5 markers: #93C5FD (40px)

**Performance:**
- Activates only for 5+ locations
- SuperClusterAlgorithm for efficient spatial indexing
- Cleanup on unmount to prevent memory leaks

### Directions & Route Visualization

#### DirectionsPanel Component
Location: `src/components/features/map/DirectionsPanel.tsx`

**Features:**
- Turn-by-turn navigation display
- Distance and duration per step
- Route warnings and summaries
- Scrollable steps with visual indicators

**Route Data Structure:**
```typescript
interface RouteInfo {
  origin: string;
  destination: string;
  totalDistance: string;
  totalDuration: string;
  steps: DirectionStep[];
  warnings?: string[];
  summary?: string;
}
```

#### useDirections Hook
Location: `src/hooks/useDirections.ts`

**Backend Integration:**
```typescript
const { routeInfo, loading, error, fetchDirections } = useDirections();

await fetchDirections(origin, destination, 'driving');
```

#### Route Visualization
Location: `src/components/features/map/EnhancedGoogleMap.tsx`

**DirectionsRenderer Integration:**
```typescript
// Custom polyline styling
const polylineOptions = {
  strokeColor: '#4285F4',  // Google Maps blue
  strokeWeight: 5,
  strokeOpacity: 0.8
};

directionsRenderer.setOptions({
  suppressMarkers: true,    // Use custom markers
  polylineOptions
});
```

**Automatic Rendering:**
- useEffect monitors routeData changes
- DirectionsService calculates route
- DirectionsRenderer displays polyline
- onRouteRendered callback for result handling

---

## WebSocket Connection Management

### Enhanced WebSocket System
Location: `src/hooks/useEnhancedWebSocket.ts`

**Features:**
- Automatic reconnection (up to 10 attempts)
- Heartbeat monitoring (25-second interval)
- Connection metrics tracking
- Exponential backoff for reconnection
- Session-based topic subscriptions

**Connection States:**
```typescript
type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed';
```

**Metrics Tracked:**
```typescript
interface ConnectionMetrics {
  reconnectAttempts: number;
  lastReconnectTime: Date | null;
  totalReconnections: number;
  uptime: number;  // Milliseconds
}
```

**Heartbeat Pattern:**
```typescript
// Send heartbeat every 25 seconds
const heartbeatInterval = setInterval(() => {
  if (client.connected) {
    client.send('/app/heartbeat', {}, JSON.stringify({
      sessionId,
      timestamp: Date.now()
    }));
  }
}, 25000);
```

### Real-time Location Synchronization
**Session-based topics:**
```
/topic/locations/{sessionId}
```

**Event Types:**
- `LOCATION_ADDED`: New location added to map
- `LOCATION_REMOVED`: Location deleted from map
- `MAP_CLEARED`: All locations cleared

**Event Structure:**
```typescript
interface LocationEvent {
  type: 'LOCATION_ADDED' | 'LOCATION_REMOVED' | 'MAP_CLEARED';
  payload: LocationData;
  sessionId: string;
  timestamp: Instant;
}
```

---

## Offline Queue System

### Architecture
Three-layer system for offline resilience:

#### 1. OfflineMessageQueue Service
Location: `src/services/OfflineMessageQueue.ts`

**Features:**
- localStorage persistence
- 50-message queue limit
- 3-retry maximum per message
- Automatic queue cleanup

**Queue Structure:**
```typescript
interface QueuedMessage {
  id: string;               // Unique identifier
  content: string;          // Message content
  timestamp: number;        // Enqueue time
  retryCount: number;       // Retry attempts
  sessionId: string;        // Session context
  metadata?: {              // Optional metadata
    priority?: 'high' | 'normal';
    tags?: string[];
  };
}
```

**Statistics Tracking:**
```typescript
interface QueueStats {
  totalQueued: number;      // All-time queued count
  totalSent: number;        // Successfully sent
  totalFailed: number;      // Failed after max retries
  lastQueueTime: Date | null;
  lastSendTime: Date | null;
}
```

#### 2. useOfflineQueue Hook
Location: `src/hooks/useOfflineQueue.ts`

**Auto-send on reconnection:**
```typescript
const { queuedMessages, queueSize, stats, isSending } = useOfflineQueue({
  sessionId,
  autoSendOnReconnect: true  // Send when online
});
```

**Sequential Sending:**
```typescript
// Maintains message order
for (const message of messages) {
  await sendMessage(message.content);
  markAsSent(message.id);
}
```

#### 3. OfflineQueueIndicator Component
Location: `src/components/features/chat/OfflineQueueIndicator.tsx`

**UI Features:**
- Connection status header (green/yellow)
- Queued message list with timestamps
- Retry count display (e.g., "Retry 2/3")
- Manual send/clear actions
- Hidden when online and empty

**Visual States:**
```typescript
// Online: Green background
<div className="bg-green-50 border-green-200">
  <div className="flex items-center gap-2">
    <Wifi className="w-4 h-4 text-green-600" />
    <span>Online</span>
  </div>
</div>

// Offline: Yellow background
<div className="bg-yellow-50 border-yellow-200">
  <div className="flex items-center gap-2">
    <WifiOff className="w-4 h-4 text-yellow-600" />
    <span>Offline - {queueSize} queued</span>
  </div>
</div>
```

### Online Status Detection
Location: `src/hooks/useOnlineStatus.ts`

**Browser API Integration:**
```typescript
const isOnline = window.navigator.onLine;

window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
```

**Reconnection Trigger:**
```typescript
useEffect(() => {
  if (isOnline && wasOffline && autoSendOnReconnect) {
    sendQueuedMessages();  // Send all queued messages
  }
}, [isOnline, wasOffline]);
```

---

## Performance Monitoring

### PerformanceMonitor Service
Location: `src/services/PerformanceMonitor.ts`

**Comprehensive Metrics:**
```typescript
interface PerformanceMetrics {
  // Latency (milliseconds)
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;        // 95th percentile
  p99Latency: number;        // 99th percentile
  
  // Chunk Processing
  averageChunkProcessingTime: number;
  totalChunksProcessed: number;
  chunksPerSecond: number;
  
  // Error Tracking
  totalErrors: number;
  errorRate: number;         // Percentage
  errorsByType: Record<string, number>;
  
  // Connection Health
  totalReconnections: number;
  reconnectionRate: number;  // Per hour
  averageReconnectionTime: number;
  connectionUptime: number;  // Percentage
  
  // Message Success
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  messageSuccessRate: number;
}
```

**Data Retention:**
- 24-hour sliding window
- Max 1000 measurements per metric
- Automatic cleanup of old data

**Persistence:**
```typescript
// Auto-save to localStorage
localStorage.setItem('performance_metrics', JSON.stringify({
  latencyMeasurements,
  errorEvents,
  reconnectionEvents,
  messageEvents,
  chunkProcessingTimes,
  monitoringStartTime,
  totalDowntime
}));
```

### usePerformanceMonitor Hook
Location: `src/hooks/usePerformanceMonitor.ts`

**Auto-refresh capability:**
```typescript
const { metrics, recordLatency, recordError } = usePerformanceMonitor({
  updateInterval: 5000,      // 5-second refresh
  autoRefresh: true
});

// Record performance data
recordLatency(150);  // 150ms latency
recordError('network', 'Connection timeout');
recordReconnection(2500);  // 2.5s to reconnect
```

### PerformanceDashboard Component
Location: `src/components/features/chat/PerformanceDashboard.tsx`

**Display Modes:**

**Compact Mode** (for sidebar):
```tsx
<PerformanceDashboard compact={true} updateInterval={3000} />
```
- 2x2 grid of key metrics
- Minimal space usage
- Color-coded status indicators

**Full Mode** (for dedicated view):
```tsx
<PerformanceDashboard compact={false} />
```
- Comprehensive metric sections
- Export to JSON functionality
- Reset metrics capability
- Error grouping by type
- Timestamp tracking

**Color Coding:**
- 🟢 Green: Good performance (latency <1000ms, uptime >99%, no errors)
- 🟡 Yellow: Warning state (moderate issues)
- 🔴 Red: Critical state (high latency, errors present)
- 🔵 Blue: Informational (neutral metrics)

---

## Error Handling Strategies

### Streaming Chat Errors

**Network Failures:**
```typescript
try {
  const response = await fetch(apiUrl, { signal: abortController.signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Stream cancelled by user');
  } else {
    onError?.(error);
    setErrorState(error.message);
  }
}
```

**Malformed JSON Chunks:**
```typescript
try {
  const data = JSON.parse(chunkText);
  const content = data.content || '';
  accumulatedContent += content;
} catch (parseError) {
  console.warn('Invalid JSON chunk:', chunkText);
  // Continue processing other chunks
}
```

**Stream Timeout:**
```typescript
const timeoutId = setTimeout(() => {
  abortController.abort();
  onError?.(new Error('Stream timeout'));
}, 30000);  // 30-second timeout
```

### WebSocket Errors

**Connection Loss:**
```typescript
client.onStompError = (frame) => {
  console.error('STOMP error:', frame);
  setConnectionState('failed');
  
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    setTimeout(() => reconnect(), delay);
  }
};
```

**Reconnection Strategy:**
- Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (max)
- Max 10 attempts before giving up
- User notification on connection state changes

### Offline Queue Errors

**localStorage Full:**
```typescript
try {
  localStorage.setItem('offline_message_queue', JSON.stringify(queue));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Remove oldest messages to make space
    queue.shift();
    retry();
  }
}
```

**Message Send Failure:**
```typescript
try {
  await sendMessage(message.content);
  markAsSent(message.id);
} catch (error) {
  if (message.retryCount < MAX_RETRY_COUNT) {
    message.retryCount++;
    // Keep in queue for retry
  } else {
    markAsFailed(message.id);
    console.error('Message failed after max retries:', message);
  }
}
```

### Map Integration Errors

**Google Maps API Failure:**
```typescript
if (!window.google?.maps) {
  console.error('Google Maps API not loaded');
  showFallbackUI();
  return;
}
```

**Directions API Error:**
```typescript
directionsService.route(request, (result, status) => {
  if (status === 'OK') {
    directionsRenderer.setDirections(result);
  } else {
    console.error('Directions request failed:', status);
    showErrorMessage(`Route calculation failed: ${status}`);
  }
});
```

**Marker Clustering Error:**
```typescript
try {
  clustererRef.current = new MarkerClusterer({...});
} catch (error) {
  console.warn('Clustering initialization failed, showing individual markers');
  // Fallback to unclustered markers
  markers.forEach(marker => marker.setMap(mapInstance));
}
```

---

## Best Practices

### Performance
1. **Lazy Load Components**: Use React.lazy() for heavy components
2. **Memoization**: useMemo() for expensive calculations
3. **Debounce User Input**: Prevent excessive API calls
4. **Cleanup Effects**: Always clear intervals/timeouts in useEffect

### Security
1. **JWT Validation**: All API requests include Bearer token
2. **Input Sanitization**: Validate all user inputs
3. **Rate Limiting**: Backend enforces rate limits
4. **CORS Configuration**: Whitelist specific origins

### Testing
1. **Unit Tests**: Test hooks and utilities in isolation
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Validate full user workflows
4. **Mock External Dependencies**: Use jest.mock() for APIs

### Code Organization
1. **Feature-based Structure**: Group related components
2. **Shared Services**: Singleton pattern for services
3. **Type Safety**: Comprehensive TypeScript types
4. **Documentation**: JSDoc comments on public APIs

---

## Future Enhancements

### Planned Features
1. **Voice Messages**: WebRTC integration for audio chat
2. **Message Reactions**: Like, bookmark, share functionality
3. **Advanced Clustering**: Heatmaps for location density
4. **Collaborative Planning**: Multi-user session support
5. **AI Context Memory**: Long-term conversation persistence

### Performance Optimizations
1. **Service Worker**: Offline-first PWA architecture
2. **IndexedDB**: Replace localStorage for large datasets
3. **WebSocket Compression**: Reduce bandwidth usage
4. **Code Splitting**: Route-based lazy loading
5. **CDN Integration**: Serve static assets globally

---

*Last Updated: 2025-11-17*
*Documentation Version: 1.0.0*
