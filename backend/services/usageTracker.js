import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const USAGE_FILE = path.join(DATA_DIR, 'api_usage.json');

// Ensure stats structure
const INITIAL_STATS = {
    daily: {},
    total_requests: 0,
    last_updated: null
};

// Helper to ensure file exists
function ensureFile() {
    if (!fs.existsSync(USAGE_FILE)) {
        fs.writeFileSync(USAGE_FILE, JSON.stringify(INITIAL_STATS, null, 2));
    }
}

// Read stats
export function getUsageStats() {
    ensureFile();
    try {
        const data = fs.readFileSync(USAGE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading usage file:", err);
        return INITIAL_STATS;
    }
}

// Track a request
export function trackApiUsage(apiName = 'tomtom') {
    ensureFile();
    const stats = getUsageStats();
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

    // Increment breakdown (e.g., 'routing', 'tile', 'matrix')
    if (!stats.daily[today].breakdown[apiName]) {
        stats.daily[today].breakdown[apiName] = 0;
    }
    stats.daily[today].breakdown[apiName]++;

    stats.last_updated = new Date().toISOString();

    try {
        fs.writeFileSync(USAGE_FILE, JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error("Error writing usage stats:", err);
    }

    // Simple Monitoring Check
    checkLimits(stats.daily[today].requests);
}

// Simple threshold check
function checkLimits(dailyCount) {
    const LIMIT = 2500;
    const WARNING_THRESHOLD = 2000; // 80%

    if (dailyCount === WARNING_THRESHOLD) {
        console.warn(`⚠️ WARNING: API Usage reached 80% (${dailyCount}/${LIMIT}) for today!`);
        // Here you could add email notification logic
    } else if (dailyCount >= LIMIT) {
        console.error(`🚨 CRITICAL: API Usage limit reached (${dailyCount}/${LIMIT})!`);
    }
}
