/**
 * Network Simulator Utility for Playwright Tests
 * 
 * Provides utilities to simulate various network conditions in Playwright tests:
 * - Packet loss simulation (via request abortion)
 * - Latency simulation (via delayed responses)
 * - Bandwidth throttling
 * - Complete disconnection
 * 
 * Note: This is a simplified simulation using Playwright's route interception.
 * For production-grade network simulation, consider using Toxiproxy.
 * 
 * Usage:
 *   import { NetworkSimulator } from '../utils/network-simulator';
 *   
 *   const simulator = new NetworkSimulator(page);
 *   await simulator.setPacketLoss(0.25); // 25% packet loss
 *   await simulator.setLatency(2000); // 2 second delay
 */

import { Page, Route } from '@playwright/test';

export interface NetworkConditions {
  /** Packet loss rate (0.0 - 1.0) */
  packetLoss?: number;
  /** Latency in milliseconds */
  latency?: number;
  /** Bandwidth limit in bytes per second */
  bandwidth?: number;
  /** Whether to simulate complete disconnection */
  offline?: boolean;
}

export class NetworkSimulator {
  private page: Page;
  private currentConditions: NetworkConditions = {};
  private routeHandlers: Set<(route: Route) => Promise<void>> = new Set();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Apply network conditions to all requests
   */
  async applyConditions(conditions: NetworkConditions): Promise<void> {
    this.currentConditions = { ...this.currentConditions, ...conditions };

    // Clear existing route handlers
    await this.clearConditions();

    // Set up new route handler based on conditions
    const handler = async (route: Route) => {
      // Simulate complete disconnection
      if (this.currentConditions.offline) {
        await route.abort('failed');
        return;
      }

      // Simulate packet loss
      if (this.currentConditions.packetLoss && Math.random() < this.currentConditions.packetLoss) {
        await route.abort('failed');
        return;
      }

      // Simulate latency
      if (this.currentConditions.latency && this.currentConditions.latency > 0) {
        await new Promise(resolve => setTimeout(resolve, this.currentConditions.latency));
      }

      // Simulate bandwidth throttling (simplified)
      if (this.currentConditions.bandwidth) {
        const response = await route.fetch();
        const body = await response.body();
        
        // Calculate delay based on bandwidth limit
        const delayMs = (body.length / this.currentConditions.bandwidth!) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        await route.fulfill({
          status: response.status(),
          headers: response.headers(),
          body: body,
        });
      } else {
        // Continue normally
        await route.continue();
      }
    };

    this.routeHandlers.add(handler);
    await this.page.route('**/*', handler);
  }

  /**
   * Set packet loss rate (0.0 - 1.0)
   * Example: 0.25 = 25% packet loss
   */
  async setPacketLoss(rate: number): Promise<void> {
    if (rate < 0 || rate > 1) {
      throw new Error('Packet loss rate must be between 0 and 1');
    }
    await this.applyConditions({ packetLoss: rate });
  }

  /**
   * Set network latency in milliseconds
   */
  async setLatency(latencyMs: number): Promise<void> {
    if (latencyMs < 0) {
      throw new Error('Latency must be non-negative');
    }
    await this.applyConditions({ latency: latencyMs });
  }

  /**
   * Set bandwidth limit in bytes per second
   */
  async setBandwidth(bytesPerSecond: number): Promise<void> {
    if (bytesPerSecond <= 0) {
      throw new Error('Bandwidth must be positive');
    }
    await this.applyConditions({ bandwidth: bytesPerSecond });
  }

  /**
   * Simulate complete network disconnection
   */
  async goOffline(): Promise<void> {
    await this.applyConditions({ offline: true });
  }

  /**
   * Restore network connection
   */
  async goOnline(): Promise<void> {
    await this.applyConditions({ offline: false });
  }

  /**
   * Clear all network conditions
   */
  async clearConditions(): Promise<void> {
    // Unroute all existing handlers
    const handlersArray = Array.from(this.routeHandlers);
    for (const handler of handlersArray) {
      await this.page.unroute('**/*', handler);
    }
    this.routeHandlers.clear();
    this.currentConditions = {};
  }

