import express from "express";
import {
    statusLogger,
    webcamMonitor,
    getDatabaseSize,
    checkDatabaseHealth,
    cleanupOldTrafficLogs,
    cleanupOldSnapshots,
    runDatabaseMaintenance
} from "../services/system/monitoring.js";
import { parserCache, weatherCache, trafficCache } from "../services/cache.js";
import { checkConnection } from "../services/db.js";

export const statusRouter = express.Router();
export const dbHealthRouter = express.Router();

// -- STATUS (Mounted at /api/status) --

statusRouter.get("/", async (req, res) => {
    const dbStatus = await checkConnection();
    if (dbStatus.ok) statusLogger.updateComponentStatus('database', 'healthy');
    else {
        statusLogger.updateComponentStatus('database', 'down');
        statusLogger.log('error', 'db', `Health check failed: ${dbStatus.message}`);
    }

    const webcamStatus = webcamMonitor.getStatus();
    res.json({
        components: statusLogger.getStatus(),
        database: { connected: dbStatus.ok, message: dbStatus.message },
        cache: { parser: parserCache.getStats(), weather: weatherCache.getStats(), traffic: trafficCache.getStats() },
        webcams: { summary: webcamStatus.summary, lastCheck: webcamStatus.lastCheck, problematic: webcamMonitor.getStatus().webcams.filter(w => w.status !== 'ok') },
        metrics: statusLogger.getMetrics(),
        logs: statusLogger.getLogs(),
        monitoring: { sentry: true }, // Sentry is always configured in production
        uptime: process.uptime()
    });
});

statusRouter.get("/webcams", (req, res) => res.json(webcamMonitor.getStatus()));
statusRouter.post("/webcams/check", async (req, res) => {
    try {
        const result = await webcamMonitor.checkAllWebcams();
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// -- DB HEALTH (Mounted at /api/db-health) --

dbHealthRouter.get('/', async (req, res) => {
    try {
        res.json(await checkDatabaseHealth());
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

dbHealthRouter.get('/size', async (req, res) => {
    try {
        res.json(await getDatabaseSize());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

dbHealthRouter.post('/cleanup', async (req, res) => {
    try {
        const { trafficDays, snapshotDays } = req.body;
        const tDeleted = await cleanupOldTrafficLogs(trafficDays || 30);
        const sDeleted = await cleanupOldSnapshots(snapshotDays || 90);
        const newSize = await getDatabaseSize();
        res.json({ success: true, trafficDeleted: tDeleted, snapshotsDeleted: sDeleted, newSize });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

dbHealthRouter.post('/maintenance', async (req, res) => {
    try {
        res.json(await runDatabaseMaintenance());
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});
