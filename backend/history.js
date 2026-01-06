import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// history.js is in backend/, resorts.json is in backend/, data is in backend/data
const DATA_DIR = path.join(__dirname, 'data/history');
const TRAFFIC_DIR = path.join(__dirname, 'data/traffic');
const RESORTS_FILE = path.join(__dirname, 'resorts.json');
const RETENTION_DAYS = 30;

// Load allowed resorts once
let ALLOWED_RESORTS = new Set();
try {
    const data = fs.readFileSync(RESORTS_FILE, 'utf8');
    const resorts = JSON.parse(data);
    resorts.forEach(r => ALLOWED_RESORTS.add(r.id));
} catch (err) {
    console.error("Warning: history.js could not load resorts.json for validation:", err.message);
}

// Validation Helper
function isValidResort(resortId) {
    if (!resortId || typeof resortId !== 'string') return false;
    // Fail closed: If list failed to load, deny all to be safe
    if (ALLOWED_RESORTS.size === 0) return false;
    return ALLOWED_RESORTS.has(resortId);
}

// Ensure data directory exists
function ensureDataDir(resortId) {
    if (!isValidResort(resortId)) {
        throw new Error(`Invalid resort ID: ${resortId}`);
    }
    const dir = path.join(DATA_DIR, resortId);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

// Save daily snapshot
export function saveSnapshot(resortId, data) {
    try {
        const dir = ensureDataDir(resortId);
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = path.join(dir, `${date}.json`);

        const snapshot = {
            resortId,
            date,
            timestamp: new Date().toISOString(),
            data: {
                liftsOpen: data.liftsOpen || null,
                liftsTotal: data.liftsTotal || null,
                snow: data.snow || null,
                weather: data.weather || null,
                // Historical weather data from Open-Meteo
                historicalWeather: data.historicalWeather || null,
                // NEW: Store detailed lift/slope data if available
                lifts: data.lifts || null,
                slopes: data.slopes || null,
                // NEW: Store pricing history
                price: data.price || null,
                priceDetail: data.priceDetail || null
            }
        };

        fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
        return true;
    } catch (error) {
        console.error(`Error saving snapshot for ${resortId}:`, error);
        return false;
    }
}

// Ensure traffic directory exists
function ensureTrafficDir() {
    if (!fs.existsSync(TRAFFIC_DIR)) {
        fs.mkdirSync(TRAFFIC_DIR, { recursive: true });
    }
}

// Save traffic log
export function saveTrafficLog(resortId, standardTime, currentTime) {
    try {
        ensureTrafficDir();
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        const filename = path.join(TRAFFIC_DIR, `${dateStr}_traffic.csv`);

        // CSV Header if file doesn't exist
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, "Timestamp,ResortId,StandardTime,CurrentTime,Delay\n");
        }

        const delay = Math.max(0, currentTime - standardTime);
        const line = `${timeStr},${resortId},${standardTime},${currentTime},${delay}\n`;

        fs.appendFileSync(filename, line);
        return true;
    } catch (error) {
        console.error(`Error saving traffic log for ${resortId}:`, error.message);
        return false;
    }
}

// Save matrix traffic log (for a specific city -> resort)
export function saveMatrixTrafficLog(cityId, cityName, resortId, duration, delay) {
    try {
        ensureTrafficDir();

        // Sanitize cityId for filename
        const safeCityId = cityId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = path.join(TRAFFIC_DIR, `traffic_${safeCityId}.csv`);

        const date = new Date();
        // CSV Header if file doesn't exist
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, "Timestamp,ResortId,DurationMin,DelayMin\n");
        }

        const isoTime = date.toISOString(); // Use ISO for sorting
        const line = `${isoTime},${resortId},${duration},${delay}\n`;

        fs.appendFileSync(filename, line);
        return true;
    } catch (error) {
        console.error(`Error saving matrix log for ${cityId} -> ${resortId}:`, error.message);
        return false;
    }
}

// Deprecated: Old single-file city log
export function saveCityTrafficLog(trafficData) {
    // ... (kept for backward compatibility if needed, or simply replaced)
    // I will overwrite it effectively or just place the new one above/below.
    // I'll leave the old code but just add the new function export.
    // Actually, the previous implementation of saveCityTrafficLog is at lines 111-149.
    // I will replace that block with the new generic function AND the deprecated one if I want, 
    // but since I'm rewriting the scheduler, I'll just use the new one.
    // I will ADD the new function at the end of the file or after saveTrafficLog.
    return false;
}

// Get history for last N days
export function getHistory(resortId, days = 7) {
    try {
        const dir = path.join(DATA_DIR, resortId);
        if (!fs.existsSync(dir)) {
            return [];
        }

        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse()
            .slice(0, days);

        const history = files.map(file => {
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            return JSON.parse(content);
        }).reverse(); // Oldest first

        return history;
    } catch (error) {
        console.error(`Error reading history for ${resortId}:`, error);
        return [];
    }
}

