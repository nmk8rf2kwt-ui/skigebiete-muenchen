import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pLimit from "p-limit";
import { PARSERS } from "../../parsers/index.js";
import { getParserType } from "../../parsers/parserTypes.js";
import { parserCache, weatherCache, trafficCache } from "../cache.js";
import logger from "../logger.js";
import { statusLogger } from "../system/monitoring.js"; // Unified monitoring service
import { ResortDataSchema } from "../../validation/schemas.js";
import * as Sentry from "@sentry/node";
import { calculateSmartScore } from "../smartscore.js";
import { fetchTravelTimes } from "../tomtom.js";


// -- PATH CONFIG --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// We are in backend/services, resorts.json is in backend/
const RESORTS_FILE = path.join(__dirname, "../../resorts.json");
const VALID_PARSER_IDS = new Set(Object.keys(PARSERS));

// -- STATE --
let STATIC_RESORTS = [];
const previousLiftCounts = new Map(); // Store last lift count for diff calculation

// -- HELPERS --

function getCountry(resort) {
    if (resort.address && resort.address.includes("Österreich")) return "AT";
    if (resort.website && resort.website.endsWith(".at")) return "AT";
    if (resort.latitude < 47.6 && resort.longitude > 10.5 && resort.longitude < 13.0) return "AT"; // Rough heuristic for Tyrol border if undefined
    return "DE"; // Default to DE
}

function getNextScheduledRun() {
    const now = new Date();
    const currentHour = now.getHours();
    const schedule = [7, 11, 15, 19];

    // Find next hour today
    let nextHour = schedule.find(h => h > currentHour);
    let nextDate = new Date(now);

    if (nextHour === undefined) {
        // Next run is tomorrow at 07:00
        nextHour = 7;
        nextDate.setDate(nextDate.getDate() + 1);
    }

    nextDate.setHours(nextHour, 0, 0, 0);
    return nextDate.toISOString();
}

// -- INITIALIZATION --
function loadResorts() {
    try {
        if (!fs.existsSync(RESORTS_FILE)) {
            throw new Error(`Config file not found: ${RESORTS_FILE}`);
        }
        const data = fs.readFileSync(RESORTS_FILE, "utf8");
        STATIC_RESORTS = JSON.parse(data);
        logger.info(`✅ Loaded ${STATIC_RESORTS.length} resorts from configuration.`);
    } catch (err) {
        logger.error("❌ FATAL: Error reading resorts.json:", err);
        process.exit(1);
    }
}

// Load immediately on import
loadResorts();

// -- SCHEDULER --
if (process.env.NODE_ENV !== 'test') {
    // Update traffic every hour, but ONLY between 06:00 and 20:00
    setInterval(async () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 20) {
            logger.info("🚦 Scheduled Traffic Update started...");
            await updateTrafficData();
        } else {
            logger.info("💤 Traffic Update skipped (Night Mode)");
        }
    }, 60 * 60 * 1000);

    // Initial Traffic Update (delayed)
    setTimeout(() => {
        updateTrafficData();
    }, 10000);
}

// -- HELPERS --

// Helper: Fetch with Timeout using AbortController
async function fetchWithTimeout(promiseFactory, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const result = await Promise.race([
            promiseFactory({ signal: controller.signal }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
            })
        ]);
        return result;
    } finally {
        clearTimeout(timeout);
    }
}

// -- EXPORTS --

export function getStaticResorts() {
    return STATIC_RESORTS;
}

export function getResortConfig(id) {
    return STATIC_RESORTS.find((r) => r.id === id);
}

/**
 * Fast status check for Admin Dashboard
 * Returns current cache state without triggering scrapes
 */
