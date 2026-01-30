import express from "express";
import rateLimit from "express-rate-limit";
import { geocodeAddress as geocodeORS, autocompleteAddress } from "../services/ors.js";

const router = express.Router();

// Rate limiting for geocoding to protect ORS quota
const geocodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Max 60 requests per 15 minutes per IP
    message: { error: "Too many geocoding requests. Please try again later." }
});

// Rate limiting for autocomplete (more lenient since it's called frequently)
const autocompleteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Max 30 requests per minute per IP
    message: { error: "Too many autocomplete requests. Please slow down." }
});

// GET /api/locating/geocode?q=Address
router.get("/geocode", geocodeLimiter, async (req, res) => {
    const q = req.query.q || req.query.query;
    if (!q) return res.status(400).json({ error: "Missing query parameter (q or query)" });

    try {
        const result = await geocodeORS(q);
        if (!result) return res.status(404).json({ error: "Address not found" });
        res.json(result);
    } catch (error) {
        console.error("Locating Geocode error:", error);
        res.status(500).json({ error: "Geocoding failed" });
    }
});

// GET /api/locating/autocomplete?q=Mün
router.get("/autocomplete", autocompleteLimiter, async (req, res) => {
    const q = req.query.q || req.query.query;
    if (!q || q.length < 2) return res.json([]);

    try {
        const results = await autocompleteAddress(q);
        res.json(results);
    } catch (error) {
        console.error("Locating Autocomplete error:", error);
        res.status(500).json({ error: "Autocomplete failed" });
    }
});

export default router;

