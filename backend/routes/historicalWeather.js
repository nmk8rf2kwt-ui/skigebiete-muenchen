import express from 'express';
import { getWeatherHistory } from '../services/history.js';
import { getStaticResorts } from '../services/resortManager.js';

const router = express.Router();

/**
 * GET /api/historical-weather/:resortId
 * Query params: days (default: 30, max: 365)
 * Returns historical weather data for a specific resort
 */
router.get('/:resortId', async (req, res) => {
    const { resortId } = req.params;
    const days = Math.min(parseInt(req.query.days) || 30, 365);

    // Validate resort exists
    const resorts = getStaticResorts();
    const resort = resorts.find(r => r.id === resortId);

    if (!resort) {
        return res.status(404).json({
            error: 'Resort not found',
            resortId
        });
    }

    try {
        const weatherHistory = await getWeatherHistory(resortId, days);

        res.json({
            resortId,
            resortName: resort.name,
            days: weatherHistory.length,
            data: weatherHistory
        });
    } catch (error) {
        console.error(`Error fetching weather history for ${resortId}:`, error);
        res.status(500).json({
            error: 'Failed to fetch weather history',
            message: error.message
        });
    }
});

export default router;
