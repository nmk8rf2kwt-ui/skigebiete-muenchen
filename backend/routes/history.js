import express from "express";
import { getCityTrafficHistory, getResortTrafficHistory, getHistory, getTrends } from "../services/history.js";

const router = express.Router();

/**
 * GET /api/history/traffic/:cityId
 * Returns all traffic history data for a specific city tracker
 */
router.get("/traffic/:cityId", async (req, res) => {
    const { cityId } = req.params;
    try {
        const data = await getCityTrafficHistory(cityId);
        res.json({ cityId, data });
    } catch (error) {
        console.error("Error fetching city traffic history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * GET /api/history/traffic/:cityId/:resortId
 * Returns traffic history for a specific resort from a city tracker
 */
router.get("/traffic/:cityId/:resortId", async (req, res) => {
    const { cityId, resortId } = req.params;
    try {
        const data = await getResortTrafficHistory(cityId, resortId);
        res.json({ cityId, resortId, data });
    } catch (error) {
        console.error("Error fetching resort traffic history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/history/export - Export all history as CSV (Admin/Debug)
// Kept for backward compatibility or future valid usage
router.get("/export", async (req, res) => {
    try {
        // Implementation for CSV export from DB if needed
        // For now, return empty or not implemented
        res.status(501).json({ error: "Not implemented in Supabase version yet" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/history/:resortId - Get history for a resort
router.get("/:resortId", async (req, res) => {
    const { resortId } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 7;

    try {
        const history = await getHistory(resortId, days);
        res.json(history);
    } catch (error) {
        console.error(`Error fetching history for ${resortId}:`, error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/history/:resortId/trends - Get trends for a resort
router.get("/:resortId/trends", async (req, res) => {
    const { resortId } = req.params;

    try {
        const trends = await getTrends(resortId);
        res.json(trends);
    } catch (error) {
        console.error(`Error fetching trends for ${resortId}:`, error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
