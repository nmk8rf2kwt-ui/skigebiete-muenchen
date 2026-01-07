import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const USAGE_FILE = process.env.USAGE_DB_PATH || path.join(DATA_DIR, 'api_usage.json');

// Ensure stats structure
const INITIAL_STATS = {
    daily: {},
    total_requests: 0,
    last_updated: null
};

// In-memory cache for performance (Non-blocking I/O)
let statsCache = null;
let saveTimer = null;

// Helper to ensure file exists and load data
function ensureStatsLoaded() {
    if (statsCache) return;

    if (!fs.existsSync(USAGE_FILE)) {
        // Create new
        statsCache = JSON.parse(JSON.stringify(INITIAL_STATS));
        try {
            // Sync write valid only on first creation
            fs.writeFileSync(USAGE_FILE, JSON.stringify(statsCache, null, 2));
        } catch (err) {
            console.error("Error creating usage file:", err);
        }
    } else {
        // Load existing
        try {
            const data = fs.readFileSync(USAGE_FILE, 'utf8');
            statsCache = JSON.parse(data);
        } catch (err) {
            console.error("Error reading usage file:", err);
            statsCache = JSON.parse(JSON.stringify(INITIAL_STATS));
        }
    }
}

// Read stats (from cache - O(1))
export function getUsageStats() {
    ensureStatsLoaded();
    return statsCache;
}

// Track a request (Updates cache, schedules async save)
export function trackApiUsage(apiName = 'tomtom') {
    ensureStatsLoaded();
    const stats = statsCache;
    const today = new Date().toISOString().split('T')[0];

    // Init daily entry if missing
    if (!stats.daily[today]) {
        stats.daily[today] = {
            requests: 0,
            breakdown: {}
        };
    }

    // Increment global
    stats.total_requests++;

    // Increment daily
    stats.daily[today].requests++;
    stats.daily[today].last_updated = new Date().toISOString();

    // Increment breakdown
    if (!stats.daily[today].breakdown[apiName]) {
        stats.daily[today].breakdown[apiName] = 0;
    }
    stats.daily[today].breakdown[apiName]++;

    stats.last_updated = new Date().toISOString();

    // Schedule Save (Debounce 5s) to avoid Disk I/O spam
    if (!saveTimer) {
        saveTimer = setTimeout(() => {
            saveStats();
        }, 5000);
    }

    // Simple Monitoring Check
    checkLimits(stats.daily[today].requests);
}

// Async save to disk
function saveStats() {
    if (!statsCache) return;

    fs.writeFile(USAGE_FILE, JSON.stringify(statsCache, null, 2), (err) => {
        if (err) console.error("Error writing usage stats:", err);
        saveTimer = null;
    });
}

// Simple threshold check
function checkLimits(dailyCount) {
    const LIMIT = 2500;
    const WARNING_THRESHOLD = 2000; // 80%

    if (dailyCount === WARNING_THRESHOLD) {
        console.warn(`⚠️ WARNING: API Usage reached 80% (${dailyCount}/${LIMIT}) for today!`);
    } else if (dailyCount >= LIMIT) {
        console.error(`🚨 CRITICAL: API Usage limit reached (${dailyCount}/${LIMIT})!`);
    }
}
