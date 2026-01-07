import express from 'express';
import {
    getDatabaseSize,
    checkDatabaseHealth,
    cleanupOldTrafficLogs,
    cleanupOldSnapshots,
    runDatabaseMaintenance
} from '../services/dbMonitoring.js';

const router = express.Router();

// GET /api/db-health - Get current database health status
router.get('/', async (req, res) => {
    try {
        const health = await checkDatabaseHealth();
        res.json(health);
    } catch (error) {
        console.error('Database health check error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// GET /api/db-health/size - Get detailed size information
router.get('/size', async (req, res) => {
    try {
        const sizeInfo = await getDatabaseSize();
        res.json(sizeInfo);
    } catch (error) {
        console.error('Database size check error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// POST /api/db-health/cleanup - Manually trigger cleanup
router.post('/cleanup', async (req, res) => {
    try {
        const { trafficDays, snapshotDays } = req.body;

        const trafficDeleted = await cleanupOldTrafficLogs(trafficDays || 30);
        const snapshotsDeleted = await cleanupOldSnapshots(snapshotDays || 90);

        // Get new size after cleanup
        const newSize = await getDatabaseSize();

        res.json({
            success: true,
            trafficDeleted,
            snapshotsDeleted,
            newSize: {
                totalSizeMB: newSize.totalSizeMB,
                percentUsed: newSize.percentUsed
            }
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/db-health/maintenance - Run full maintenance
router.post('/maintenance', async (req, res) => {
    try {
        const result = await runDatabaseMaintenance();
        res.json(result);
    } catch (error) {
        console.error('Maintenance error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;
