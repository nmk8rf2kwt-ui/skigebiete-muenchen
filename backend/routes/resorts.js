import express from "express";
import { getStaticResorts, getAllResortsLive, getSingleResortLive } from "../services/resortManager.js";

const router = express.Router();

// GET /api/resorts - All Live Data
router.get("/", async (req, res) => {
    try {
        const results = await getAllResortsLive();
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch resort data" });
    }
});

// GET /api/resorts/static - Fast Static Data
router.get("/static", (req, res) => {
    res.json(getStaticResorts());
});

// GET /api/lifts/:resort - Legacy/Direct Fetch
// Note: In index.js this was /api/lifts/:resort.
// We should probably keep that path in the main app.use, or handle it here via rewrite?
// Let's assume we mount this router at /api/resorts? No, usually separate.
// The plan said resorts.js handles /api/lifts/:id too?
// It's cleaner to have a separate file or just put it here.
// Let's put it here but we must be careful about the mounting path.
// If mounted at /api, then:
// router.get("/resorts", ...);
// router.get("/lifts/:resort", ...);

export default router;

export const liftsRouter = express.Router();
liftsRouter.get("/:resort", async (req, res) => {
    const { resort } = req.params;
    const result = await getSingleResortLive(resort);

    if (!result && result !== null) {
        // null means not found/no parser
        return res.status(404).json({ error: "Unknown resort" });
    }
    // If result has error prop
    if (result && result.error) {
        return res.status(500).json({ error: result.error });
    }

    if (!result) return res.status(404).json({ error: "Unknown resort" });

    res.json(result);
});
