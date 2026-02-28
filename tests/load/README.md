# 🚀 Load Testing Suite - k6

This directory contains k6 load tests for the AI Travel Planner backend infrastructure.

## 📋 Test Files

### 1. `chat-load.js` - Chat API Load Testing
Tests the chat message endpoint under high load with AI-powered responses.

**Target Performance:**
- ✅ Response time < 30s (p95)
- ✅ Success rate > 99%
- ✅ Support 1,000+ concurrent users

**Run:**
```bash
k6 run tests/load/chat-load.js
```

### 2. `websocket-load.js` - WebSocket Connection Load Testing
Tests WebSocket connection stability with real-time location synchronization.

**Target Performance:**
- ✅ Message delivery < 500ms (p95)
- ✅ Support 1,000+ concurrent connections
- ✅ Error rate < 1%

**Run:**
```bash
k6 run tests/load/websocket-load.js
```

## 🔧 Prerequisites

### Install k6

**Windows (Chocolatey):**
```powershell
choco install k6
```

**Windows (Manual):**
1. Download from: https://github.com/grafana/k6/releases
2. Extract and add to PATH
3. Verify: `k6 version`

**macOS (Homebrew):**
```bash
brew install k6
```

**Linux:**
```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Backend Setup

Ensure the backend is running:
```bash
cd ../AITravelPlannerBackEnd
mvn spring-boot:run
```

Verify health endpoint:
```bash
curl http://localhost:8080/api/health
```

## 🎯 Running Load Tests

### Quick Smoke Tests (10 users, 30 seconds)

**Chat API:**
```bash
k6 run --vus 10 --duration 30s tests/load/chat-load.js
```

**WebSocket:**
```bash
k6 run --vus 10 --duration 30s tests/load/websocket-load.js
```

### Standard Load Tests (Default Configuration)

**Chat API (1,000 users, 9 minutes):**
```bash
k6 run tests/load/chat-load.js
```

**WebSocket (1,000 connections, 10 minutes):**
```bash
k6 run tests/load/websocket-load.js
```

### Stress Tests (2,000+ users)

**Chat API:**
```bash
k6 run --stage 1m:100,2m:1000,2m:2000,3m:2000,1m:0 tests/load/chat-load.js
```

**WebSocket:**
```bash
k6 run --stage 1m:100,2m:1000,2m:2000,3m:2000,1m:0 tests/load/websocket-load.js
```

### Custom Scenarios

**Short burst (100 users, 1 minute):**
```bash
k6 run --vus 100 --duration 1m tests/load/chat-load.js
```

**Extended soak test (500 users, 30 minutes):**
```bash
k6 run --stage 2m:500,30m:500,1m:0 tests/load/chat-load.js
```

## 🌐 Environment Variables

### Chat Load Test

```bash
# Custom API URL
API_URL=https://api.flomad.ai k6 run tests/load/chat-load.js

# With authentication token
AUTH_TOKEN=your_jwt_token k6 run tests/load/chat-load.js

# Both together
API_URL=https://api.flomad.ai AUTH_TOKEN=your_jwt_token k6 run tests/load/chat-load.js
```

### WebSocket Load Test

```bash
# Custom WebSocket URL
WS_URL=wss://api.flomad.ai/ws k6 run tests/load/websocket-load.js

# With authentication token
AUTH_TOKEN=your_jwt_token k6 run tests/load/websocket-load.js
```

## 📊 Output Formats

### Terminal Output (Default)
```bash
k6 run tests/load/chat-load.js
```

### JSON Output
```bash
k6 run --out json=results.json tests/load/chat-load.js
```

### CSV Output
```bash
k6 run --out csv=results.csv tests/load/chat-load.js
```

### Multiple Outputs
```bash
k6 run --out json=results.json --out csv=results.csv tests/load/chat-load.js
```

### Cloud Output (k6 Cloud)
```bash
k6 cloud tests/load/chat-load.js
```

## 📈 Interpreting Results

### Chat API Load Test

**✅ Passing Criteria:**
```bash
✓ http_req_duration..............: avg=15s  p(95)=25s p(99)=40s
✓ http_req_failed................: 0.2%
✓ checks.........................: 99.8% 
```

**⚠️ Warning Signs:**
```bash
⚠ http_req_duration..............: avg=25s  p(95)=35s p(99)=50s
⚠ http_req_failed................: 2.5%
⚠ checks.........................: 97.5%
```
**Action:** Investigate slow responses, check AI API rate limits, verify database connection pool.

**❌ Failure:**
```bash
✗ http_req_duration..............: avg=45s  p(95)=60s p(99)=timeout
✗ http_req_failed................: 8%
✗ checks.........................: 92%
```
**Action:** System is overloaded. Scale infrastructure, optimize AI response caching, increase backend resources.

### WebSocket Load Test

**✅ Passing Criteria:**
```bash
✓ websocket_message_latency......: avg=250ms p(95)=400ms p(99)=800ms
✓ websocket_errors...............: 0.3%
✓ websocket_connections..........: 980/1000 (98%)
```

**⚠️ Warning Signs:**
```bash
⚠ websocket_message_latency......: avg=600ms p(95)=900ms p(99)=1500ms
⚠ websocket_errors...............: 3%
⚠ websocket_connections..........: 850/1000 (85%)
```
**Action:** Check network bandwidth, verify Redis message broker, monitor backend WebSocket processing.

**❌ Failure:**
```bash
✗ websocket_message_latency......: avg=2s p(95)=5s p(99)=timeout
✗ websocket_errors...............: 12%
✗ websocket_connections..........: 600/1000 (60%)
```
**Action:** WebSocket server crashing. Increase connection pool size, optimize message handling, scale horizontally.

## 🔍 Troubleshooting

### Connection Failures

**Symptoms:**
```bash
ERRO[0001] connection refused: localhost:8080
```

**Solutions:**
1. Verify backend is running: `curl http://localhost:8080/api/health`
2. Check firewall rules
3. Verify port 8080 is not blocked

