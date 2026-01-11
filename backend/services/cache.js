// Simple in-memory cache with TTL (Time To Live) and Disk Persistence
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const CACHE_FILE = path.join(DATA_DIR, 'cache_dump.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Cache {
    constructor(ttlMs = 5 * 60 * 1000, name = 'default') { // Added name for logging
        this.cache = new Map();
        this.ttl = ttlMs;
        this.name = name;
    }

    set(key, value) {
        // Get existing history if available
        const existing = this.cache.get(key);
        let history = existing ? (existing.history || []) : [];

        // Add new timestamp if present and unique
        if (value && value.lastUpdated) {
            // Check if it's already in history
            if (!history.includes(value.lastUpdated)) {
                history.push(value.lastUpdated);
            }
        }

        // Cleanup: Keep only today's updates
        const today = new Date().toISOString().split('T')[0];
        history = history.filter(ts => ts.startsWith(today) || new Date(ts).toISOString().startsWith(today));

        this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
            history: history
        });
    }

    getHistory(key) {
        const item = this.cache.get(key);
        return item ? (item.history || []) : [];
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

    // Export state for persistence
    toJSON() {
        return Array.from(this.cache.entries());
    }

    // Import state from persistence
    fromJSON(entries) {
        this.cache = new Map(entries);
    }
}

// Create cache instances
export const parserCache = new Cache(24 * 60 * 60 * 1000, 'parser'); // 24 hours for parser data
export const weatherCache = new Cache(5 * 60 * 60 * 1000, 'weather'); // 5 hours (matching 4h schedule + buffer)
export const trafficCache = new Cache(2 * 60 * 60 * 1000, 'traffic'); // 2 hours for traffic

// Persistence Helpers
export function saveAllCaches() {
    try {
        const dump = {
            parser: parserCache.toJSON(),
            weather: weatherCache.toJSON(),
            traffic: trafficCache.toJSON(),
            timestamp: Date.now()
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(dump));
        console.log(`[Cache] 💾 Saved cache state to disk (${parserCache.size()} parsers, ${trafficCache.size()} traffic)`);
    } catch (err) {
        console.error('[Cache] Failed to save cache:', err);
    }
}

export function loadAllCaches() {
    try {
        if (!fs.existsSync(CACHE_FILE)) {
            console.log('[Cache] No cache file found. Starting empty.');
            return;
        }
        const data = fs.readFileSync(CACHE_FILE, 'utf8');
        const dump = JSON.parse(data);

        if (dump.parser) parserCache.fromJSON(dump.parser);
        if (dump.weather) weatherCache.fromJSON(dump.weather);
        if (dump.traffic) trafficCache.fromJSON(dump.traffic);

        console.log(`[Cache] 📂 Loaded cache state from disk (${parserCache.size()} parsers, ${trafficCache.size()} traffic)`);
    } catch (err) {
        console.error('[Cache] Failed to load cache:', err);
    }
}

// Cleanup expired entries every minute
const cleanupInterval = setInterval(() => {
    parserCache.cleanup();
    weatherCache.cleanup();
    trafficCache.cleanup();
}, 60 * 1000);

// Save cache periodically (every 10 minutes)
const saveInterval = setInterval(() => {
    saveAllCaches();
}, 10 * 60 * 1000);

// Load on startup
loadAllCaches();

// Allow Node to exit even if this interval is running
if (cleanupInterval.unref) cleanupInterval.unref();
if (saveInterval.unref) saveInterval.unref();

// Save on exit
process.on('SIGINT', () => { saveAllCaches(); process.exit(); });
process.on('SIGTERM', () => { saveAllCaches(); process.exit(); });
