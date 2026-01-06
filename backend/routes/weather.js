import express from "express";
import { getStaticResorts } from "../services/resortManager.js";
import { weatherCache } from "../services/cache.js";
import { getWeatherForecast } from "../services/weather.js";

const router = express.Router();

// GET /api/weather/:resortId
router.get("/:resortId", async (req, res) => {
    const { resortId } = req.params;
    const resorts = getStaticResorts();
    const resort = resorts.find(r => r.id === resortId);

    if (!resort) {
        return res.status(404).json({ error: "Resort not found" });
    }

    if (!resort.latitude || !resort.longitude) {
        return res.status(400).json({ error: "Resort coordinates not available" });
    }

    // Check cache first
    const cacheKey = `weather_${resortId}`;
    const cached = weatherCache.get(cacheKey);
    if (cached) {
        return res.json({
            resort: resort.name,
            forecast: cached,
            cached: true
        });
    }

    try {
        const forecast = await getWeatherForecast(resort.latitude, resort.longitude);
        if (!forecast) {
            return res.status(500).json({ error: "Failed to fetch weather" });
        }

        // Store in cache
        weatherCache.set(cacheKey, forecast);

        res.json({
            resort: resort.name,
            forecast,
            cached: false
        });
    } catch (error) {
        console.error("Weather API error:", error);
        res.status(500).json({ error: "Weather service unavailable" });
    }
});

export default router;