### Authentication Errors

**Symptoms:**
```bash
WARN[0010] Status 401 Unauthorized
```

**Solutions:**
1. Generate valid JWT token:
   ```bash
   # In backend directory
   curl -X POST http://localhost:8080/api/auth/guest
   ```
2. Set AUTH_TOKEN environment variable with valid token
3. Check token expiration (default: 24 hours)

### High Error Rates

**Symptoms:**
```bash
✗ http_req_failed: 15% (threshold < 1%)
```

**Solutions:**
1. Check backend logs:
   ```bash
   tail -f AITravelPlannerBackEnd/logs/application.log
   ```
2. Monitor database connections
3. Verify AI API rate limits not exceeded
4. Check system resources (CPU, memory)

### Timeout Errors

**Symptoms:**
```bash
WARN[0060] Request timeout (60s)
```

**Solutions:**
1. Increase timeout in test:
   ```javascript
   timeout: '120s', // Increase from 60s
   ```
2. Optimize AI response caching
3. Implement parallel API calls (already done in ItineraryGeneratorFunction)
4. Scale backend horizontally

## 🎯 Performance Targets

### Chat API

| Metric | Target | Acceptable | Critical |
|--------|--------|-----------|----------|
| **Response Time (p95)** | < 20s | < 30s | > 45s |
| **Success Rate** | > 99% | > 95% | < 90% |
| **Throughput** | 20+ RPS | 10+ RPS | < 5 RPS |
| **Concurrent Users** | 1,000+ | 500+ | < 100 |

### WebSocket

| Metric | Target | Acceptable | Critical |
|--------|--------|-----------|----------|
| **Message Latency (p95)** | < 300ms | < 500ms | > 1s |
| **Connection Success** | > 99% | > 95% | < 90% |
| **Error Rate** | < 0.5% | < 1% | > 5% |
| **Concurrent Connections** | 1,000+ | 500+ | < 100 |

## 📦 CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:     # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Chat Load Test
        run: |
          API_URL=${{ secrets.STAGING_API_URL }} \
          AUTH_TOKEN=${{ secrets.LOAD_TEST_TOKEN }} \
          k6 run tests/load/chat-load.js
      
      - name: Run WebSocket Load Test
        run: |
          WS_URL=${{ secrets.STAGING_WS_URL }} \
          AUTH_TOKEN=${{ secrets.LOAD_TEST_TOKEN }} \
          k6 run tests/load/websocket-load.js
```

## 📚 Additional Resources

- **k6 Documentation:** https://k6.io/docs/
- **k6 Examples:** https://github.com/grafana/k6-learn
- **k6 Cloud (Grafana):** https://app.k6.io/
- **WebSocket Testing Guide:** https://k6.io/docs/using-k6/protocols/websockets/

## 🤝 Contributing

When adding new load tests:

1. Follow naming convention: `{feature}-load.js`
2. Include detailed comments and usage examples
3. Define realistic thresholds based on SLOs
4. Add documentation to this README
5. Test locally before committing

## 📝 Notes

- **Production Load Testing:** Always coordinate with DevOps before running load tests against production
- **Rate Limiting:** Tests use `AUTH_TOKEN` to bypass guest rate limits
- **Database Cleanup:** Tests create temporary sessions that are auto-deleted after 30 days
- **Cost:** Load tests consume OpenAI API credits - monitor usage during tests
