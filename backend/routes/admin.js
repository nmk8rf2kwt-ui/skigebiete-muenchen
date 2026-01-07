import express from "express";
import { getUsageStats } from "../services/usageTracker.js";

const router = express.Router();

router.get("/usage", (req, res) => {
    try {
        const stats = getUsageStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch usage stats" });
    }
});

export default router;
