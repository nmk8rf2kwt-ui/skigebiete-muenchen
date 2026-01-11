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

// GET /api/sledding
router.get("/", (req, res) => {
    const data = loadSleddingData();

    // Enrich with some basic randomness for "live" feel (optional)
    // or just return static
    res.json(data);
});

export default router;
