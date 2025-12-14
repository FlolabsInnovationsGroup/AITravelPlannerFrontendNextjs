/**
 * k6 Load Test: WebSocket Connections
 * 
 * Tests WebSocket connection stability under high load with real-time
 * location synchronization events.
 * 
 * Target Performance:
 * - Support 1,000+ concurrent WebSocket connections
 * - Message delivery < 500ms
 * - Connection success rate > 99%
 * - Reconnection works within 5 seconds
 * 
 * Usage:
 *   k6 run tests/load/websocket-load.js
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
const wsConnections = new Counter('websocket_connections');
const wsMessages = new Counter('websocket_messages');
const wsMessageLatency = new Trend('websocket_message_latency');
const wsErrorRate = new Rate('websocket_errors');

// Test configuration
export const options = {
  // Gradually ramp up WebSocket connections
  stages: [
    { duration: '30s', target: 50 },     // Warm up: 50 connections
    { duration: '1m', target: 250 },     // Ramp up: 250 connections
    { duration: '1m', target: 500 },     // Increase: 500 connections
    { duration: '1m', target: 1000 },    // Peak: 1,000 connections
    { duration: '5m', target: 1000 },    // Sustain: 1,000 connections for 5 minutes
    { duration: '1m', target: 500 },     // Ramp down
    { duration: '1m', target: 0 },       // Cool down
  ],
  
  thresholds: {
    'websocket_message_latency': ['p(95)<500', 'p(99)<1000'], // Message delivery < 500ms
    'websocket_errors': ['rate<0.01'],                         // Error rate < 1%
    'websocket_connections': ['count>900'],                    // At least 900 successful connections
  },
};

// Environment variables
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080/ws';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test_token_for_load_testing';

// Simulate location data for map synchronization
function generateLocation(sessionId) {
  return {
    type: 'LOCATION_ADDED',
    sessionId: sessionId,
    payload: {
      name: `Location ${randomString(8)}`,
      lat: 40.7128 + (Math.random() - 0.5) * 0.1, // NYC area
      lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      type: 'hotel',
      rating: 4.0 + Math.random(),
    },
    timestamp: new Date().toISOString(),
  };
}

export default function () {
  const sessionId = `ws-load-test-${__VU}-${Date.now()}`;
  const url = `${WS_URL}?token=${AUTH_TOKEN}`;
  
  // Track connection metrics
  let messagesReceived = 0;
  let messagesSent = 0;
  
  const res = ws.connect(url, {}, function (socket) {
    wsConnections.add(1);
    
    socket.on('open', function () {
      console.log(`VU ${__VU}: WebSocket connected - Session ${sessionId}`);
      
      // Subscribe to session-specific location updates
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        destination: `/topic/locations/${sessionId}`,
      }));
      
      // Send periodic location updates (every 5-15 seconds)
      socket.setInterval(function () {
        const location = generateLocation(sessionId);
        const sendTime = Date.now();
        
        socket.send(JSON.stringify(location));
        messagesSent++;
        wsMessages.add(1);
        
        console.log(`VU ${__VU}: Sent location ${location.payload.name}`);
      }, Math.random() * 10000 + 5000);
      
      // Keep connection alive for a realistic session duration (30-120 seconds)
      const sessionDuration = Math.random() * 90000 + 30000;
      socket.setTimeout(function () {
        console.log(`VU ${__VU}: Session ${sessionId} ending after ${(sessionDuration/1000).toFixed(1)}s`);
        socket.close();
      }, sessionDuration);
    });
    
    socket.on('message', function (data) {
      const receiveTime = Date.now();
      messagesReceived++;
      
      try {
        const message = JSON.parse(data);
        
        // Calculate message latency (if timestamp present)
        if (message.timestamp) {
          const sentTime = new Date(message.timestamp).getTime();
          const latency = receiveTime - sentTime;
          wsMessageLatency.add(latency);
          
          console.log(`VU ${__VU}: Received ${message.type} - Latency: ${latency}ms`);
        }
        
        // Verify message structure
        check(message, {
          'has type': (m) => m.type !== undefined,
          'has sessionId': (m) => m.sessionId !== undefined,
        });
        
      } catch (error) {
        console.error(`VU ${__VU}: Failed to parse message:`, error);
        wsErrorRate.add(1);
      }
    });
    
    socket.on('close', function () {
      console.log(`VU ${__VU}: WebSocket closed - Sent: ${messagesSent}, Received: ${messagesReceived}`);
    });
    
    socket.on('error', function (error) {
      console.error(`VU ${__VU}: WebSocket error:`, error);
      wsErrorRate.add(1);
    });
    
    socket.on('ping', function () {
      console.log(`VU ${__VU}: Received ping`);
      socket.pong();
    });
    
    socket.on('pong', function () {
      console.log(`VU ${__VU}: Received pong`);
    });
  });
  
  // Verify connection established
  check(res, {
    'WebSocket connected': (r) => r && r.status === 101,
  });
  
  if (res.status !== 101) {
    wsErrorRate.add(1);
    console.error(`VU ${__VU}: Failed to connect - Status: ${res.status}`);
  }
  
  // Realistic think time between connection attempts
  sleep(Math.random() * 5 + 1);
}

export function setup() {
  console.log('🔌 Starting WebSocket Load Test');
  console.log(`   WebSocket URL: ${WS_URL}`);
  console.log(`   Target: 1,000 concurrent connections`);
  console.log(`   Duration: ~10 minutes`);
  console.log(`   Session duration: 30-120 seconds per connection`);
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ WebSocket Load Test Complete`);
  console.log(`   Total duration: ${duration.toFixed(2)} seconds`);
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. Basic WebSocket load test (default):
 *    k6 run tests/load/websocket-load.js
 * 
 * 2. Quick smoke test (10 connections, 30 seconds):
 *    k6 run --vus 10 --duration 30s tests/load/websocket-load.js
 * 
 * 3. Stress test (2,000 connections):
 *    k6 run --stage 1m:100,2m:1000,2m:2000,3m:2000,1m:0 tests/load/websocket-load.js
 * 
 * 4. With custom WebSocket URL:
 *    WS_URL=wss://api.flomad.ai/ws k6 run tests/load/websocket-load.js
 * 
 * 5. With authentication token:
 *    AUTH_TOKEN=your_jwt_token k6 run tests/load/websocket-load.js
 * 
 * EXPECTED RESULTS:
 * 
 * ✅ Healthy System:
 *    - websocket_message_latency p(95) < 500ms
 *    - websocket_errors < 1%
 *    - websocket_connections > 900 (90%+ success rate)
 *    - No connection timeouts
 * 
 * ⚠️ Under Stress:
 *    - Message latency 500-1000ms
 *    - Error rate 1-5%
 *    - Some reconnections occurring
 * 
 * ❌ Overloaded:
 *    - Message latency > 1s
 *    - Error rate > 5%
 *    - Many failed connections
 *    - WebSocket server crashing
 * 
 * TROUBLESHOOTING:
 * 
 * 1. Connection failures:
 *    - Check WebSocket URL is correct
 *    - Verify authentication token is valid
 *    - Ensure backend WebSocket endpoint is running
 * 
 * 2. High error rates:
 *    - Check backend logs for errors
 *    - Verify database connection pool size
 *    - Monitor CPU and memory usage
 * 
 * 3. High message latency:
 *    - Check network bandwidth
 *    - Verify Redis/message broker performance
 *    - Monitor backend message processing time
 */
