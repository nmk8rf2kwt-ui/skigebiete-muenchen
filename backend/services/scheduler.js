import { getStaticResorts } from "./resorts/service.js";
import { getWeatherForecast, getCurrentConditions } from "./weather/forecast.js";
import { weatherCache, parserCache, trafficCache } from "./cache.js";
import { PARSERS } from "../parsers/index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { saveSnapshot, cleanup as cleanupHistory, saveTrafficLog, saveMatrixTrafficLog, updateHistoricalWeather, isBackfillCompleted, markBackfillCompleted, syncResortsToDatabase } from "./resorts/archive.js";
import logger from './logger.js';
import { statusLogger, checkDatabaseHealth } from "./system/monitoring.js";

import { fetchTrafficMatrix } from "./tomtom.js";
import { getYesterdayWeather, backfillWeatherHistory } from "./weather/historical.js";

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
                    if (successCount <= 5) console.log(`  -> Cached weather for ${resort.id}: ${current.emoji} ${current.temp}`);
                } else {
                    console.warn(`  -> Weather fetch returned null for ${resort.id}`);
                }
            } catch (err) {
                console.error(`Failed to fetch weather for ${resort.id}:`, err);
                statusLogger.log('warn', 'weather', `Failed to fetch weather for ${resort.name}`);
            }
        } else {
            // console.log(`  -> Skipping ${resort.id} (no lat/lon)`);
        }
    }
    console.log(`Weather refresh complete. Success: ${successCount}/${resorts.length}`);
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

// 3. Unified Traffic Matrix Job (Every 30 min 06-22)
// Replaces refreshTraffic and trackCityTraffic
export async function updateTrafficMatrix() {
    const now = new Date();
    const hour = now.getHours();

    // Run only between 06:00 and 22:00
    if (hour < 6 || hour >= 22) {
        console.log("💤 Traffic logs skipped (night time).");
        return;
    }

    console.log("🚦 Updating Traffic Matrix...");

    try {
        // 1. Load Data
        const resorts = getStaticResorts().filter(r => r.latitude && r.longitude);

        const citiesPath = path.join(__dirname, '../data/reference_cities.json');

        if (!fs.existsSync(citiesPath)) {
            console.warn("City reference file missing. Aborting matrix update.");
            return;
        }
        const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'))
            .filter(c => c.id === 'muenchen'); // ⚠️ LIMIT: Only Munich to save API quota

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
                    // HISTORY MANAGEMENT
                    const existing = trafficCache.get(resortId);
                    const trafficHistory = existing ? (existing.trafficHistory || []) : [];

                    const newPoint = {
                        timestamp: new Date().toISOString(),
                        duration: Math.round(data.duration / 60), // Store in minutes
                        delay: Math.round(data.delay / 60)
                    };

                    // Add new point to start
                    trafficHistory.unshift(newPoint);

                    // Keep last 24 entries (~12 hours)
                    const keptHistory = trafficHistory.slice(0, 24);

                    trafficCache.set(resortId, {
                        ...data,
                        delay_min: Math.round(data.delay / 60),
                        duration_min: Math.round(data.duration / 60),
                        trafficHistory: keptHistory // Persist history
                    });

                    // Log Standard History (Legacy format for main chart?)
                    const resort = resorts.find(r => r.id === resortId);
                    if (resort) {
                        const standard = resort.distance || 0;
                        await saveTrafficLog(resortId, standard, Math.round(data.duration / 60));
                    }
                }
            }
            logger.traffic.info("✅ Updated Standard Traffic Cache (Munich).");
        } else {
            logger.traffic.warn("⚠️ Munich data missing in matrix response. Cache not updated.");
        }

        // B. Log Detailed Matrix History (All 5 Cities)
        let logCount = 0;
        for (const city of cities) {
            const cityData = trafficMatrix[city.id];
            if (cityData) {
                for (const resort of resorts) {
                    const data = cityData[resort.id];
                    if (data) {
                        await saveMatrixTrafficLog(
                            city.id,
                            city.name,
                            resort.id,
                            Math.round(data.duration / 60),
                            Math.round(data.delay / 60)
                        );
                        logCount++;
                    }
                }
            }
        }
        logger.traffic.info(`📝 Logged ${logCount} matrix entries.`);

        // Mark traffic API as healthy after successful update
        statusLogger.updateComponentStatus('traffic', 'healthy');
        statusLogger.log('success', 'traffic', `Traffic matrix updated successfully (${logCount} entries).`);

        // Update traffic analysis metrics
        statusLogger.updateMetric('traffic_data_points', logCount);
        statusLogger.updateMetric('traffic_last_update', new Date().toISOString());
        statusLogger.updateComponentStatus('traffic_analysis', logCount > 0 ? 'healthy' : 'degraded');
        statusLogger.log('info', 'traffic_analysis', `Collected ${logCount} traffic data points for analysis.`);

    } catch (error) {
        logger.traffic.error(`Error in updateTrafficMatrix: ${error.message}`);
        statusLogger.updateComponentStatus('traffic', 'degraded');
        statusLogger.updateComponentStatus('traffic_analysis', 'degraded');
        statusLogger.log('error', 'traffic', `Traffic Matrix update failed: ${error.message}`);
    }
}