  /**
   * Simulate slow 3G connection
   */
  async setSlow3G(): Promise<void> {
    await this.applyConditions({
      latency: 400,
      bandwidth: 50 * 1024, // 50 KB/s
    });
  }

  /**
   * Simulate fast 3G connection
   */
  async setFast3G(): Promise<void> {
    await this.applyConditions({
      latency: 200,
      bandwidth: 200 * 1024, // 200 KB/s
    });
  }

  /**
   * Simulate 4G connection
   */
  async set4G(): Promise<void> {
    await this.applyConditions({
      latency: 50,
      bandwidth: 1.5 * 1024 * 1024, // 1.5 MB/s
    });
  }

  /**
   * Simulate WiFi handoff (brief disconnection)
   */
  async simulateHandoff(disconnectMs: number = 2000): Promise<void> {
    await this.goOffline();
    await new Promise(resolve => setTimeout(resolve, disconnectMs));
    await this.goOnline();
  }

  /**
   * Simulate intermittent connectivity (periodic disconnections)
   */
  async simulateIntermittent(
    onDuration: number = 10000,
    offDuration: number = 2000,
    iterations: number = 5
  ): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      await this.goOnline();
      await new Promise(resolve => setTimeout(resolve, onDuration));
      
      await this.goOffline();
      await new Promise(resolve => setTimeout(resolve, offDuration));
    }
    
    // End in online state
    await this.goOnline();
  }

  /**
   * Get current network conditions
   */
  getCurrentConditions(): NetworkConditions {
    return { ...this.currentConditions };
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return this.currentConditions.offline === true;
  }
}

/**
 * USAGE EXAMPLES:
 * 
 * Basic packet loss simulation:
 *   const simulator = new NetworkSimulator(page);
 *   await simulator.setPacketLoss(0.1); // 10% packet loss
 * 
 * High latency simulation:
 *   await simulator.setLatency(2000); // 2 second delay
 * 
 * Complete disconnection:
 *   await simulator.goOffline();
 *   // ... test offline behavior
 *   await simulator.goOnline();
 * 
 * Slow 3G connection:
 *   await simulator.setSlow3G();
 * 
 * WiFi handoff:
 *   await simulator.simulateHandoff(3000); // 3 second disconnection
 * 
 * Intermittent connectivity:
 *   await simulator.simulateIntermittent(10000, 2000, 3); // 10s on, 2s off, 3 times
 * 
 * Clear all conditions:
 *   await simulator.clearConditions();
 */

/**
 * Predefined network profiles for common scenarios
 */
export const NetworkProfiles = {
  SLOW_3G: {
    latency: 400,
    bandwidth: 50 * 1024, // 50 KB/s
    packetLoss: 0.05, // 5% packet loss
  },
  
  FAST_3G: {
    latency: 200,
    bandwidth: 200 * 1024, // 200 KB/s
    packetLoss: 0.02, // 2% packet loss
  },
  
  LTE_4G: {
    latency: 50,
    bandwidth: 1.5 * 1024 * 1024, // 1.5 MB/s
    packetLoss: 0.01, // 1% packet loss
  },
  
  WIFI: {
    latency: 20,
    bandwidth: 10 * 1024 * 1024, // 10 MB/s
    packetLoss: 0.001, // 0.1% packet loss
  },
  
  POOR_WIFI: {
    latency: 150,
    bandwidth: 500 * 1024, // 500 KB/s
    packetLoss: 0.15, // 15% packet loss
  },
};

/**
 * LIMITATIONS & RECOMMENDATIONS:
 * 
 * This is a simplified network simulator suitable for basic testing.
 * 
 * Limitations:
 * - Packet loss is simulated via request abortion (not true packet loss)
 * - Latency applies to entire requests (not individual packets)
 * - Cannot simulate jitter or out-of-order packets
 * - WebSocket connections may not behave exactly like real network issues
 * 
 * For production-grade network simulation, use:
 * - Toxiproxy: https://github.com/Shopify/toxiproxy
 * - Network Link Conditioner (macOS)
 * - Charles Proxy with throttling
 * - Chrome DevTools Network Throttling (for browser-based tests)
 */