export function getResortsStatus() {
    const resorts = getStaticResorts();
    return resorts.map(resort => {
        // Access raw cache item to get timestamp
        const cachedItem = parserCache.cache.get(resort.id);
        const cachedData = cachedItem ? cachedItem.data : null;

        // Check for expiry manually or rely on cleanup? 
        // Let's rely on cleanup for status view to be fast.

        const traffic = trafficCache.get(resort.id);

        return {
            id: resort.id,
            name: resort.name,
            country: getCountry(resort),
            status: cachedData ? 'live' : 'pending',
            hasParser: !!PARSERS[resort.id],
            liftsOpen: cachedData ? cachedData.liftsOpen : null,
            liftsTotal: cachedData ? cachedData.liftsTotal : null,
            liftsDiff: cachedData ? (cachedData.liftsDiff || 0) : 0,
            lastUpdated: cachedItem && cachedItem.timestamp
                ? new Date(cachedItem.timestamp).toISOString()
                : null,
            nextRun: getNextScheduledRun(),
            trafficDelay: traffic ? traffic.delay_min : null,
            updatesToday: parserCache.getHistory(resort.id).length,
            lastDetails: cachedData // Expose data explicitly
        };
    });
}


// Concurrency Limit
const limit = pLimit(2);

export async function getAllResortsLive() {
    const resorts = getStaticResorts();

    const results = await Promise.all(
        resorts.map((resort) =>
            limit(async () => {
                const parser = PARSERS[resort.id];
                let liveData = {
                    liftsOpen: null,
                    liftsTotal: null,
                    snow: null,
                    weather: null,
                    status: "static_only",
                };

                // Track timestamps for freshness calculation
                let parserTimestamp = null;
                let parserMeta = null;

                if (parser) {
                    // Check cache first
                    const cachedItem = parserCache.cache.get(resort.id);
                    if (cachedItem && cachedItem.data) {
                        const cached = cachedItem.data;
                        parserTimestamp = cachedItem.timestamp;
                        liveData = {
                            ...liveData,
                            ...cached,
                            status: "live",
                            cached: true,
                        };
                        // Try to get parser metadata
                        try {
                            const parserModule = await import(`../../parsers/${resort.id}.js`);
                            parserMeta = parserModule.parserMeta || {
                                type: 'UNKNOWN',
                                sourceUrl: resort.website,
                                sourceName: 'Website'
                            };
                        } catch {
                            parserMeta = { type: 'UNKNOWN', sourceUrl: resort.website, sourceName: 'Website' };
                        }
                    } else {
                        // NO FETCH - Background Scheduler Only
                        liveData.status = "static_only"; // Or "pending"
                    }
                } else {
                    liveData.status = "static_only";
                }

                // Inject Fallback Weather/Snow from Weather Service if missing
                const weatherCacheItem = weatherCache.cache.get(resort.id);
                const weatherData = weatherCacheItem?.data;
                const weatherTimestamp = weatherCacheItem?.timestamp || null;

                if (weatherData) {
                    if (!liveData.weather && weatherData.current) {
                        liveData.weather =
                            weatherData.current.emoji + " " + weatherData.current.weather;
                    }

                    // Inject Fallback Snow Data if missing or error
                    if (!liveData.snow || liveData.status === "error") {
                        const { getFallbackSnow } = await import("../weather/snow.js");
                        const fallbackSnow = getFallbackSnow(weatherData);
                        if (fallbackSnow) {
                            liveData.snow = fallbackSnow;
                        } else if (!liveData.snow) {
                            // Legacy string fallback if structured fails for some reason
                            liveData.snow = "> " + weatherData.current.snow;
                        }
                    } else if (typeof liveData.snow === 'string') {
                        // If parser returned a string (legacy parser), wrap it or leave it?
                        // Ideally we upgrade all parsers, but for now, let's wrap it if possible or leave it.
                        // Frontend needs to handle both strings (legacy) and objects (new).
                    }

                    // Inject full forecast for frontend display
                    if (weatherData.forecast) {
                        liveData.forecast = {
                            forecast: weatherData.forecast.forecast,
                            lastSnowfall: weatherData.forecast.lastSnowfall
                        };
                    }
                }

                // Inject Traffic Data
                const trafficCacheItem = trafficCache.cache.get(resort.id);
                const traffic = trafficCacheItem?.data;
                const trafficTimestamp = trafficCacheItem?.timestamp || null;

                if (traffic) {
                    // Overwrite static distance with live duration - DISABLED to allow comparison
                    // resort.distance = traffic.duration; 

                    // Calculate History Stats
                    const history = traffic.trafficHistory || [];
                    let historyStats = null;

                    if (history.length > 0) {
                        const durations = history.map(h => h.duration).filter(d => d > 0);

                        if (durations.length > 0) {
                            // Average
                            const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

                            // Top 5 (Fastest times) - Unique values? No, just fastest occurrences
                            const top5 = [...durations].sort((a, b) => a - b).slice(0, 5);

                            historyStats = {
                                avg: avg,
                                top5: top5,
                                count: durations.length
                            };
                        }
                    }

                    liveData.traffic = {
                        ...traffic,
                        historyStats // Expose stats
                    };
                }

                // ============ SMARTSCORE CALCULATION ============

                // Extract snow depth (handle both object and string formats)
                let snowDepthCm = null;
                if (liveData.snow) {
                    if (typeof liveData.snow === 'object') {
                        // Try mountain first, then valley
                        snowDepthCm = liveData.snow.mountain ?? liveData.snow.valley ?? null;
                        if (snowDepthCm !== null) {
                            snowDepthCm = parseInt(snowDepthCm) || null;
                        }
                    } else if (typeof liveData.snow === 'string') {
                        const match = liveData.snow.match(/(\d+)/);
                        snowDepthCm = match ? parseInt(match[1]) : null;
                    }
                }
                // Fallback: try to get snow depth from forecast if not available
                if (snowDepthCm === null && weatherData?.forecast?.forecast?.[0]?.snowDepth) {
                    snowDepthCm = weatherData.forecast.forecast[0].snowDepth;
                }

                // Get weather conditions for comfort calculation
                const currentConditions = weatherData?.forecast?.currentConditions || {};

                // Get ETA (travel time with traffic) - convert from seconds to minutes
                const etaMinutes = traffic?.duration ? Math.round(traffic.duration / 60) : null;

                // Get price
                const priceEur = resort.priceDetail?.adult || resort.price || null;

                // Calculate SmartScore
                const smartScoreResult = calculateSmartScore({
                    liftsOpen: liveData.liftsOpen,
                    liftsTotal: liveData.liftsTotal || resort.lifts,
                    etaMinutes,
                    snowDepthCm,
                    tempC: currentConditions.temp,
                    precipMm: currentConditions.precipitationNext3h,
                    windKmh: currentConditions.windSpeed,
                    priceEur,
                    timestamps: {
                        lifts: parserTimestamp,
                        weather: weatherTimestamp,
                        traffic: trafficTimestamp,
                        snow: weatherTimestamp,  // Snow comes from weather API
                        price: Date.now()        // Static data, always fresh
                    }
                });

                // Build data sources metadata for frontend
                const dataSources = {
                    lifts: {
                        lastUpdated: parserTimestamp ? new Date(parserTimestamp).toISOString() : null,
                        source: parserMeta?.sourceName || 'Unknown',
                        sourceUrl: parserMeta?.sourceUrl || null,
                        type: getParserType(resort.id),
                        freshness: smartScoreResult.freshness.lifts
                    },
                    weather: {
                        lastUpdated: weatherTimestamp ? new Date(weatherTimestamp).toISOString() : null,
                        source: 'Open-Meteo',
                        sourceUrl: 'https://open-meteo.com',
                        type: 'API',
                        freshness: smartScoreResult.freshness.weather
                    },
                    snow: {
                        lastUpdated: weatherTimestamp ? new Date(weatherTimestamp).toISOString() : null,
                        source: 'Open-Meteo',
                        sourceUrl: 'https://open-meteo.com',
                        type: 'API',
                        freshness: smartScoreResult.freshness.snow
                    },
                    traffic: {
                        lastUpdated: trafficTimestamp ? new Date(trafficTimestamp).toISOString() : null,
                        source: 'TomTom',
                        sourceUrl: 'https://developer.tomtom.com',
                        type: 'API',
                        freshness: smartScoreResult.freshness.traffic
                    }
                };


                // Explicitly Construct Return Object
                // Prevent `resort.lifts` (number) from overwriting `liveData.lifts` (array)
                // If liveData.lifts is an array, we keep it. If it's missing, we DO NOT put the static number in its place.

                const finalResort = {
                    ...resort,
                    ...liveData,
                    id: resort.id,
                    name: resort.name,

                    // Critical Fix for Details Column:
                    // Ensure 'lifts' and 'slopes' are arrays or undefined/null, NEVER numbers.
                    lifts: Array.isArray(liveData.lifts) ? liveData.lifts : undefined,
                    slopes: Array.isArray(liveData.slopes) ? liveData.slopes : undefined,

                    // Static data usually has 'lifts' as a number (total count).
                    // We map this to 'liftsTotal' if not already present from liveData.
                    liftsTotal: liveData.liftsTotal ?? resort.lifts,

                    // SmartScore data
                    smartScore: smartScoreResult.total,
                    smartScoreComponents: smartScoreResult.components,
                    smartScoreResult: smartScoreResult,
                    dataSources
                };

                return finalResort;
            })
        )
    );

    // Log batch completion
    const errorCount = results.filter(r => r.status === 'error').length;
    if (errorCount > 0) {
        statusLogger.log('warn', 'scraper', `Batch update finished with ${errorCount} errors.`);
        statusLogger.updateComponentStatus('scraper', 'degraded');
    } else {
        statusLogger.log('success', 'scraper', `All ${resorts.length} resorts updated successfully.`);
        statusLogger.updateComponentStatus('scraper', 'healthy');
    }

    return results;
}


