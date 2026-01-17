import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUsageStats } from "../services/system/usage.js";
import { webcamMonitor } from "../services/system/monitoring.js";
import { getAllResortsLive, forceRefreshResort, getResortsStatus } from "../services/resorts/service.js";
import { fetchTravelTimes } from "../services/tomtom.js"; // Import TomTom service
import { parserCache, weatherCache, trafficCache } from "../services/cache.js";
import { sentryService } from "../services/integrations/sentry.js";
import githubService from "../services/integrations/github.js";
import { refreshWeather } from "../services/scheduler.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../logs');
const DATA_DIR = path.join(__dirname, '../data');

const router = express.Router();

// GET /api/admin/usage
router.get("/usage", (req, res) => {
    try {
        const stats = getUsageStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch usage stats" });
    }
});

// GET /api/admin/system (Cache & Data status)
router.get("/system", (req, res) => {
    try {
        const cacheStats = {
            parser: { size: parserCache.size(), valid: parserCache.getStats().valid },
            weather: { size: weatherCache.size(), valid: weatherCache.getStats().valid },
            traffic: { size: trafficCache.size(), valid: trafficCache.getStats().valid }
        };

        const csvPath = path.join(DATA_DIR, 'traffic_history.csv');
        let trafficCsv = { exists: false, size: 0, lastModified: null };
        if (fs.existsSync(csvPath)) {
            const s = fs.statSync(csvPath);
            trafficCsv = { exists: true, size: (s.size / 1024 / 1024).toFixed(2) + ' MB', lastModified: s.mtime };
        }

        res.json({ cache: cacheStats, traffic_csv: trafficCsv });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/admin/cache/clear
router.post("/cache/clear", (req, res) => {
    const { type } = req.body;
    if (type === 'parser' || type === 'all') parserCache.clear();
    if (type === 'weather' || type === 'all') weatherCache.clear();
    if (type === 'traffic' || type === 'all') trafficCache.clear();
    res.json({ success: true });
});

// GET /api/admin/logs
router.get("/logs", (req, res) => {
    try {
        const type = req.query.type || 'combined';
        if (!fs.existsSync(LOG_DIR)) return res.json({ logs: [] });

        const files = fs.readdirSync(LOG_DIR)
            .filter(f => f.startsWith(type) && f.endsWith('.log'))
            .sort().reverse();

        if (files.length === 0) return res.json({ logs: [] });

        const latestFile = path.join(LOG_DIR, files[0]);
        const stats = fs.statSync(latestFile);
        const MAX_BYTES = 100 * 1024; // 100KB Tail
        const start = Math.max(0, stats.size - MAX_BYTES);

        const stream = fs.createReadStream(latestFile, { start, encoding: 'utf8' });
        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => {
            const lines = data.split('\n').filter(l => l.trim().length > 0);
            // Skip first potentially partial line
            const validLines = start > 0 ? lines.slice(1) : lines;

            const result = validLines.reverse().map(line => {
                try { return JSON.parse(line); } catch { return { message: line, timestamp: '?' }; }
            });

            res.json({ file: files[0], logs: result });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/webcams
router.get("/webcams", (req, res) => {
    res.json(webcamMonitor.getStatus());
});

// POST /api/admin/webcams/check
router.post("/webcams/check", async (req, res) => {
    try {
        const result = await webcamMonitor.checkAllWebcams();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/weather
router.get("/weather", async (req, res) => {
    try {
        const resorts = getResortsStatus();
        const data = resorts.map(resort => {
            const cached = weatherCache.get(resort.id);
            return {
                id: resort.id,
                name: resort.name,
                country: resort.country,
                // weatherCache stores: { forecast, current, timestamp }
                // current: { weather, emoji, snow, temp }
                status: cached ? 'active' : 'missing',
                current: cached ? cached.current : null,
                lastUpdated: cached ? cached.timestamp : null
            };
        });
        res.json(data);
    } catch (error) {
        console.error("Admin Weather Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/weather/refresh
router.post("/weather/refresh", (req, res) => {
    // Fire and forget to avoid timeout
    refreshWeather().catch(err => console.error("Manual Weather Refresh Failed:", err));
    res.json({ message: "Weather refresh triggered in background. Updates will appear shortly." });
});

// POST /api/admin/weather/test
router.post("/weather/test", async (req, res) => {
    try {
        const { getWeatherForecast } = await import("../services/weather/forecast.js");
        // Test Munich Coordinates
        const result = await getWeatherForecast(48.1351, 11.5820);
        if (!result) {
            return res.status(500).json({ error: "Weather Service returned null (Breaker Open or Fetch Failed)" });
        }
        res.json({ success: true, data: result.currentConditions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/parsers
router.get("/parsers", async (req, res) => {
    try {
        console.log("[Admin Parsers] Starting getResortsStatus...");
        // Use fast status check instead of potentially triggering scrapes
        const resorts = getResortsStatus();
        console.log(`[Admin Parsers] Success: ${resorts?.length} resorts`);

        // Pass full data object to frontend
        res.json(resorts);
    } catch (error) {
        console.error("[Admin Parsers] ERROR:", error.message);
        console.error("[Admin Parsers] Stack:", error.stack);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/parsers/refresh/:id
router.post("/parsers/refresh/:id", async (req, res) => {
    try {
        const result = await forceRefreshResort(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/traffic/test
router.post("/traffic/test", async (req, res) => {
    try {
        console.log("🚦 Testing TomTom API connection...");
        // Test Munich to Zugspitze (Resort ID: zugspitze)
        const testDestination = [{ id: 'test-zugspitze', latitude: 47.4211, longitude: 10.9854 }];

        // This function tracks usage internally, so it will show up in usage stats
        const result = await fetchTravelTimes(testDestination);

        // Check if result is empty (common failure mode)
        if (!result || Object.keys(result).length === 0) {
            return res.json({ success: false, error: "API returned empty result (Check API Key or Quota)" });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Traffic Test Failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/sentry/issues - Fetch unresolved Sentry issues
router.get("/sentry/issues", async (req, res) => {
    try {
        const issues = await sentryService.getIssues(10);
        res.json(issues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/github/status - Fetch latest GitHub Actions run
router.get("/github/status", async (req, res) => {
    try {
        const status = await githubService.fetchLatestRun();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
