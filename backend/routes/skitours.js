import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON
const loadSkitourData = () => {
    try {
        const dataPath = path.join(__dirname, "../data/skitours.json");
        if (!fs.existsSync(dataPath)) return [];
        const raw = fs.readFileSync(dataPath, "utf-8");
        return JSON.parse(raw);
    } catch (error) {
        console.error("Error loading skitour data:", error);
        return [];
    }
};

import { getWeatherForecast, getCurrentConditions } from "../services/weather/forecast.js";

// GET /api/skitours
router.get("/", async (req, res) => {
    const data = loadSkitourData();

    const enriched = await Promise.all(data.map(async (item) => {
        if (item.latitude && item.longitude) {
            const forecast = await getWeatherForecast(item.latitude, item.longitude);
            const current = getCurrentConditions(forecast);
            if (current) {
                // Use forecast for dynamic snow data
                const todaysSnow = forecast.forecast[0]?.snowfall || 0;

                return {
                    ...item,
                    newSnow: todaysSnow > 0 ? todaysSnow : item.newSnow, // Update if raining snow
                    weather: {
                        temp: parseInt(current.temp),
                        icon: current.emoji
                    }
                };
            }
        }
        return item;
    }));

    res.json(enriched);
});

export default router;
