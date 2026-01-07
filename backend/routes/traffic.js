import express from "express";
import rateLimit from "express-rate-limit";
import { fetchTravelTimes as fetchTomTomTraffic } from "../services/tomtom.js";
import { getStaticResorts } from "../services/resortManager.js";

const router = express.Router();

// Rate limiting for traffic calculate endpoint
const trafficCalculateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Max 60 requests per 15 minutes per IP
    message: { error: "Too many traffic calculation requests. Please try again later." }
});

// POST /api/traffic/calculate
// Body: { latitude, longitude, resortIds }
router.post("/calculate", trafficCalculateLimiter, async (req, res) => {
    const { latitude, longitude, resortIds } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Missing coordinates" });
    }

    try {
        const resorts = getStaticResorts();
        let destinations = resorts.filter(r => r.latitude && r.longitude);

        // OPTIMIZATION: If client provided specific resort IDs (e.g. via radius filter), 
        // only calculate for those to save API calls/costs.
        if (resortIds && Array.isArray(resortIds) && resortIds.length > 0) {
            destinations = destinations.filter(r => resortIds.includes(r.id));
        }

        // Usage: fetchTomTomTraffic(destinations, { lat, lon })
        const trafficMap = await fetchTomTomTraffic(destinations, { lat: latitude, lon: longitude });
        res.json(trafficMap);
    } catch (error) {
        console.error("Traffic calculation error:", error);
        res.status(500).json({ error: "Failed to calculate traffic" });
    }
});

export default router;
