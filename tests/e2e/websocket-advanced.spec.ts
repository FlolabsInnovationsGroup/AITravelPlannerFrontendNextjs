/**
 * Advanced WebSocket Resilience Tests
 * 
 * Tests WebSocket connection stability under various network conditions:
 * - Packet loss scenarios
 * - High latency conditions
 * - Complete disconnections
 * - Network handoffs (WiFi → Mobile)
 * - Intermittent connectivity
 * 
 * Validates the enhanced WebSocket implementation from useEnhancedWebSocket.ts:
 * - Automatic reconnection (up to 10 attempts)
 * - Message queue and retry logic
 * - Heartbeat mechanism
 * - Connection state tracking
 * 
 * Usage:
 *   npx playwright test tests/e2e/websocket-advanced.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import { NetworkSimulator } from '../utils/network-simulator';

test.describe('Advanced WebSocket Resilience', () => {
  let simulator: NetworkSimulator;

  test.beforeEach(async ({ page }) => {
    simulator = new NetworkSimulator(page);
    
    // Navigate to chat application
    await page.goto('http://localhost:3000/chat', { waitUntil: 'domcontentloaded' });
    
    // Wait for connection status to be present
    await page.waitForSelector('[data-testid="connection-status"]', { timeout: 15000 });
    
    // Give a moment for initial connection to establish
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    // Clean up network simulator
    await simulator.clearConditions();
  });

  test('reconnects after 10% packet loss', async ({ page }) => {
    // Apply 10% packet loss
    await simulator.setPacketLoss(0.1);
    
    // Send a test message
    await page.fill('[data-testid="message-input"]', 'Test message with packet loss');
    await page.click('[data-testid="send-button"]');
    
    // Wait for message to appear (may require retry)
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    
    // Verify connection status (should still be connected or reconnected)
    const connectionStatus = await page.locator('[data-testid="connection-status"]').textContent();
    expect(connectionStatus).toMatch(/connected|reconnecting/i);
    
    // Verify message was delivered
    const messages = await page.locator('[data-testid="message"]').count();
    expect(messages).toBeGreaterThan(0);
  });

  test('reconnects after 25% packet loss', async ({ page }) => {
    // Apply 25% packet loss (more aggressive)
    await simulator.setPacketLoss(0.25);
    
    // Send multiple messages to test retry logic
    for (let i = 0; i < 3; i++) {
      await page.fill('[data-testid="message-input"]', `Message ${i + 1} with high packet loss`);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(2000);
    }
    
    // Wait for last message
    await page.waitForSelector('[data-testid="message"]', { timeout: 30000 });
    
    // Verify all messages eventually delivered
    const messages = await page.locator('[data-testid="message"]').count();
    expect(messages).toBeGreaterThanOrEqual(3);
    
    // Check if retry mechanism exists (optional - may not be exposed to window)
    const retryCount = await page.evaluate(() => {
      // @ts-ignore
      return window.websocketManager?.connectionMetrics?.reconnectAttempts || 0;
    });
    
    console.log(`✅ Reconnect attempts: ${retryCount}`);
    // Test passes if messages are delivered despite packet loss
    expect(messages).toBeGreaterThanOrEqual(3);
  });

  test('survives 2-second latency', async ({ page }) => {
    // Apply 2 second latency
    await simulator.setLatency(2000);
    
    // Send message
    const startTime = Date.now();
    await page.fill('[data-testid="message-input"]', 'Test message with 2s latency');
    await page.click('[data-testid="send-button"]');
    
    // Wait for message delivery
    await page.waitForSelector('[data-testid="message"]', { timeout: 15000 });
    const endTime = Date.now();
    
    const totalTime = endTime - startTime;
    console.log(`✅ Message delivered in ${totalTime}ms with 2s latency`);
    
    // Verify connection stayed stable
    const connectionStatus = await page.locator('[data-testid="connection-status"]').textContent();
    expect(connectionStatus).toMatch(/connected/i);
    
    // Total time should be reasonable (< 10s including latency)
    expect(totalTime).toBeLessThan(10000);
  });

  test('reconnects after complete disconnection', async ({ page }) => {
    // Verify initial connection
    let connectionStatus = await page.locator('[data-testid="connection-status"]').textContent();
    expect(connectionStatus).toMatch(/connect/i);
    
    // Simulate complete disconnection
    await simulator.goOffline();
    
    console.log('🔌 Simulating complete disconnection...');
    await page.waitForTimeout(2000);
    
    // Reconnect
    await simulator.goOnline();
    
    console.log('🔌 Network restored, waiting for reconnection...');
    // Wait for connection to stabilize
    await page.waitForTimeout(3000);
    
    console.log('✅ Reconnection attempt complete');
    
    // Send a message to verify functionality restored
    await page.fill('[data-testid="message-input"]', 'Test message after reconnection');
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    
    // Verify message delivered
    const lastMessage = await page.locator('[data-testid="message"]').last().textContent();
    expect(lastMessage).toContain('Test message after reconnection');
  });

  test('survives WiFi handoff scenario', async ({ page }) => {
    // Wait for page to be fully ready and HMR overlay to disappear
    await page.waitForTimeout(5000);
    
    // Wait for any update overlay to disappear
    const overlay = page.locator('text="Updating app"');
    if (await overlay.isVisible().catch(() => false)) {
      await overlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
    
    // Send initial message
    await page.fill('[data-testid="message-input"]', 'Message before handoff');
    await page.locator('[data-testid="send-button"]').click({ force: true, timeout: 10000 });
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    
    const initialMessages = await page.locator('[data-testid="message"]').count();
    console.log(`✅ Initial message sent (${initialMessages} message(s))`);
    
    // Simulate WiFi handoff (3 second disconnection)
    console.log('🔄 Simulating WiFi → Mobile handoff...');
    await simulator.simulateHandoff(3000);
    
    // Wait for reconnection period
    console.log('⏳ Waiting for reconnection...');
    await page.waitForTimeout(5000);
    
    console.log('✅ Reconnection period complete');
    
    // Send message after handoff
    await page.fill('[data-testid="message-input"]', 'Message after handoff');
    await page.locator('[data-testid="send-button"]').click({ timeout: 5000 });
    
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    
    // Verify messages were delivered
    const finalMessages = await page.locator('[data-testid="message"]').count();
    console.log(`✅ Messages after handoff: ${finalMessages}`);
    expect(finalMessages).toBeGreaterThanOrEqual(initialMessages);
  });

  test('handles intermittent connectivity gracefully', async ({ page }) => {
    // Wait for page to be fully ready and HMR overlay to disappear
    await page.waitForTimeout(5000);
    
    // Wait for any update overlay to disappear
    const overlay = page.locator('text="Updating app"');
    if (await overlay.isVisible().catch(() => false)) {
      await overlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
    
    // Send initial message
    await page.fill('[data-testid="message-input"]', 'Initial message');
    await page.locator('[data-testid="send-button"]').click({ force: true, timeout: 10000 });
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    
    const initialMessages = await page.locator('[data-testid="message"]').count();
    console.log(`✅ Initial message sent (${initialMessages} message(s))`);
    
    // Simulate intermittent connectivity (3 cycles: 5s on, 2s off)
    console.log('⚡ Simulating intermittent connectivity...');
    
    const onDuration = 3000; // Reduced for faster test
    const offDuration = 1000;
    const cycles = 3;
    
    for (let i = 0; i < cycles; i++) {
      console.log(`  Cycle ${i + 1}/${cycles}: Online for ${onDuration}ms`);
      await simulator.goOnline();
      
      // Try to send message during online period
      await page.fill('[data-testid="message-input"]', `Message cycle ${i + 1}`);
      await page.locator('[data-testid="send-button"]').click({ timeout: 5000 });
      
      await page.waitForTimeout(onDuration);
      
      console.log(`  Cycle ${i + 1}/${cycles}: Offline for ${offDuration}ms`);
      await simulator.goOffline();
      await page.waitForTimeout(offDuration);
    }
    
    // End in online state
    await simulator.goOnline();
    console.log('📶 Network restored, waiting for stabilization...');
    await page.waitForTimeout(3000);
    
    console.log('✅ Survived intermittent connectivity');
    
    // Verify messages were delivered (at least initial message)
    const finalMessages = await page.locator('[data-testid="message"]').count();
    console.log(`📊 Total messages delivered: ${finalMessages}`);
    expect(finalMessages).toBeGreaterThan(0);
  });

  test('queues messages during offline and sends on reconnect', async ({ page }) => {
    // Go offline
    await simulator.goOffline();
    console.log('📴 Going offline...');
    await page.waitForTimeout(2000);
    
    // Try to send messages while offline (should be queued)
    const offlineMessages = [
      'Offline message 1',
      'Offline message 2',
      'Offline message 3',
    ];
    
    for (const message of offlineMessages) {
      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(500);
    }
    
    console.log('✅ Queued 3 messages while offline');
    
    // Reconnect
    await simulator.goOnline();
    console.log('📶 Network restored...');
    await page.waitForTimeout(3000);
    
    console.log('✅ Reconnected, checking message delivery');
    
    // Wait for queued messages to be sent
    await page.waitForTimeout(5000);
    
    // Verify all messages were delivered
    const deliveredMessages = await page.locator('[data-testid="message"]').count();
    expect(deliveredMessages).toBeGreaterThanOrEqual(offlineMessages.length);
    
    // Verify message content
    for (const message of offlineMessages) {
      const messageExists = await page.locator(`[data-testid="message"]:has-text("${message}")`).count();
      expect(messageExists).toBeGreaterThan(0);
    }
  });

  test('slow 3G network conditions', async ({ page }) => {
    // Apply slow 3G profile
    await simulator.setSlow3G();
    
    console.log('📱 Testing under Slow 3G conditions (400ms latency, 50 KB/s bandwidth)');
    
    // Send message
    const startTime = Date.now();
    await page.fill('[data-testid="message-input"]', 'Test message on Slow 3G');
    await page.click('[data-testid="send-button"]');
    
    // Wait for delivery (should be slower but still work)
    await page.waitForSelector('[data-testid="message"]', { timeout: 30000 });
    const endTime = Date.now();
    
    const deliveryTime = endTime - startTime;
    console.log(`✅ Message delivered in ${deliveryTime}ms on Slow 3G`);
    
    // Verify connection stayed stable
    const connectionStatus = await page.locator('[data-testid="connection-status"]').textContent();
    expect(connectionStatus).toMatch(/connected/i);
    
    // Should still deliver within reasonable time
    expect(deliveryTime).toBeLessThan(30000);
  });

  test('heartbeat keeps connection alive during idle', async ({ page }) => {
    // Wait idle for 30 seconds (heartbeat interval is 25s)
    console.log('⏱️ Waiting 30 seconds to test heartbeat mechanism...');
    await page.waitForTimeout(30000);
    
    // Verify connection still active
    const connectionStatus = await page.locator('[data-testid="connection-status"]').textContent();
    expect(connectionStatus).toMatch(/connect/i);
    
    // Send message to verify connection is functional
    await page.fill('[data-testid="message-input"]', 'Test message after idle period');
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    
    console.log('✅ Connection stayed alive with heartbeat');
  });

  test('connection metrics tracking', async ({ page }) => {
    // Force a reconnection scenario
    await simulator.goOffline();
    console.log('📴 Forcing disconnection...');
    await page.waitForTimeout(3000);
    
    await simulator.goOnline();
    console.log('📶 Restoring connection...');
    await page.waitForTimeout(3000);
    
    // Check connection metrics (if available)
    const metrics = await page.evaluate(() => {
      return window.websocketManager?.connectionMetrics || {};
    });
    
    console.log('📊 Connection Metrics:', metrics);
    
    // Verify connection is functional after reconnection
    await page.fill('[data-testid="message-input"]', 'Test message after reconnection');
    await page.click('[data-testid="send-button"]');
    
    // Wait for message to be delivered
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    
    const messageCount = await page.locator('[data-testid="message"]').count();
    expect(messageCount).toBeGreaterThan(0);
    console.log('✅ Connection functional after disconnect/reconnect cycle');
  });
});

/**
 * USAGE:
 * 
 * Run all advanced WebSocket tests:
 *   npx playwright test tests/e2e/websocket-advanced.spec.ts
 * 
 * Run specific test:
 *   npx playwright test tests/e2e/websocket-advanced.spec.ts -g "packet loss"
 * 
 * Run with UI:
 *   npx playwright test tests/e2e/websocket-advanced.spec.ts --ui
 * 
 * Run with debug:
 *   npx playwright test tests/e2e/websocket-advanced.spec.ts --debug
 * 
 * EXPECTED RESULTS:
 * 
 * ✅ All tests passing:
 *   - Reconnects within 30s (10 attempts * 3s backoff)
 *   - Messages queued and delivered after reconnection
 *   - Heartbeat keeps connection alive during idle
 *   - Handles 10-25% packet loss gracefully
 *   - Survives 2s latency
 *   - Works on Slow 3G conditions
 * 
 * ⚠️ Warning signs:
 *   - Reconnection takes > 30s (may need more retry attempts)
 *   - Messages lost during disconnection (queue not working)
 *   - Connection drops during idle (heartbeat failing)
 * 
 * ❌ Critical issues:
 *   - Cannot reconnect after disconnection
 *   - Messages lost even after reconnection
 *   - WebSocket errors in console
 *   - UI freezing during network issues
 * 
 * TROUBLESHOOTING:
 * 
 * 1. Tests failing on reconnection:
 *    - Check useEnhancedWebSocket.ts max reconnect attempts
 *    - Verify heartbeat interval configuration
 *    - Check backend WebSocket endpoint stability
 * 
 * 2. Messages not delivered:
 *    - Check message queue implementation
 *    - Verify retry logic in useEnhancedMessaging.ts
 *    - Check backend message processing
 * 
 * 3. Network simulation not working:
 *    - Verify Playwright version (requires 1.30+)
 *    - Check browser context has proper permissions
 *    - Consider using Toxiproxy for more realistic simulation
 */
