import express from 'express';
import { getResortCongestionAnalysis, checkDataAvailability } from '../services/trafficAnalysis.js';

const router = express.Router();

// GET /api/traffic-analysis/:resortId - Get congestion analysis for a resort
router.get('/:resortId', async (req, res) => {
    try {
        const { resortId } = req.params;
        const days = parseInt(req.query.days) || 7;

        const analysis = await getResortCongestionAnalysis(resortId, days);
        res.json(analysis);

    } catch (error) {
        console.error('Traffic analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze traffic data' });
    }
});

// GET /api/traffic-analysis/:resortId/availability - Check data availability
router.get('/:resortId/availability', async (req, res) => {
    try {
        const { resortId } = req.params;
        const availability = await checkDataAvailability(resortId);
        res.json(availability);

    } catch (error) {
        console.error('Data availability check error:', error);
        res.status(500).json({ error: 'Failed to check data availability' });
    }
});

export default router;
