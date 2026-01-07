import express from "express";
import { getStaticResorts, getAllResortsLive } from "../services/resortManager.js";

const router = express.Router();

// GET /api/resorts - All Live Data
router.get("/", async (req, res) => {
    try {
        const results = await getAllResortsLive();
        res.json(results);
    } catch (err) {
        console.error("Failed to fetch all resorts live:", err);
        res.status(500).json({ error: "Failed to fetch resort data" });
    }
});

// GET /api/resorts/static - Fast Static Data
router.get("/static", (req, res) => {
    try {
        res.json(getStaticResorts());
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch static resorts" });
    }
});

export default router;