// Single Resort Fetch (with cache check)
export async function getSingleResortLive(resortId) {
    const resort = getResortConfig(resortId);

    // SECURITY: Only access PARSERS if the ID is definitely valid (CodeQL Safe)
    const parser = VALID_PARSER_IDS.has(resortId) ? PARSERS[resortId] : null;

    // If unknown and no parser, return null
    if (!resort && !parser) return null;

    // Use existing parser logic if possible, or just raw fetch
    // Reusing the logic from getAllResortsLive implies calling it for one.
    // But usually this endpoint is for "force refresh" or specific debugging.
    // For now, let's keep it simple:

    try {
        if (parser) {
            // We DO NOT check cache here usually if the user explicitly requests one item? 
            // Actually, for consistency, we should. 
            // But the legacy code `api/lifts/:resort` seemed to trigger a fresh fetch?
            // The code said: `const data = parser ? await fetchWithTimeout(parser(), 8000) : {};`
            // So it was always fresh. Let's keep that behavior for this specific function.


            if (typeof parser !== 'function') throw new Error(`Invalid parser type for ${resortId}`);
            const data = await fetchWithTimeout((opts) => parser(opts), 8000);
            return {
                ...(resort || {}),
                ...data,
                lastUpdated: new Date().toISOString()
            };
        }
        return resort || null;
    } catch (err) {
        console.error(err);
        // Return partial error object
        return {
            ...(resort || {}),
            error: "Internal parser error or timeout"
        };
    }
}

