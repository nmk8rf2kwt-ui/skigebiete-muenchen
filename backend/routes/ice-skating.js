import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getWeatherForecast, getCurrentConditions } from "../services/weather/forecast.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON
const loadIceSkatingData = () => {
    try {
        const dataPath = path.join(__dirname, "../data/ice-skating.json");
        if (!fs.existsSync(dataPath)) return [];
        const raw = fs.readFileSync(dataPath, "utf-8");
        return JSON.parse(raw);
    } catch (error) {
        console.error("Error loading ice skating data:", error);
        return [];
    }
};



// GET /api/ice-skating
router.get("/", async (req, res) => {
    const data = loadIceSkatingData();

    const enriched = await Promise.all(data.map(async (item) => {
        if (item.latitude && item.longitude) {
            const forecast = await getWeatherForecast(item.latitude, item.longitude);
            const current = getCurrentConditions(forecast);
            if (current) {
                return {
                    ...item,
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
