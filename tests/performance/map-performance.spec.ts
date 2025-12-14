/**
 * Playwright Performance Tests: Map Rendering Benchmarks
 * 
 * Tests map rendering performance with varying numbers of markers to ensure
 * the application can handle large location datasets without UI freezing.
 * 
 * Performance Targets (from competitive analysis):
 * - 100 markers: < 200ms render time
 * - 500 markers: < 400ms with clustering
 * - 1,000 markers: < 500ms with clustering
 * - 5,000 markers: < 1,000ms with advanced clustering
 * 
 * Competitors Benchmark:
 * - Google Maps: ~150ms for 100 markers
 * - ChatGPT (no map): N/A
 * - MindTrip: ~300ms for 1,000 markers
 * - Layla AI: ~400ms for 1,000 markers
 * 
 * Usage:
 *   pnpm test:performance
 *   npx playwright test tests/performance/map-performance.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

// TypeScript declarations for browser globals
declare global {
  interface Window {
    mapInstance?: {
      addMarkers: (markers: MarkerData[]) => void;
    };
    dispatchMapAction?: (action: { type: string; payload: MarkerData[] }) => void;
    mapRef?: { current: any };
    websocketManager?: {
      getConnectionState: () => string;
      getRetryCount: () => number;
      connectionMetrics?: {
        reconnectAttempts: number;
        connectionUptime: number;
      };
    };
  }
  
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// Test configuration
test.describe.configure({ mode: 'parallel' });

// Helper type for marker generation
interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  type: string;
  rating?: number;
}

// Generate realistic marker data around a central location
function generateMarkers(count: number, centerLat: number = 40.7128, centerLng: number = -74.0060): MarkerData[] {
  const markers: MarkerData[] = [];
  const spreadRadius = 0.1; // ~11km radius
  
  for (let i = 0; i < count; i++) {
    // Generate random position within radius
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.sqrt(Math.random()) * spreadRadius;
    
    markers.push({
      lat: centerLat + radius * Math.cos(angle),
      lng: centerLng + radius * Math.sin(angle),
      name: `Location ${i + 1}`,
      type: ['hotel', 'restaurant', 'attraction', 'museum'][i % 4],
      rating: 3.0 + Math.random() * 2, // 3.0-5.0 stars
    });
  }
  
  return markers;
}

// Helper to inject markers into the map component
async function injectMarkersIntoMap(page: Page, markers: MarkerData[]): Promise<number> {
  const startTime = await page.evaluate(() => performance.now());
  
  // Inject markers into global map instance
  // Note: Adjust this based on your actual map component API
  await page.evaluate((markersData) => {
    if (window.mapInstance && window.mapInstance.addMarkers) {
      window.mapInstance.addMarkers(markersData);
    } else {
      console.warn('Map instance not found - injecting via global state');
      // Fallback: dispatch Redux/Context action
      if (window.dispatchMapAction) {
        window.dispatchMapAction({ type: 'ADD_MARKERS', payload: markersData });
      }
    }
  }, markers);
  
  // Wait for rendering to complete
  await page.waitForLoadState('networkidle');
  
  const endTime = await page.evaluate(() => performance.now());
  return endTime - startTime;
}

// Helper to measure FPS during map interaction
async function measureMapFPS(page: Page, durationMs: number = 1000): Promise<number> {
  return await page.evaluate((duration) => {
    return new Promise<number>((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      
      function countFrame() {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = (frameCount / duration) * 1000;
          resolve(fps);
        }
      }
      
      requestAnimationFrame(countFrame);
    });
  }, durationMs);
}

test.describe('Map Performance Benchmarks', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for map to be ready
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
    
    // Expose map instance to window for testing
    await page.evaluate(() => {
      if (window.mapRef && window.mapRef.current) {
        window.mapInstance = window.mapRef.current;
      }
    });
  });
  
  test('renders 100 markers in under 200ms', async ({ page }) => {
    const markerCount = 100;
    const markers = generateMarkers(markerCount);
    
    const renderTime = await injectMarkersIntoMap(page, markers);
    
    console.log(`✅ Rendered ${markerCount} markers in ${renderTime.toFixed(2)}ms`);
    
    // Verify all markers are rendered
    const renderedMarkers = await page.locator('[data-testid="map-marker"]').count();
    expect(renderedMarkers).toBe(markerCount);
    
    // Performance assertion
    expect(renderTime).toBeLessThan(200);
  });
  
  test('renders 500 markers in under 400ms (with clustering)', async ({ page }) => {
    const markerCount = 500;
    const markers = generateMarkers(markerCount);
    
    const renderTime = await injectMarkersIntoMap(page, markers);
    
    console.log(`✅ Rendered ${markerCount} markers in ${renderTime.toFixed(2)}ms`);
    
    // Verify clustering is active (marker count should be less than total)
    const visibleMarkers = await page.locator('[data-testid="map-marker"]').count();
    expect(visibleMarkers).toBeLessThan(markerCount); // Clustering reduces visible markers
    
    // Performance assertion
    expect(renderTime).toBeLessThan(400);
  });
  
  test('renders 1,000 markers in under 500ms (with clustering)', async ({ page }) => {
    const markerCount = 1000;
    const markers = generateMarkers(markerCount);
    
    const renderTime = await injectMarkersIntoMap(page, markers);
    
    console.log(`✅ Rendered ${markerCount} markers in ${renderTime.toFixed(2)}ms`);
    
    // Verify clustering is active
    const visibleMarkers = await page.locator('[data-testid="map-marker"]').count();
    expect(visibleMarkers).toBeLessThan(markerCount);
    
    // Performance assertion - competitive with MindTrip (300ms) and Layla (400ms)
    expect(renderTime).toBeLessThan(500);
  });
  
  test('maintains 30+ FPS with 1,000 markers during pan', async ({ page }) => {
    const markerCount = 1000;
    const markers = generateMarkers(markerCount);
    await injectMarkersIntoMap(page, markers);
    
    // Simulate map panning
    const mapContainer = page.locator('[data-testid="map-container"]');
    await mapContainer.hover();
    
    // Start measuring FPS
    const fpsBeforePan = await measureMapFPS(page, 1000);
    
    // Perform pan operation
    await mapContainer.dragTo(mapContainer, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 200, y: 200 },
    });
    
    // Measure FPS during pan
    const fpsDuringPan = await measureMapFPS(page, 1000);
    
    console.log(`✅ FPS: Before=${fpsBeforePan.toFixed(1)}, During=${fpsDuringPan.toFixed(1)}`);
    
    // Performance assertion - should maintain 30+ FPS
    expect(fpsDuringPan).toBeGreaterThan(30);
  });
  
  test('maintains 30+ FPS with 1,000 markers during zoom', async ({ page }) => {
    const markerCount = 1000;
    const markers = generateMarkers(markerCount);
    await injectMarkersIntoMap(page, markers);
    
    // Simulate zoom operation
    const mapContainer = page.locator('[data-testid="map-container"]');
    
    // Start measuring FPS
    const fpsBeforeZoom = await measureMapFPS(page, 1000);
    
    // Perform zoom operation (mouse wheel)
    await mapContainer.hover();
    await page.mouse.wheel(0, 300); // Zoom in
    await page.waitForTimeout(500);
    
    // Measure FPS during zoom
    const fpsDuringZoom = await measureMapFPS(page, 1000);
    
    console.log(`✅ FPS: Before=${fpsBeforeZoom.toFixed(1)}, During=${fpsDuringZoom.toFixed(1)}`);
    
    // Performance assertion
    expect(fpsDuringZoom).toBeGreaterThan(30);
  });
  
  test('handles real-time marker additions at 10 markers/sec', async ({ page }) => {
    const totalMarkers = 100;
    const batchSize = 10;
    const batchDelayMs = 1000; // 10 markers per second
    
    const markers = generateMarkers(totalMarkers);
    const updateTimes: number[] = [];
    
    // Add markers in batches
    for (let i = 0; i < totalMarkers; i += batchSize) {
      const batch = markers.slice(i, i + batchSize);
      const updateStart = await page.evaluate(() => performance.now());
      
      await page.evaluate((batchData) => {
        if (window.mapInstance && window.mapInstance.addMarkers) {
          window.mapInstance.addMarkers(batchData);
        }
      }, batch);
      
      const updateEnd = await page.evaluate(() => performance.now());
      const updateTime = updateEnd - updateStart;
      updateTimes.push(updateTime);
      
      console.log(`✅ Batch ${i / batchSize + 1}: ${updateTime.toFixed(2)}ms`);
      
      await page.waitForTimeout(batchDelayMs);
    }
    
    // Calculate average update time
    const avgUpdateTime = updateTimes.reduce((a, b) => a + b) / updateTimes.length;
    console.log(`✅ Average update time: ${avgUpdateTime.toFixed(2)}ms`);
    
    // Performance assertion - each update should be < 50ms
    expect(avgUpdateTime).toBeLessThan(50);
  });
  
  test('stress test: renders 5,000 markers with advanced clustering', async ({ page }) => {
    const markerCount = 5000;
    const markers = generateMarkers(markerCount);
    
    const renderTime = await injectMarkersIntoMap(page, markers);
    
    console.log(`⚡ Stress test: Rendered ${markerCount} markers in ${renderTime.toFixed(2)}ms`);
    
    // Verify clustering is aggressive at this scale
    const visibleMarkers = await page.locator('[data-testid="map-marker"]').count();
    expect(visibleMarkers).toBeLessThan(100); // Should cluster heavily
    
    // Performance assertion - should still be < 1 second
    expect(renderTime).toBeLessThan(1000);
  });
  
  test('memory usage stays under 100MB with 1,000 markers', async ({ page }) => {
    const markerCount = 1000;
    const markers = generateMarkers(markerCount);
    
    // Measure memory before
    const memoryBefore = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / (1024 * 1024); // MB
      }
      return 0;
    });
    
    await injectMarkersIntoMap(page, markers);
    
    // Measure memory after
    const memoryAfter = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / (1024 * 1024); // MB
      }
      return 0;
    });
    
    const memoryIncrease = memoryAfter - memoryBefore;
    console.log(`✅ Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    
    // Performance assertion - memory increase should be < 100MB
    if (memoryBefore > 0) {
      expect(memoryIncrease).toBeLessThan(100);
    }
  });
  
  test('marker click response time < 100ms', async ({ page }) => {
    const markers = generateMarkers(50);
    await injectMarkersIntoMap(page, markers);
    
    // Wait for markers to render
    await page.waitForSelector('[data-testid="map-marker"]');
    
    // Get first marker
    const firstMarker = page.locator('[data-testid="map-marker"]').first();
    
    // Measure click response time
    const clickStartTime = await page.evaluate(() => performance.now());
    await firstMarker.click();
    
    // Wait for info window to appear
    await page.waitForSelector('[data-testid="marker-info-window"]', { timeout: 5000 });
    
    const clickEndTime = await page.evaluate(() => performance.now());
    const responseTime = clickEndTime - clickStartTime;
    
    console.log(`✅ Marker click response time: ${responseTime.toFixed(2)}ms`);
    
    // Performance assertion
    expect(responseTime).toBeLessThan(100);
  });
});

/**
 * USAGE:
 * 
 * Run all performance tests:
 *   pnpm test:performance
 *   npx playwright test tests/performance/map-performance.spec.ts
 * 
 * Run specific test:
 *   npx playwright test tests/performance/map-performance.spec.ts -g "100 markers"
 * 
 * Run with UI:
 *   npx playwright test tests/performance/map-performance.spec.ts --ui
 * 
 * Generate report:
 *   npx playwright test tests/performance/map-performance.spec.ts --reporter=html
 * 
 * EXPECTED RESULTS:
 * 
 * ✅ All tests passing:
 *   - 100 markers: ~80-150ms
 *   - 500 markers: ~200-350ms
 *   - 1,000 markers: ~300-450ms
 *   - FPS: 50-60 fps during interactions
 *   - Memory: <50MB increase
 *   - Click response: <50ms
 * 
 * ⚠️ Performance degradation:
 *   - 100 markers: 200-300ms
 *   - 1,000 markers: 500-800ms
 *   - FPS: 20-30 fps
 *   - Memory: 50-100MB
 * 
 * ❌ Critical issues:
 *   - Any test > 1 second
 *   - FPS < 20
 *   - Memory > 100MB
 *   - UI freezing during operations
 */
