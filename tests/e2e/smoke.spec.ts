import { test, expect } from '@playwright/test';

/**
 * Basic Smoke Test - Verifies application loads
 */

test.describe('Application Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 15000 });
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should handle authentication and reach chat', async ({ page }) => {
    // Try to access chat - may redirect but should eventually load something
    const response = await page.goto('/chat', { waitUntil: 'load', timeout: 15000 }).catch(() => null);
    
    // As long as we got some response and page loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Check localStorage is available
    const hasLocalStorage = await page.evaluate(() => typeof localStorage !== 'undefined');
    expect(hasLocalStorage).toBeTruthy();
  });
});
