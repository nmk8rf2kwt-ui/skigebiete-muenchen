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

// GET /api/skitours
router.get("/", (req, res) => {
    const data = loadSkitourData();
    res.json(data);
});

export default router;
