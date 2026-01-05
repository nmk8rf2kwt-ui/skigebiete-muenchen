import express from "express";
import cors from "cors";
import fs from "fs";
import { logFetch } from "./logger.js";
import { parserCache, weatherCache } from "./cache.js";

// Import parsers
import { spitzingsee } from "./parsers/spitzingsee.js";
import { brauneck } from "./parsers/brauneck.js";
import { sudelfeld } from "./parsers/sudelfeld.js";
import { garmisch } from "./parsers/garmisch.js";
import { zugspitze } from "./parsers/zugspitze.js";
import { wilderKaiser } from "./parsers/wilder-kaiser.js";
import { steinplatte } from "./parsers/steinplatte.js";
import { kitzbuehel } from "./parsers/kitzbuehel.js";
import { hochkoessen } from "./parsers/hochkoessen.js";
import { winklmoos } from "./parsers/winklmoos.js";
import { ehrwalderAlmbahn } from "./parsers/ehrwald.js";
import parseLermoos from "./parsers/lermoos.js";
import parseStJohann from "./parsers/stjohann.js";
import parseSkiJuwel from "./parsers/skijuwel.js";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// Function to load static resorts data
function getStaticResorts() {
  try {
    const data = fs.readFileSync("./resorts.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading resorts.json:", err);
    return [];
  }
}

// Map of parser functions
const PARSERS = {
  spitzingsee,
  brauneck,
  sudelfeld,
  garmisch,
  zugspitze,
  "wilder-kaiser": wilderKaiser,
  steinplatte,
  kitzbuehel,
  hochkoessen,
  winklmoos,
  ehrwald: ehrwalderAlmbahn,
  lermoos: parseLermoos,
  st_johann: parseStJohann,
  ski_juwel: parseSkiJuwel,
  // Add other parsers here as they are implemented
};


// Health check
app.get("/", (req, res) => {
  const resorts = getStaticResorts();
  const cacheStats = parserCache.getStats();
  res.json({
    status: "ok",
    service: "skigebiete-backend",
    resorts: resorts.length,
    cache: cacheStats
  });
});

// API - Get Static Resorts (Fast)
app.get("/api/resorts/static", (req, res) => {
  const resorts = getStaticResorts();
  res.json(resorts);
});

// API - Get All Resorts with Status (Live)
app.get("/api/resorts", async (req, res) => {
  const resorts = getStaticResorts();

  const results = await Promise.all(
    resorts.map(async (resort) => {
      const parser = PARSERS[resort.id];
      let liveData = {
        liftsOpen: null,
        liftsTotal: null,
        snow: null,
        weather: null,
        status: "static_only"
      };

      if (parser) {
        // Check cache first
        const cached = parserCache.get(resort.id);
        if (cached) {
          liveData = {
            ...liveData,
            ...cached,
            status: "live",
            cached: true
          };
        } else {
          // Fetch fresh data
          try {
            const data = await parser();
            liveData = {
              ...liveData,
              ...data,
              status: "live",
              cached: false
            };
            // Store in cache
            parserCache.set(resort.id, data);
            logFetch(resort.id, "SUCCESS", data.source || resort.website, `Lifts: ${data.liftsOpen}/${data.liftsTotal}`);
          } catch (error) {
            console.error(`Parser error for ${resort.id}:`, error.message);
            liveData.status = "error";
            logFetch(resort.id, "ERROR", resort.website, error.message);
          }
        }
      }

      return {
        ...resort,
        ...liveData,
        // Ensure static ID/Name are preserved
        id: resort.id,
        name: resort.name
      };
    })
  );

  res.json(results);
});

