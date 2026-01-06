// Simple in-memory cache with TTL (Time To Live)
class Cache {
    constructor(ttlMs = 5 * 60 * 1000) { // Default 5 minutes
        this.cache = new Map();
        this.ttl = ttlMs;
    }

    set(key, value) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }

    // Get cache stats
    getStats() {
        const now = Date.now();
        let valid = 0;
        let expired = 0;

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                expired++;
            } else {
                valid++;
            }
        }

        return { valid, expired, total: this.cache.size };
    }

    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

// Create cache instances
export const parserCache = new Cache(5 * 60 * 1000); // 5 minutes for parser data
export const weatherCache = new Cache(30 * 60 * 1000); // 30 minutes for weather data
export const trafficCache = new Cache(30 * 60 * 1000); // 30 minutes for traffic data

// Cleanup expired entries every minute
const cleanupInterval = setInterval(() => {
    parserCache.cleanup();
    weatherCache.cleanup();
    trafficCache.cleanup();
}, 60 * 1000);

// Allow Node to exit even if this interval is running
if (cleanupInterval.unref) {
    cleanupInterval.unref();
}