// Calculate trends
export function getTrends(resortId) {
    const history = getHistory(resortId, 7);

    if (history.length < 2) {
        return {
            resortId,
            snowTrend: 'unknown',
            snowChange: null,
            avgLiftsOpen: null,
            bestDays: []
        };
    }

    // Snow trend
    const snowValues = history
        .map(h => parseInt(h.data.snow))
        .filter(v => !isNaN(v));

    let snowTrend = 'stable';
    let snowChange = null;

    if (snowValues.length >= 2) {
        const first = snowValues[0];
        const last = snowValues[snowValues.length - 1];
        const change = last - first;

        snowChange = `${change > 0 ? '+' : ''}${change}cm (${snowValues.length} days)`;

        if (change > 10) snowTrend = 'increasing';
        else if (change < -10) snowTrend = 'decreasing';
        else snowTrend = 'stable';
    }

    // Average lifts open
    const liftValues = history
        .map(h => h.data.liftsOpen)
        .filter(v => v !== null && v !== undefined);

    const avgLiftsOpen = liftValues.length > 0
        ? (liftValues.reduce((a, b) => a + b, 0) / liftValues.length).toFixed(1)
        : null;

    // Best days (most lifts open)
    const bestDays = history
        .filter(h => h.data.liftsOpen !== null)
        .sort((a, b) => b.data.liftsOpen - a.data.liftsOpen)
        .slice(0, 3)
        .map(h => h.date);

    return {
        resortId,
        snowTrend,
        snowChange,
        avgLiftsOpen: parseFloat(avgLiftsOpen),
        bestDays
    };
}

// Cleanup old data
export function cleanup() {
    try {
        if (!fs.existsSync(DATA_DIR)) return;

        const resortDirs = fs.readdirSync(DATA_DIR);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

        let deletedCount = 0;

        resortDirs.forEach(resortId => {
            const dir = path.join(DATA_DIR, resortId);
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

            files.forEach(file => {
                const fileDate = new Date(file.replace('.json', ''));
                if (fileDate < cutoffDate) {
                    fs.unlinkSync(path.join(dir, file));
                    deletedCount++;
                }
            });
        });

        console.log(`Cleaned up ${deletedCount} old history files`);
        return deletedCount;
    } catch (error) {
        console.error('Error during cleanup:', error);
        return 0;
    }
}

// Get all resorts with history
export function getResortsWithHistory() {
    try {
        if (!fs.existsSync(DATA_DIR)) return [];
        return fs.readdirSync(DATA_DIR).filter(name => {
            return fs.statSync(path.join(DATA_DIR, name)).isDirectory();
        });
    } catch (error) {
        console.error('Error getting resorts with history:', error);
        return [];
    }
}

// Update historical weather for a specific date (used for backfill)
export function updateHistoricalWeather(resortId, date, weatherData) {
    try {
        const dir = ensureDataDir(resortId);
        const filename = path.join(dir, `${date}.json`);

        let snapshot;

        if (fs.existsSync(filename)) {
            // Load existing
            const content = fs.readFileSync(filename, 'utf8');
            snapshot = JSON.parse(content);
        } else {
            // Create new minimal snapshot
            snapshot = {
                resortId,
                date,
                timestamp: new Date().toISOString(), // Use current timestamp for "created/modified"
                data: {}
            };
        }

        // Ensure data object exists
        if (!snapshot.data) snapshot.data = {};

        // Update weather data
        snapshot.data.historicalWeather = weatherData;

        // Save
        fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
        return true;
    } catch (error) {
        console.error(`Error updating historical weather for ${resortId} on ${date}:`, error.message);
        return false;
    }
}

// Get weather history for a resort
export function getWeatherHistory(resortId, days = 30) {
    try {
        const history = getHistory(resortId, days);

        // Extract weather data from snapshots
        const weatherHistory = history.map(snapshot => {
            const weather = snapshot.data.historicalWeather;
            return {
                date: snapshot.date,
                tempMax: weather?.tempMax ?? null,
                tempMin: weather?.tempMin ?? null,
                precipitation: weather?.precipitation ?? null,
                snowfall: weather?.snowfall ?? null,
                snowDepth: weather?.snowDepth ?? null
            };
        }).filter(day => day.tempMax !== null || day.tempMin !== null); // Filter out days without data

        return weatherHistory;
    } catch (error) {
        console.error(`Error getting weather history for ${resortId}:`, error);
        return [];
    }
}

// Internal Helper to read Traffic CSV
function readTrafficCsv(cityId) {
    const safeCityId = cityId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = path.join(TRAFFIC_DIR, `traffic_${safeCityId}.csv`);

    if (!fs.existsSync(filename)) return [];

    try {
        const content = fs.readFileSync(filename, 'utf-8');
        const lines = content.trim().split('\n');

        // Skip header
        return lines.slice(1).map(line => {
            const [timestamp, resortId, duration, delay] = line.split(',');
            // Simple validation to ensure line has content
            if (!timestamp || !resortId) return null;

            return {
                timestamp,
                resortId,
                duration: parseFloat(duration),
                delay: parseFloat(delay)
            };
        }).filter(entry => entry !== null);
    } catch (error) {
        console.error(`Error reading traffic CSV for ${cityId}:`, error);
        return [];
    }
}

// Get full traffic history for a city
export function getCityTrafficHistory(cityId) {
    return readTrafficCsv(cityId);
}

// Get traffic history for a specific resort from a city
export function getResortTrafficHistory(cityId, resortId) {
    const allData = readTrafficCsv(cityId);
    return allData.filter(entry => entry.resortId === resortId);
}

// Check if backfill has been completed
export function isBackfillCompleted() {
    const flagPath = path.join(__dirname, 'data/.weather_backfill_completed');
    return fs.existsSync(flagPath);
}

// Mark backfill as completed
export function markBackfillCompleted() {
    const flagPath = path.join(__dirname, 'data/.weather_backfill_completed');
    const dataDir = path.dirname(flagPath);

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(flagPath, new Date().toISOString());
    console.log('✓ Weather backfill marked as completed');
}
