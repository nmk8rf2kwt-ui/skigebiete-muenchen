import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRAFFIC_DIR = path.join(__dirname, '../data/traffic');

const router = express.Router();

// GET /api/history/traffic/:cityId
router.get("/traffic/:cityId", (req, res) => {
    const { cityId } = req.params;
    // Sanitize
    const safeCityId = cityId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = path.join(TRAFFIC_DIR, `traffic_${safeCityId}.csv`);

    console.log(`Searching for history: ${filename}`);

    if (!fs.existsSync(filename)) {
        return res.json({ cityId: safeCityId, data: [] });
    }

    try {
        const content = fs.readFileSync(filename, 'utf-8');
        const lines = content.trim().split('\n');

        // CSV Format: Timestamp,ResortId,DurationMin,DelayMin
        // Skip header
        const data = lines.slice(1).map(line => {
            const [timestamp, resortId, duration, delay] = line.split(',');
            return {
                timestamp,
                resortId,
                duration: parseFloat(duration),
                delay: parseFloat(delay)
            };
        });

        res.json({ cityId: safeCityId, data });
    } catch (error) {
        console.error("Error reading history csv:", error);
        res.status(500).json({ error: "Failed to read history data" });
    }
});

export default router;
