import { getStaticResorts } from "./resortManager.js";
import { getWeatherForecast, getCurrentConditions } from "./weather.js";
import { weatherCache, parserCache, trafficCache } from "./cache.js";
import { PARSERS } from "../parsers/index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { saveSnapshot, cleanup as cleanupHistory, saveTrafficLog, saveMatrixTrafficLog, updateHistoricalWeather, isBackfillCompleted, markBackfillCompleted, syncResortsToDatabase } from "./history.js";
import { statusLogger } from "./statusLogger.js"; // Logging support

import { fetchTrafficMatrix } from "./tomtom.js";
import { getYesterdayWeather, backfillWeatherHistory } from "./historicalWeather.js";

// -- JOBS --

// 1. Refresh Weather (Hourly)
export async function refreshWeather() {
    console.log("Refreshing weather data...");
    statusLogger.log('info', 'weather', 'Starting hourly weather refresh...');
    const resorts = getStaticResorts();
    let successCount = 0;

    for (const resort of resorts) {
        if (resort.latitude && resort.longitude) {
            try {
                const forecast = await getWeatherForecast(resort.latitude, resort.longitude);
                if (forecast) {
                    const current = getCurrentConditions(forecast);
                    weatherCache.set(resort.id, { forecast, current, timestamp: Date.now() });
                    successCount++;
                }
            } catch (err) {
                console.error(`Failed to fetch weather for ${resort.id}:`, err);
                statusLogger.log('warn', 'weather', `Failed to fetch weather for ${resort.name}`);
            }
        }
    }
    console.log("Weather refresh complete.");
    statusLogger.updateComponentStatus('weather', 'healthy');
    statusLogger.log('success', 'weather', `Weather refresh complete (${successCount}/${resorts.length} resorts).`);
}

// 2. Daily Snapshots (Midnight)
export async function saveDailySnapshots() {
    console.log("📸 Saving daily snapshots...");
    statusLogger.log('info', 'db', 'Starting daily snapshot capture...');
    const resorts = getStaticResorts();
    let count = 0;

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

                // Fetch yesterday's weather data
                let historicalWeather = null;
                if (resort.latitude && resort.longitude) {
                    try {
                        historicalWeather = await getYesterdayWeather(resort.latitude, resort.longitude);
                        if (historicalWeather) {
                            console.log(`  ✓ Fetched weather data for ${resort.id}`);
                        }
                    } catch (weatherError) {
                        console.error(`  ⚠️ Failed to fetch weather for ${resort.id}:`, weatherError.message);
                    }
                }

                // Inject static price data and weather for history tracking
                data = {
                    ...data,
                    price: resort.price,
                    priceDetail: resort.priceDetail,
                    historicalWeather
                };

                // UPDATED: Await async save
                await saveSnapshot(resort.id, data);
                console.log(`  ✓ Saved snapshot for ${resort.id}`);
                count++;
            } catch (error) {
                console.error(`  ✗ Failed to save snapshot for ${resort.id}:`, error.message);
                statusLogger.log('error', 'db', `Snapshot failed for ${resort.name}: ${error.message}`);
            }
        }
    }
    console.log("📸 Daily snapshots complete");
    statusLogger.log('success', 'db', `Daily snapshots complete (${count} saved).`);
}