// 4. Warm Traffic Cache from DB
export async function warmTrafficCache() {
    console.log("🔥 Warming traffic cache from DB...");
    const { getResortTrafficHistory } = await import("./resorts/archive.js");
    const resorts = getStaticResorts();
    const cityId = 'muenchen';

    for (const resort of resorts) {
        // Skip if we already have detailed history in cache
        const cached = trafficCache.get(resort.id);
        if (cached && cached.trafficHistory && cached.trafficHistory.length > 5) continue;

        try {
            // Get last 20 logs
            // Ideally we'd have a limit param in getResortTrafficHistory, but we can slice
            const logs = await getResortTrafficHistory(cityId, resort.id);
            if (logs && logs.length > 0) {
                // Determine most recent to see if we have live data
                // logs is ordered ASC by default in archive.js (check implementation)
                // wait, archive.js says: .order('timestamp', { ascending: true })
                // So newest is last.

                const recentLogs = logs.slice(-24).reverse(); // Newest first

                const trafficHistory = recentLogs.map(l => ({
                    timestamp: l.timestamp,
                    duration: l.duration, // Stored as minutes in DB? helper says "Math.round(data.duration / 60)" in updateMatrix
                    delay: l.delay
                }));

                // Get newest for "current" state if cache is empty
                const newest = trafficHistory[0];

                // Only update if cache is empty or stale?
                // We merge history into existing or create new
                const existingData = cached || {};

                trafficCache.set(resort.id, {
                    ...existingData,
                    // If no live data, maybe use newest log as fallback? 
                    // Better to let "status" handle live vs static.
                    // Just attach history.
                    trafficHistory: trafficHistory
                });
            }
        } catch (e) {
            console.error(`Failed to warm traffic for ${resort.id}:`, e.message);
        }
    }
    console.log("✅ Traffic cache warmed.");
}

// -- DATABASE HEALTH CHECK --

async function runDatabaseHealthCheck() {
    logger.db.info('🔍 Running database health check...');

    try {
        const health = await checkDatabaseHealth();

        if (health.status === 'critical') {
            statusLogger.updateComponentStatus('database', 'degraded');
            statusLogger.log('error', 'database', `CRITICAL: ${health.message} - ${health.action}`);
        } else if (health.status === 'warning') {
            statusLogger.updateComponentStatus('database', 'healthy');
            statusLogger.log('warn', 'database', `WARNING: ${health.message} - ${health.action}`);
        } else if (health.status === 'healthy') {
            statusLogger.updateComponentStatus('database', 'healthy');
            statusLogger.log('info', 'database', health.message);
        }

        // Update metrics in statusLogger
        if (health.sizeInfo) {
            statusLogger.updateMetric('db_size_mb', parseFloat(health.sizeInfo.totalSizeMB));
            statusLogger.updateMetric('db_percent_used', parseFloat(health.sizeInfo.percentUsed));
        }

    } catch (error) {
        logger.db.error(`Database health check failed: ${error.message}`);
        statusLogger.log('error', 'database', `Health check error: ${error.message}`);
    }
}

