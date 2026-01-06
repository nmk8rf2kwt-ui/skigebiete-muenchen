import express from "express";
import { getCityTrafficHistory, getResortTrafficHistory } from "../history.js";

const router = express.Router();

/**
 * GET /api/history/traffic/:cityId
 * Returns all traffic history data for a specific city tracker
 */
router.get("/traffic/:cityId", (req, res) => {
    const { cityId } = req.params;
    try {
        const data = getCityTrafficHistory(cityId);
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
router.get("/traffic/:cityId/:resortId", (req, res) => {
    const { cityId, resortId } = req.params;
    try {
        const data = getResortTrafficHistory(cityId, resortId);
        res.json({ cityId, resortId, data });
    } catch (error) {
        console.error("Error fetching resort traffic history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