// -- Force Refresh --
export async function forceRefreshResort(resortId) {
    const resort = getResortConfig(resortId);
    if (!resort) throw new Error("Resort not found");

    // Securely validate that the resortId corresponds to a real parser (prevents prototype access)
    // CodeQL: Using explicit Set lookup
    if (!VALID_PARSER_IDS.has(resortId)) {
        throw new Error("No parser for this resort");
    }
    const parser = PARSERS[resortId];

    // Extra safety measure
    if (!parser) throw new Error("No parser for this resort");

    try {
        logger.scraper.info(`🔄 Force refreshing ${resortId}...`);
        if (typeof parser !== 'function') throw new Error(`Invalid parser type for ${resortId}`);
        const rawData = await fetchWithTimeout((opts) => parser(opts), 10000);

        // Enrich with static metadata before validation to satisfy schema requirements
        // Enrich with static metadata before validation to satisfy schema requirements
        // Defensive Name Resolution: Ensure name exists to prevent validation failure
        let finalName = rawData.name;
        if (!finalName && resort.name) {
            // High verbosity log to confirm this path is working in prod
            // logger.debug(`ℹ️ Name missing from parser for ${resort.id}, using config fallback: ${resort.name}`);
            finalName = resort.name;
        }
        if (!finalName) {
            logger.warn(`⚠️ Resort ${resort.id} missing name in both parser output and config during forceRefresh! Using fallback.`);
            finalName = "Unknown Resort";
        }

        const dataToValidate = {
            id: resort.id,
            status: rawData.status || 'live',
            ...rawData,
            name: finalName,
        };
        const validation = ResortDataSchema.safeParse(dataToValidate);

        if (!validation.success) {
            throw new Error("Validation failed: " + JSON.stringify(validation.error.format()));
        }

        const data = validation.data;

        // Calculate Lift Diff
        if (typeof data.liftsOpen === 'number') {
            const previous = previousLiftCounts.get(resort.id) || data.liftsOpen;
            data.liftsDiff = data.liftsOpen - previous;
            previousLiftCounts.set(resort.id, data.liftsOpen);
        }

        parserCache.set(resort.id, data);

        logger.scraper.info(`✅ Forced update success for ${resort.id}`);
        return { success: true, data };
    } catch (err) {
        logger.scraper.error(`Force refresh failed for ${resort.id}: ${err.message}`);
        // Remove bad data from cache? No, keep stale if available? Or clear?
        // Let's clear so we see the error state.
        parserCache.cache.delete(resort.id);
        throw err;
    }
}



