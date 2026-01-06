import express from "express";
import { getHistory, getTrends } from "../history.js";
import { getStaticResorts } from "../services/resortManager.js";

const router = express.Router();

// GET /api/history/:resortId
router.get("/history/:resortId", (req, res) => {
    const { resortId } = req.params;
    const days = parseInt(req.query.days) || 7;

    try {
        const history = getHistory(resortId, days);

        res.json({
            resortId,
            days,
            history: history.map(h => ({
                date: h.date,
                liftsOpen: h.data.liftsOpen,
                liftsTotal: h.data.liftsTotal,
                snow: h.data.snow,
                weather: h.data.weather
            }))
        });
    } catch (error) {
        console.error("History API error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// GET /api/trends/:resortId
router.get("/trends/:resortId", (req, res) => {
    const { resortId } = req.params;
    try {
        const trends = getTrends(resortId);
        res.json(trends);
    } catch (error) {
        console.error("Trends API error:", error);
        res.status(500).json({ error: "Failed to calculate trends" });
    }
});

// GET /api/export/:resortId
router.get("/export/:resortId", (req, res) => {
    const { resortId } = req.params;
    const days = parseInt(req.query.days) || 30;

    try {
        const resorts = getStaticResorts();
        const resort = resorts.find(r => r.id === resortId);
        const history = getHistory(resortId, days);

        if (history.length === 0) {
            return res.status(404).json({ error: "No historical data available" });
        }

        // Generate CSV
        const headers = "Date,Resort,Lifts Open,Lifts Total,Snow (cm),Weather\n";
        const rows = history.map(h => {
            const snow = h.data.snow ? h.data.snow.replace('cm', '') : '';
            return `${h.date},${resort?.name || resortId},${h.data.liftsOpen || ''},${h.data.liftsTotal || ''},${snow},${h.data.weather || ''}`;
        }).join('\n');

        const csv = headers + rows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${resortId}_history_${days}days.csv"`);
        res.send(csv);
    } catch (error) {
        console.error("Export API error:", error);
        res.status(500).json({ error: "Failed to export data" });
    }
});

export default router;