// 3. Unified Traffic Matrix Job (Hourly 06-22)
// Replaces refreshTraffic and trackCityTraffic
export async function updateTrafficMatrix() {
    const now = new Date();
    const hour = now.getHours();

    // Run only between 06:00 and 22:00
    if (hour < 6 || hour >= 22) {
        console.log("💤 Traffic logs skipped (night time).");
        return;
    }

    console.log("🚦 Updating Traffic Matrix (8 Cities × 60 Resorts)...");

    try {
        // 1. Load Data
        const resorts = getStaticResorts().filter(r => r.latitude && r.longitude);
        const citiesPath = path.join(__dirname, '../data/reference_cities.json');

        if (!fs.existsSync(citiesPath)) {
            console.warn("City reference file missing. Aborting matrix update.");
            return;
        }
        const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));

        // 2. Fetch Matrix (Cities x Resorts)
        const trafficMatrix = await fetchTrafficMatrix(cities, resorts);

        if (!trafficMatrix) {
            console.error("Failed to fetch traffic matrix.");
            return;
        }

        // 3. Process & Log Data
        // trafficMatrix structure: { [cityId]: { [resortId]: { duration, delay } } }

        // A. Update "Standard" Cache (Munich Data)
        const munichData = trafficMatrix['muenchen'];
        if (munichData) {
            // Update in-memory cache for frontend (Standard View)
            for (const [resortId, data] of Object.entries(munichData)) {
                if (data) {
                    trafficCache.set(resortId, data);

                    // Log Standard History (Legacy format for main chart?)
                    // Or do we rely on the matrix logs now? 
                    // Let's keep the standard log for continuity if saveTrafficLog relies on it.
                    // saveTrafficLog uses standardTime vs currentTime.
                    const resort = resorts.find(r => r.id === resortId);
                    if (resort) {
                        const standard = resort.distance || 0;
                        // UPDATED: Await async save
                        await saveTrafficLog(resortId, standard, data.duration);
                    }
                }
            }
            console.log("✅ Updated Standard Traffic Cache (Munich).");
        } else {
            console.warn("⚠️ Munich data missing in matrix response. Cache not updated.");
        }

        // B. Log Detailed Matrix History (All 5 Cities)
        let logCount = 0;
        for (const city of cities) {
            const cityData = trafficMatrix[city.id];
            if (cityData) {
                for (const resort of resorts) {
                    const data = cityData[resort.id];
                    if (data) {
                        // UPDATED: Await async save
                        await saveMatrixTrafficLog(
                            city.id,
                            city.name,
                            resort.id,
                            data.duration,
                            data.delay
                        );
                        logCount++;
                    }
                }
            }
        }
        console.log(`📝 Logged ${logCount} matrix entries.`);

        // Mark traffic API as healthy after successful update
        statusLogger.updateComponentStatus('traffic', 'healthy');
        statusLogger.log('success', 'traffic', `Traffic matrix updated successfully (${logCount} entries).`);

    } catch (error) {
        console.error("Error in updateTrafficMatrix:", error);
        statusLogger.updateComponentStatus('traffic', 'degraded');
        statusLogger.log('error', 'traffic', `Traffic Matrix update failed: ${error.message}`);
    }
}

// -- SCHEDULER --

let lastSnapshotDate = null;

export function initScheduler() {
    console.log("⏰ Scheduler initialized");

    // Mark scheduler as healthy on startup
    statusLogger.updateComponentStatus('scheduler', 'healthy');
    statusLogger.log('info', 'scheduler', 'Scheduler initialized successfully');

    // A. Weather Loop (1 hour)
    setInterval(refreshWeather, 60 * 60 * 1000);

    // B. Traffic Matrix Loop (15 minutes) - High frequency for detailed analysis
    setTimeout(() => {
        setInterval(updateTrafficMatrix, 15 * 60 * 1000); // Every 15 minutes
        updateTrafficMatrix(); // Initial run
    }, 5000);

    // C. Initial fetch for weather
    setTimeout(refreshWeather, 2000);

    // D. Sync Static Resorts Config (One-time on start)
    setTimeout(() => {
        const resorts = getStaticResorts();
        syncResortsToDatabase(resorts);
    }, 5000);

    // E. Snapshot Loop (Check every hour)
    setInterval(() => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentHour = now.getHours();

        // Run only if it's midnight hour (00:00 - 00:59) AND we haven't run today
        if (currentHour === 0 && lastSnapshotDate !== currentDate) {
            lastSnapshotDate = currentDate;
            saveDailySnapshots();
        }
    }, 60 * 60 * 1000);

    // Initial Snapshot Check (Start of server)
    const now = new Date();
    if (now.getHours() === 0) {
        lastSnapshotDate = now.toISOString().split('T')[0];
    }

    // E. History Cleanup (Daily)
    setInterval(cleanupHistory, 24 * 60 * 60 * 1000);

    // F. One-time Weather Backfill (First Start Only)
    // Wrapped in IIFE to handle async check
    (async () => {
        try {
            const completed = await isBackfillCompleted();
            if (!completed) {
                console.log("🌤️ Starting one-time weather history backfill...");
                setTimeout(async () => {
                    const resorts = getStaticResorts().filter(r => r.latitude && r.longitude);
                    console.log(`📥 Backfilling weather for ${resorts.length} resorts (30 days each)...`);

                    let successCount = 0;
                    let failCount = 0;

                    for (const resort of resorts) {
                        try {
                            const weatherData = await backfillWeatherHistory(resort, 30);
                            // Save each day
                            for (const [date, data] of Object.entries(weatherData)) {
                                await updateHistoricalWeather(resort.id, date, data);
                            }
                            successCount++;
                            // Small delay to avoid rate limiting
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (error) {
                            console.error(`Failed backfill for ${resort.id}:`, error.message);
                            failCount++;
                        }
                    }

                    console.log(`✅ Weather backfill complete: ${successCount} succeeded, ${failCount} failed`);
                    await markBackfillCompleted();
                }, 10000); // Start after 10 seconds
            } else {
                console.log("✓ Weather backfill already completed (skipping)");
            }
        } catch (err) {
            console.error("Error checking backfill status:", err);
        }
    })();
}