// API - Get Weather Forecast for a Resort
app.get("/api/weather/:resortId", async (req, res) => {
  const { resortId } = req.params;
  const resorts = getStaticResorts();
  const resort = resorts.find(r => r.id === resortId);

  if (!resort) {
    return res.status(404).json({ error: "Resort not found" });
  }

  if (!resort.latitude || !resort.longitude) {
    return res.status(400).json({ error: "Resort coordinates not available" });
  }

  // Check cache first
  const cacheKey = `weather_${resortId}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    return res.json({
      resort: resort.name,
      forecast: cached,
      cached: true
    });
  }

  try {
    const { getWeatherForecast } = await import("./weather.js");
    const forecast = await getWeatherForecast(resort.latitude, resort.longitude);

    if (!forecast) {
      return res.status(500).json({ error: "Failed to fetch weather" });
    }

    // Store in cache
    weatherCache.set(cacheKey, forecast);

    res.json({
      resort: resort.name,
      forecast,
      cached: false
    });
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({ error: "Weather service unavailable" });
  }
});


// Keep legacy legacy endpoint for specific parsers just in case, but redirect logic to main flow ideally
// For now, let's keep the specific fetch for backward compatibility if the frontend calls it individually
// BUT the new frontend will likely call /api/resorts to get everything at once.

app.get("/api/lifts/:resort", async (req, res) => {
  const { resort } = req.params;
  const resorts = getStaticResorts();
  const staticData = resorts.find(r => r.id === resort);

  // If not in static data but parser exists (edge case), try simple parser return
  if (!staticData && !PARSERS[resort]) {
    return res.status(404).json({ error: "Unknown resort" });
  }

  const parser = PARSERS[resort];
  try {
    const data = parser ? await parser() : {};
    res.json({
      ...(staticData || {}),
      ...data,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal parser error" });
  }
});


// API - Get Historical Data
app.get("/api/history/:resortId", async (req, res) => {
  const { resortId } = req.params;
  const days = parseInt(req.query.days) || 7;

  try {
    const { getHistory } = await import("./history.js");
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

// API - Get Trends
app.get("/api/trends/:resortId", async (req, res) => {
  const { resortId } = req.params;

  try {
    const { getTrends } = await import("./history.js");
    const trends = getTrends(resortId);
    res.json(trends);
  } catch (error) {
    console.error("Trends API error:", error);
    res.status(500).json({ error: "Failed to calculate trends" });
  }
});

// API - Export Historical Data as CSV
app.get("/api/export/:resortId", async (req, res) => {
  const { resortId } = req.params;
  const days = parseInt(req.query.days) || 30;

  try {
    const { getHistory } = await import("./history.js");
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

// Daily snapshot scheduler (runs at midnight)
async function saveDailySnapshots() {
  console.log("📸 Saving daily snapshots...");
  const { saveSnapshot } = await import("./history.js");
  const resorts = getStaticResorts();

  for (const resort of resorts) {
    const parser = PARSERS[resort.id];
    if (parser) {
      try {
        // Check cache first
        let data = parserCache.get(resort.id);

        // If not cached, fetch fresh data
        if (!data) {
          data = await parser();
        }

        saveSnapshot(resort.id, data);
        console.log(`  ✓ Saved snapshot for ${resort.id}`);
      } catch (error) {
        console.error(`  ✗ Failed to save snapshot for ${resort.id}:`, error.message);
      }
    }
  }
  console.log("📸 Daily snapshots complete");
}

// TESTING: Run snapshots every hour (change back to midnight after testing)
const MIDNIGHT_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour for testing
let lastSnapshotDate = null;

setInterval(() => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];

  // Run at midnight (00:00-00:01)
  if (now.getHours() === 0 && now.getMinutes() === 0 && lastSnapshotDate !== currentDate) {
    lastSnapshotDate = currentDate;
    saveDailySnapshots();
  }
}, MIDNIGHT_CHECK_INTERVAL);

// Cleanup old history files daily
setInterval(async () => {
  const { cleanup } = await import("./history.js");
  cleanup();
}, 24 * 60 * 60 * 1000); // Once per day

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📊 Historical data tracking enabled`);
});
