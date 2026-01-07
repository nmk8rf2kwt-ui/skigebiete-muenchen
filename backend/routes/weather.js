import express from "express";
import { getStaticResorts } from "../services/resorts/service.js";
import { weatherCache } from "../services/cache.js";
import { getWeatherForecast } from "../services/weather/forecast.js";
import { getWeatherHistory } from "../services/resorts/archive.js";

export const weatherRouter = express.Router();
export const historicalWeatherRouter = express.Router();

// -- WEATHER FORECAST (Mounted at /api/weather) --
weatherRouter.get("/:resortId", async (req, res) => {
    const { resortId } = req.params;
    const resorts = getStaticResorts();
    const resort = resorts.find(r => r.id === resortId);

    if (!resort) return res.status(404).json({ error: "Resort not found" });
    if (!resort.latitude || !resort.longitude) return res.status(400).json({ error: "Resort coordinates not available" });

    const cacheKey = `weather_${resortId}`;
    const cached = weatherCache.get(cacheKey);
    if (cached) return res.json({ resort: resort.name, forecast: cached, cached: true });

    try {
        const forecast = await getWeatherForecast(resort.latitude, resort.longitude);
        if (!forecast) return res.status(500).json({ error: "Failed to fetch weather" });
        weatherCache.set(cacheKey, forecast);
        res.json({ resort: resort.name, forecast, cached: false });
    } catch (error) {
        res.status(500).json({ error: "Weather service unavailable" });
    }
});

// -- HISTORICAL WEATHER (Mounted at /api/historical-weather) --
historicalWeatherRouter.get('/:resortId', async (req, res) => {
    const { resortId } = req.params;
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const resorts = getStaticResorts();
    const resort = resorts.find(r => r.id === resortId);

    if (!resort) return res.status(404).json({ error: 'Resort not found', resortId });

    try {
        const weatherHistory = await getWeatherHistory(resortId, days);
        res.json({ resortId, resortName: resort.name, days: weatherHistory.length, data: weatherHistory });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather history', message: error.message });
    }
});
