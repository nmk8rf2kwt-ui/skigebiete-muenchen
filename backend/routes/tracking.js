import express from 'express';
import { logAffiliateClick } from '../services/tracking.js';

const router = express.Router();

// Public endpoint to log a click (GET because it's often a redirect or simple beacon)
router.get('/click', async (req, res) => {
    const { resortId, type } = req.query;

    if (!resortId || !type) {
        return res.status(400).json({ error: 'Missing resortId or type' });
    }

    await logAffiliateClick(resortId, type);

    // In a real scenario, we might redirect to the actual affiliate URL here
    // For now, we just acknowledge the tracking
    res.json({ status: 'tracked' });
});

export default router;
