import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
router.get("/", (req, res) => {
    const data = loadIceSkatingData();
    res.json(data);
});

export default router;
