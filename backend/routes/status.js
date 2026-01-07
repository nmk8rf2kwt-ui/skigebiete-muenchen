import express from "express";
import { statusLogger } from "../services/statusLogger.js";
import { parserCache, weatherCache, trafficCache } from "../services/cache.js";
import { checkConnection } from "../services/db.js";
import { webcamMonitor } from "../services/webcamMonitor.js";

const router = express.Router();

router.get("/", async (req, res) => {
    // 1. Get Component Health
    const dbStatus = await checkConnection();

    // Update logger with DB status
    if (dbStatus.ok) {
        statusLogger.updateComponentStatus('database', 'healthy');
    } else {
        statusLogger.updateComponentStatus('database', 'down');
        statusLogger.log('error', 'db', `Health check failed: ${dbStatus.message}`);
    }

    // 2. Get Cache Stats
    const cacheStats = {
        parser: parserCache.getStats(),
        weather: weatherCache.getStats(),
        traffic: trafficCache.getStats()
    };

    // 3. Get Webcam Status
    const webcamStatus = webcamMonitor.getStatus();
    const problematicWebcams = webcamMonitor.getProblematicWebcams();

    // 4. Assemble Response
    const response = {
        components: statusLogger.getStatus(),
        monitoring: {
            sentry: !!process.env.SENTRY_DSN
        },
        database: {
            connected: dbStatus.ok,
            message: dbStatus.message
        },
        cache: cacheStats,
        webcams: {
            summary: webcamStatus.summary,
            lastCheck: webcamStatus.lastCheck,
            problematic: problematicWebcams.map(w => ({
                resortId: w.resortId,
                url: w.url,
                status: w.status,
                error: w.error,
                statusCode: w.statusCode
            }))
        },
        metrics: statusLogger.getMetrics(),
        logs: statusLogger.getLogs(),
        uptime: process.uptime()
    };

    res.json(response);
});

// Dedicated webcam status endpoint
router.get("/webcams", (req, res) => {
    const status = webcamMonitor.getStatus();
    res.json(status);
});

// Trigger manual webcam check
router.post("/webcams/check", async (req, res) => {
    try {
        const result = await webcamMonitor.checkAllWebcams();
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
