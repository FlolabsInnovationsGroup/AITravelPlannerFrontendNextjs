/* eslint-disable max-classes-per-file */
/**
 * Enhanced location caching system for improved performance
 * Best practices for travel apps with frequently accessed location data
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiry: number;
}

export interface CacheOptions {
    defaultTTL: number; // Time to live in milliseconds
    maxSize: number;    // Maximum number of cache entries
    cleanupInterval: number; // How often to clean expired entries (ms)
}

export class LocationCache {
    private cache = new Map<string, CacheEntry<any>>();

    private options: CacheOptions;

    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor(options: Partial<CacheOptions> = {}) {
        this.options = {
            defaultTTL: 5 * 60 * 1000,     // 5 minutes default
            maxSize: 1000,                  // 1000 locations max
            cleanupInterval: 60 * 1000,     // Clean every minute
            ...options
        };

        this.startCleanupTimer();
    }

    // Cache location data with custom TTL
    set<T>(key: string, data: T, ttl?: number): void {
        const now = Date.now();
        const expiry = now + (ttl || this.options.defaultTTL);

        // If cache is at max size, remove oldest entries
        if (this.cache.size >= this.options.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            timestamp: now,
            expiry
        });
    }

    // Retrieve cached data
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    // Check if key exists and is not expired
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    // Remove specific key
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    // Clear all cache
    clear(): void {
        this.cache.clear();
    }

    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.options.maxSize,
            hitRate: this.calculateHitRate(),
            oldestEntry: this.getOldestTimestamp(),
            newestEntry: this.getNewestTimestamp()
        };
    }

    // Clean expired entries
    private cleanup(): void {
        const now = Date.now();
        const toDelete: string[] = [];

        Array.from(this.cache.entries()).forEach(([key, entry]) => {
            if (now > entry.expiry) {
                toDelete.push(key);
            }
        });

        toDelete.forEach(key => this.cache.delete(key));

        if (toDelete.length > 0) {
            console.debug(`Cache cleanup: removed ${toDelete.length} expired entries`);
        }
    }

    // Evict oldest entries when at max size
    // eslint-disable-next-line class-methods-use-this
    private evictOldest(): void {
        const entries = Array.from(this.cache.entries());
        const oldestEntry = entries.reduce<{ key: string; time: number } | null>(
            (oldest, [key, entry]) => {
                if (oldest === null || entry.timestamp < oldest.time) {
                    return { key, time: entry.timestamp };
                }
                return oldest;
            },
            null
        );

        if (oldestEntry) {
            this.cache.delete(oldestEntry.key);
        }
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.options.cleanupInterval);
    }

    private stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    // eslint-disable-next-line class-methods-use-this
    private calculateHitRate(): number {
        // This would need to track hits/misses in a real implementation
        return 0; // Placeholder
    }

    private getOldestTimestamp(): number | null {
        const entries = Array.from(this.cache.values());
        return entries.reduce<number | null>((oldest, entry) => {
            if (oldest === null || entry.timestamp < oldest) {
                return entry.timestamp;
            }
            return oldest;
        }, null);
    }

    private getNewestTimestamp(): number | null {
        const entries = Array.from(this.cache.values());
        return entries.reduce<number | null>((newest, entry) => {
            if (newest === null || entry.timestamp > newest) {
                return entry.timestamp;
            }
            return newest;
        }, null);
    }

    // Cleanup when cache is no longer needed
    destroy(): void {
        this.stopCleanupTimer();
        this.clear();
    }
}

// Specialized cache for different types of location data
export class LocationDataCache {
    private sessionCache = new LocationCache({ defaultTTL: 10 * 60 * 1000 }); // 10 min for sessions

    private placeDetailsCache = new LocationCache({ defaultTTL: 60 * 60 * 1000 }); // 1 hour for place details

    private geocodingCache = new LocationCache({ defaultTTL: 24 * 60 * 60 * 1000 }); // 24 hours for geocoding

    // Cache session locations
    cacheSessionLocations(sessionId: string, locations: any[]): void {
        this.sessionCache.set(`session:${sessionId}`, locations);
    }

    getSessionLocations(sessionId: string): any[] | null {
        return this.sessionCache.get(`session:${sessionId}`);
    }

    // Cache Google Places details
    cachePlaceDetails(placeId: string, details: any): void {
        this.placeDetailsCache.set(`place:${placeId}`, details);
    }

    getPlaceDetails(placeId: string): any | null {
        return this.placeDetailsCache.get(`place:${placeId}`);
    }

    // Cache geocoding results
    cacheGeocodingResult(query: string, result: any): void {
        this.geocodingCache.set(`geo:${query}`, result);
    }

    getGeocodingResult(query: string): any | null {
        return this.geocodingCache.get(`geo:${query}`);
    }

    // Get combined statistics
    getAllStats() {
        return {
            sessions: this.sessionCache.getStats(),
            places: this.placeDetailsCache.getStats(),
            geocoding: this.geocodingCache.getStats()
        };
    }

    // Clear all caches
    clearAll(): void {
        this.sessionCache.clear();
        this.placeDetailsCache.clear();
        this.geocodingCache.clear();
    }

    // Destroy all caches
    destroy(): void {
        this.sessionCache.destroy();
        this.placeDetailsCache.destroy();
        this.geocodingCache.destroy();
    }
}
