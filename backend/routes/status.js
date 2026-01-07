import express from "express";
import { statusLogger } from "../services/statusLogger.js";
import { parserCache, weatherCache, trafficCache } from "../services/cache.js";
import { checkConnection } from "../services/db.js";

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

    // 3. Assemble Response
    const response = {
        components: statusLogger.getStatus(),
        database: {
            connected: dbStatus.ok,
            message: dbStatus.message
        },
        cache: cacheStats,
        logs: statusLogger.getLogs(),
        uptime: process.uptime()
    };

    res.json(response);
});

export default router;
