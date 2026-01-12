import express from "express";
import { getStaticResorts, getAllResortsLive, getSingleResortLive } from "../services/resorts/service.js";

const router = express.Router();

// GET /api/resorts - All Live Data
// ALSO GET /api/lifts - (Handled by mount in index.js)
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

// GET /api/lifts/:resort - Live Data for a single resort
// ALSO GET /api/resorts/:resort - (Handled by mount in index.js)
router.get("/:resort", async (req, res) => {
    const { resort } = req.params;
    try {
        const result = await getSingleResortLive(resort);
        if (result === null) return res.status(404).json({ error: "Unknown resort" });
        if (result && result.error) return res.status(500).json({ error: result.error });
        res.json(result);
    } catch (err) {
        console.error('Error in resort/lift route for resort:', resort, err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
