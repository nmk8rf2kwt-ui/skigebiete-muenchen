import express from "express";
import rateLimit from "express-rate-limit";
import { fetchDynamicTravelTimes, geocodeAddress } from "../services/traffic.js";
import { getStaticResorts } from "../services/resortManager.js";

const router = express.Router();

// Stricter rate limiting for traffic endpoints to protect ORS quota
const trafficCalculateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 requests per 15 minutes per IP
    message: { error: "Too many traffic calculation requests. Please try again later." }
});

const geocodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 requests per 15 minutes per IP
    message: { error: "Too many geocoding requests. Please try again later." }
});

// POST /api/traffic/calculate
// Body: { latitude, longitude }
router.post("/calculate", trafficCalculateLimiter, async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Missing coordinates" });
    }

    try {
        const resorts = getStaticResorts();
        const destinations = resorts.filter(r => r.latitude && r.longitude);

        const trafficMap = await fetchDynamicTravelTimes(latitude, longitude, destinations);
        res.json(trafficMap);
    } catch (error) {
        console.error("Traffic calculation error:", error);
        res.status(500).json({ error: "Failed to calculate traffic" });
    }
});

// GET /api/traffic/geocode?q=Address
router.get("/geocode", geocodeLimiter, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing query" });

    try {
        const result = await geocodeAddress(q);
        if (!result) return res.status(404).json({ error: "Address not found" });
        res.json(result);
    } catch (error) {
        console.error("Geocode error:", error);
        res.status(500).json({ error: "Geocoding failed" });
    }
});

export default router;
