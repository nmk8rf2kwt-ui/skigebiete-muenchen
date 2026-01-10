import express from "express";
import rateLimit from "express-rate-limit";
import { fetchTravelTimes as fetchTomTomTraffic } from "../services/tomtom.js";
import { getStaticResorts } from "../services/resorts/service.js";

const router = express.Router();

// Rate limiting for routing calculate endpoint
const routingCalculateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Max 60 requests per 15 minutes per IP
    message: { error: "Too many routing calculation requests. Please try again later." }
});

// POST /api/routing/calculate
// Body: { latitude, longitude, resortIds }
router.post("/calculate", routingCalculateLimiter, async (req, res) => {
    const { latitude, longitude, resortIds } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Missing coordinates" });
    }

    try {
        const resorts = getStaticResorts();
        let destinations = resorts.filter(r => r.latitude && r.longitude);


        // OPTIMIZATION: 
        // 1. If explicit IDs provided -> Use them.
        // 2. If not -> Filter by linear distance from origin (max 300km) to save credits.
        if (resortIds && Array.isArray(resortIds) && resortIds.length > 0) {
            destinations = destinations.filter(r => resortIds.includes(r.id));
        } else {
            // Haversine / Linear check
            const MAX_DIST_KM = 300;
            const toRad = x => x * Math.PI / 180;
            const R = 6371; // km

            destinations = destinations.filter(r => {
                if (!r.latitude || !r.longitude) return false;

                const dLat = toRad(r.latitude - latitude);
                const dLon = toRad(r.longitude - longitude);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(latitude)) * Math.cos(toRad(r.latitude)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c;

                return d <= MAX_DIST_KM;
            });

            console.log(`[Traffic] Optimized: Fetching for ${destinations.length} resorts within ${MAX_DIST_KM}km of user.`);
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
