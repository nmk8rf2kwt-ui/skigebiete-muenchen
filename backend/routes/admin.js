import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUsageStats } from "../services/system/usage.js";
import { webcamMonitor } from "../services/system/monitoring.js";
import { getAllResortsLive, forceRefreshResort } from "../services/resorts/service.js";
import { parserCache, weatherCache, trafficCache } from "../services/cache.js";

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

// GET /api/admin/parsers
router.get("/parsers", async (req, res) => {
    try {
        const resorts = await getAllResortsLive();
        const summary = resorts.map(r => ({
            id: r.id,
            name: r.name,
            status: r.status,
            lifts: r.liftsOpen !== undefined && r.liftsTotal ? `${r.liftsOpen}/${r.liftsTotal}` : '-',
            lastUpdated: r.cached ? 'Used Cache' : 'Fresh',
            error: r.status === 'error' ? 'Error' : null
        }));
        res.json(summary);
    } catch (error) {
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

export default router;