/**
 * STRICT Refresh of all parsers.
 * Unlike getAllResortsLive (which is passive/cached), this FORCES a fetch for every resort.
 * Used by the Scheduler.
 */
export async function refreshAllResorts() {
    const resorts = getStaticResorts();
    logger.scraper.info(`🔄 Starting active batch refresh for ${resorts.length} resorts...`);

    const results = await Promise.all(
        resorts.map(resort => limit(async () => {
            // Add jitter to prevent thundering herd on API endpoints (0.5s - 2s)
            const jitter = Math.floor(Math.random() * 1500) + 500;
            await new Promise(resolve => setTimeout(resolve, jitter));

            const parser = PARSERS[resort.id];
            if (!parser) return { id: resort.id, status: 'skipped' };

            try {
                // Reuse forceRefreshResort (handles fetch, validate, cache, logging)
                await forceRefreshResort(resort.id);
                return { id: resort.id, status: 'success' };
            } catch (err) {
                // Error is already logged in forceRefreshResort, but we return status for summary
                return { id: resort.id, status: 'error', error: err.message };
            }
        }))
    );

    const errorCount = results.filter(r => r.status === 'error').length;
    const successCount = results.filter(r => r.status === 'success').length;

    if (errorCount > 0) {
        statusLogger.log('warn', 'scraper', `Batch refresh finished with ${errorCount} errors (${successCount} success).`);
        statusLogger.updateComponentStatus('scraper', 'degraded');
    } else {
        statusLogger.log('success', 'scraper', `Batch refresh success: ${successCount} resorts updated.`);
        statusLogger.updateComponentStatus('scraper', 'healthy');
    }

    return results;
}


/**
 * Validates and updates traffic data for all resorts
 */
export async function updateTrafficData() {
    const resorts = getStaticResorts();
    const destinations = resorts.map(r => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude
    }));

    try {
        const results = await fetchTravelTimes(destinations);

        if (results) {
            let updateCount = 0;
            for (const [resortId, data] of Object.entries(results)) {
                if (data) {
                    // Update Cache
                    trafficCache.set(resortId, {
                        ...data,
                        delay_min: Math.round(data.delay / 60),
                        duration_min: Math.round(data.duration / 60)
                    });
                    updateCount++;
                }
            }
            logger.info(`✅ Traffic updated for ${updateCount} resorts.`);
        }
    } catch (err) {
        logger.error("❌ Failed to update traffic data:", err);
    }
}
