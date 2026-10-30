/**
 * k6 Load Test: Chat API Endpoint
 * 
 * Tests the chat message endpoint under high load to ensure it can handle
 * 1,000+ concurrent users sending messages simultaneously.
 * 
 * Target Performance:
 * - Response time < 30s for AI-powered responses
 * - Success rate > 99%
 * - Throughput: 10+ requests per second
 * 
 * Usage:
 *   k6 run tests/load/chat-load.js
 *   k6 run --vus 100 --duration 30s tests/load/chat-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatResponseTime = new Trend('chat_response_time');

// Test configuration
export const options = {
  // Ramp up to 1,000 concurrent users over 5 minutes
  stages: [
    { duration: '30s', target: 10 },    // Warm up: 10 users
    { duration: '1m', target: 100 },    // Ramp up: 100 users
    { duration: '2m', target: 500 },    // Increase: 500 users  
    { duration: '1m', target: 1000 },   // Peak: 1,000 users
    { duration: '3m', target: 1000 },   // Sustain: 1,000 users for 3 minutes
    { duration: '1m', target: 500 },    // Ramp down: 500 users
    { duration: '1m', target: 0 },      // Cool down
  ],
  
  // Thresholds define success criteria
  thresholds: {
    'http_req_duration': ['p(95)<30000', 'p(99)<45000'], // 95% < 30s, 99% < 45s
    'http_req_failed': ['rate<0.01'],                    // Error rate < 1%
    'errors': ['rate<0.01'],                             // Custom error rate < 1%
    'chat_response_time': ['p(95)<30000'],              // Chat response < 30s
  },
};

// Environment variables
const API_URL = __ENV.API_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test_token_for_load_testing';

// Test data: Various chat queries to simulate real usage
const TEST_QUERIES = [
  'Find me 3 hotels in Paris under $200 per night',
  'Create a 5-day itinerary for Tokyo',
  'What are the best restaurants in Rome?',
  'Book a flight from New York to London',
  'Find wheelchair-accessible attractions in Barcelona',
  'Emergency: I lost my passport in Bangkok',
  'Budget travel tips for Southeast Asia',
  'Plan a romantic weekend in Venice',
  'Find family-friendly activities in Singapore',
  'What\'s the weather like in Bali next week?',
];

// Simulate a realistic user session
export default function () {
  // Generate unique session ID for this virtual user
  const sessionId = `load-test-session-${__VU}-${Date.now()}`;
  
  // Select a random query to simulate variety
  const query = TEST_QUERIES[Math.floor(Math.random() * TEST_QUERIES.length)];
  
  // Prepare request payload
  const payload = JSON.stringify({
    message: query,
    sessionId: sessionId,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    timeout: '60s', // Allow up to 60s for AI responses
  };
  
  // Send chat message
  const startTime = Date.now();
  const response = http.post(`${API_URL}/api/chat/sendMessage`, payload, params);
  const responseTime = Date.now() - startTime;
  
  // Track custom metrics
  chatResponseTime.add(responseTime);
  
  // Verify response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has content': (r) => r.body && r.body.length > 0,
    'response time < 60s': (r) => responseTime < 60000,
    'response is not error': (r) => !r.body.includes('error') || !r.body.includes('Error'),
  });
  
  if (!success) {
    errorRate.add(1);
    console.error(`VU ${__VU}: Request failed - Status: ${response.status}, Response: ${response.body}`);
  } else {
    errorRate.add(0);
    console.log(`VU ${__VU}: Chat response received in ${responseTime}ms`);
  }
  
  // Realistic user behavior: think time between messages (2-10 seconds)
  sleep(Math.random() * 8 + 2);
}

// Setup function runs once per VU
export function setup() {
  console.log('🚀 Starting Chat Load Test');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Target: 1,000 concurrent users`);
  console.log(`   Duration: ~9 minutes`);
  console.log(`   Test queries: ${TEST_QUERIES.length} variations`);
  
  // Verify API is reachable
  const healthCheck = http.get(`${API_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  return { startTime: Date.now() };
}

// Teardown function runs once after all VUs complete
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ Chat Load Test Complete`);
  console.log(`   Total duration: ${duration.toFixed(2)} seconds`);
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. Basic load test (default configuration):
 *    k6 run tests/load/chat-load.js
 * 
 * 2. Quick smoke test (10 users, 30 seconds):
 *    k6 run --vus 10 --duration 30s tests/load/chat-load.js
 * 
 * 3. Stress test (2,000 users):
 *    k6 run --stage 1m:100,2m:1000,2m:2000,3m:2000,1m:0 tests/load/chat-load.js
 * 
 * 4. With custom API URL:
 *    API_URL=https://api.flomad.ai k6 run tests/load/chat-load.js
 * 
 * 5. With authentication token:
 *    AUTH_TOKEN=your_jwt_token k6 run tests/load/chat-load.js
 * 
 * 6. Output to JSON for analysis:
 *    k6 run --out json=results.json tests/load/chat-load.js
 * 
 * INTERPRETING RESULTS:
 * 
 * ✅ Passing:
 *    - http_req_duration p(95) < 30s
 *    - http_req_failed < 1%
 *    - All checks passing > 99%
 * 
 * ⚠️ Warning:
 *    - Response times 30-45s (acceptable but slow)
 *    - Error rate 1-5% (investigate errors)
 * 
 * ❌ Failing:
 *    - Response times > 45s (system overloaded)
 *    - Error rate > 5% (critical issues)
 *    - Timeouts occurring (scale infrastructure)
 */
