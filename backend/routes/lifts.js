import express from "express";
import { getSingleResortLive } from "../services/resortManager.js";

const router = express.Router();

// GET /api/lifts/:resort - Live Data for a single resort
router.get("/:resort", async (req, res) => {
    const { resort } = req.params;

    try {
        const result = await getSingleResortLive(resort);

        if (result === null) {
            return res.status(404).json({ error: "Unknown resort" });
        }

        // If result has error prop
        if (result && result.error) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result);
    } catch (err) {
        console.error(`Error in lifts route for ${resort}:`, err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
