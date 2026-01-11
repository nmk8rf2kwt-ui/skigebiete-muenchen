import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON
const loadSleddingData = () => {
    try {
        const dataPath = path.join(__dirname, "../data/sledding.json");
        if (!fs.existsSync(dataPath)) return [];
        const raw = fs.readFileSync(dataPath, "utf-8");
        return JSON.parse(raw);
    } catch (error) {
        console.error("Error loading sledding data:", error);
        return [];
    }
};

import { getWeatherForecast, getCurrentConditions } from "../services/weather/forecast.js";

// GET /api/sledding
router.get("/", async (req, res) => {
    const data = loadSleddingData();

    // Enrich with live weather
    const enriched = await Promise.all(data.map(async (item) => {
        if (item.latitude && item.longitude) {
            const forecast = await getWeatherForecast(item.latitude, item.longitude);
            const current = getCurrentConditions(forecast);
            if (current) {
                return {
                    ...item,
                    weather: {
                        temp: parseInt(current.temp), // "5°C" -> 5
                        icon: current.emoji
                    },
                    snow: forecast.lastSnowfall ? item.snow : item.snow // Keep static snow for now found in JSON if distinct
                };
            }
        }
        return item;
    }));

    res.json(enriched);
});

export default router;
