import express from "express";
import {
    getCityTrafficHistory,
    getResortTrafficHistory,
    getHistory,
    getTrends
} from "../services/resorts/archive.js";
import {
    getResortCongestionAnalysis,
    checkDataAvailability
} from '../services/trafficAnalysis.js';

export const historyRouter = express.Router();
export const trafficAnalysisRouter = express.Router();

// -- HISTORY (Mounted at /api) --

// GET /api/traffic/:cityId
historyRouter.get("/traffic/:cityId", async (req, res) => {
    const { cityId } = req.params;
    try {
        const data = await getCityTrafficHistory(cityId);
        res.json({ cityId, data });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/traffic/:cityId/:resortId
historyRouter.get("/traffic/:cityId/:resortId", async (req, res) => {
    const { cityId, resortId } = req.params;
    try {
        const data = await getResortTrafficHistory(cityId, resortId);
        res.json({ cityId, resortId, data });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/:resortId/trends
historyRouter.get("/:resortId/trends", async (req, res) => {
    const { resortId } = req.params;
    try {
        const trends = await getTrends(resortId);
        res.json(trends);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/:resortId
historyRouter.get("/:resortId", async (req, res) => {
    const { resortId } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 7;
    try {
        const history = await getHistory(resortId, days);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// -- TRAFFIC ANALYSIS (Mounted at /api/traffic-analysis) --

trafficAnalysisRouter.get('/:resortId', async (req, res) => {
    try {
        const { resortId } = req.params;
        const days = parseInt(req.query.days) || 7;
        const analysis = await getResortCongestionAnalysis(resortId, days);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze traffic data' });
    }
});

trafficAnalysisRouter.get('/:resortId/availability', async (req, res) => {
    try {
        const { resortId } = req.params;
        const availability = await checkDataAvailability(resortId);
        res.json(availability);
    } catch (error) {
        res.status(500).json({ error: 'Failed to check data availability' });
    }
});