// -- PARSER REFRESH --

/**
 * Proactive refresh of all resort parsers to populate cache.
 * Helps prevent slow response times for users when cache expires.
 */
export async function refreshParsers() {
    console.log("🔄 Starting proactive parser refresh...");
    statusLogger.log('info', 'scraper', 'Starting proactive parser refresh...');
    try {
        const { refreshAllResorts } = await import("./resorts/service.js");
        await refreshAllResorts();
        console.log("✅ Proactive parser refresh complete.");
    } catch (error) {
        console.error("❌ Proactive parser refresh failed:", error.message);
        statusLogger.log('error', 'scraper', `Proactive refresh failed: ${error.message}`);
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

    // B. Traffic Matrix Loop (60 minutes) - Optimized frequency
    // OPTIMIZED: Reduced initial delay from 5s to 3s for faster startup
    setTimeout(() => {
        setInterval(updateTrafficMatrix, 60 * 60 * 1000); // Every 60 minutes (Limit API usage)
        updateTrafficMatrix(); // Initial run
    }, 3000);

    // Warm Traffic Cache (async, don't block)
    setTimeout(warmTrafficCache, 6000);

    // C. Initial fetch for weather - OPTIMIZED: Reduced from 2s to 1s
    setTimeout(refreshWeather, 1000);

    // D. Sync Static Resorts Config (One-time on start)
    setTimeout(() => {
        const resorts = getStaticResorts();
        syncResortsToDatabase(resorts);
    }, 4000);

    // E. Snapshot Loop (Check every hour) - DISABLED (Feature Removed)
    // setInterval(() => {
    //     const now = new Date();
    //     const currentDate = now.toISOString().split('T')[0];
    //     const currentHour = now.getHours();
    //
    //     // Run only if it's midnight hour (00:00 - 00:59) AND we haven't run today
    //     if (currentHour === 0 && lastSnapshotDate !== currentDate) {
    //         lastSnapshotDate = currentDate;
    //         saveDailySnapshots();
    //     }
    // }, 60 * 60 * 1000);

    // F. Parser Refresh Loop (4x Daily: 07:00, 11:00, 15:00, 19:00)
    let lastParserRefreshHour = null;
    setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDate = now.toISOString().split('T')[0];
        const refreshKey = `${currentDate}-${currentHour}`;

        if ([7, 11, 15, 19].includes(currentHour) && lastParserRefreshHour !== refreshKey) {
            lastParserRefreshHour = refreshKey;
            refreshParsers();
        }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // F2. Initial Parser Refresh - OPTIMIZED: Reduced from 15s to 10s
    // This resolves the "Unknown" status on cold starts and populates logs
    setTimeout(() => {
        console.log("🚀 Triggering initial parser refresh on startup...");
        refreshParsers();
    }, 10000);

    // G. Database Health Check (Daily at 03:00)
    setInterval(() => {
        const currentHour = new Date().getHours();
        if (currentHour === 3) {
            runDatabaseHealthCheck();
        }
    }, 60 * 60 * 1000); // Check every hour, run at 03:00

    // Initial health check on startup
    setTimeout(runDatabaseHealthCheck, 8000); // 10 seconds after startup


    // H. History Cleanup (Daily)
    setInterval(cleanupHistory, 24 * 60 * 60 * 1000);

    // F. One-time Weather Backfill (First Start Only) - DISABLED (Feature Removed)
    // Wrapped in IIFE to handle async check
    /*
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
    */
}
