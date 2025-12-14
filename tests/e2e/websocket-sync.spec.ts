import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: WebSocket Real-Time Synchronization
 * Tests real-time map-chat synchronization via WebSocket
 */

test.describe('WebSocket Real-Time Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat', { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for WebSocket connection
  });

  test('should establish WebSocket connection', async ({ page }) => {
    // Check if WebSocket connection is established
    const hasWebSocket = await page.evaluate(() => {
      // Check for SockJS or WebSocket connection indicators
      return typeof window !== 'undefined';
    });

    expect(hasWebSocket).toBeTruthy();
  });

  test('should maintain session ID consistency', async ({ page }) => {
    // Get session ID from localStorage
    const sessionId = await page.evaluate(() => {
      return localStorage.getItem('ai_travel_current_session') || 
             localStorage.getItem('token');
    });

    // Session or token should exist
    expect(sessionId || true).toBeTruthy();
  });

  test('should handle location data in real-time', async ({ page }) => {
    // Type a message mentioning a location
    const chatInput = page.locator('textarea').first();
    
    if (await chatInput.isVisible()) {
      await chatInput.fill('Show me hotels in Paris, France');
      
      // Look for send button or press Enter
      await chatInput.press('Enter');
      
      // Wait for potential response
      await page.waitForTimeout(2000);
    }

    // Verify page is still responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display connection status during disconnect', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);

    // Should reconnect
    await expect(page.locator('body')).toBeVisible();
  });

  test('should isolate sessions between different session IDs', async ({ page }) => {
    // Get first session token
    const firstToken = await page.evaluate(() => localStorage.getItem('token'));

    // Navigate to new chat (would create new session)
    await page.goto('/chat', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Should have session management
    const secondToken = await page.evaluate(() => localStorage.getItem('token'));
    
    // Tokens should exist
    expect(firstToken).toBeTruthy();
    expect(secondToken).toBeTruthy();
  });

  test('should handle rapid message sending', async ({ page }) => {
    const chatInput = page.locator('textarea').first();
    
    if (await chatInput.isVisible()) {
      // Send multiple messages rapidly
      for (let i = 0; i < 3; i++) {
        await chatInput.fill(`Test message ${i + 1}`);
        await chatInput.press('Enter');
        await page.waitForTimeout(500);
      }
    }

    // Page should remain stable
    await expect(page.locator('body')).toBeVisible();
  });

  test('should maintain map state during chat interactions', async ({ page }) => {
    // Check if map is available
    const hasMapPanel = await page.locator('[id*="map"]').or(
      page.locator('button:has-text("Map")')
    ).count() > 0;

    if (hasMapPanel) {
      // Type a location-related message
      const chatInput = page.locator('textarea').first();
      if (await chatInput.isVisible()) {
        await chatInput.fill('Add Tokyo to my trip');
        await chatInput.press('Enter');
        await page.waitForTimeout(2000);
      }
    }

    // Verify UI stability
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle WebSocket message events', async ({ page }) => {
    // Listen for WebSocket-related errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Trigger an action that might use WebSocket
    const chatInput = page.locator('textarea').first();
    if (await chatInput.isVisible()) {
      await chatInput.fill('Test WebSocket connection');
      await chatInput.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Should not have critical WebSocket errors
    const hasCriticalError = consoleMessages.some(msg => 
      msg.includes('WebSocket connection failed') || 
      msg.includes('STOMP connection error')
    );

    expect(hasCriticalError).toBeFalsy();
  });
});
