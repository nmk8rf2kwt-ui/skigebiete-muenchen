import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pLimit from "p-limit";
import { PARSERS } from "../parsers/index.js";
import { parserCache, weatherCache, trafficCache } from "./cache.js";
import logger from "./logger.js";
import { statusLogger } from "./statusLogger.js"; // New status logger
import { ResortDataSchema } from "../utils/schema.js";
import * as Sentry from "@sentry/node";

// -- PATH CONFIG --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// We are in backend/services, resorts.json is in backend/
const RESORTS_FILE = path.join(__dirname, "../resorts.json");

// -- STATE --
let STATIC_RESORTS = [];

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

// -- HELPERS --

// Helper: Fetch with Timeout using AbortController
async function fetchWithTimeout(promiseFactory, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // Pass signal to the factory function if it accepts options, 
        // OR we assume the factory returns a promise that listens to it?
        // Actually, our parsers don't accept signals yet without refactoring ALL of them.
        // BUT, for the ones using fetchWithHeaders (which we just updated), we CAN pass the signal.
        // However, the current signature `parser()` takes no args.
        // We need to modify how parsers are called to pass options.

        // For now, since we haven't refactored all parsers to accept options, 
        // we keep the Promise.race logic BUT we add the controller logic for future proofs
        // and for the ones we ARE refactoring.
        // Wait, to truly fix the leak, parsers MUST accept a signal.

        // Let's change the pattern: pass signal to parser(options)
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

// Concurrency Limit
const limit = pLimit(5);

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

                if (parser) {
                    // Check cache first
                    const cached = parserCache.get(resort.id);
                    if (cached) {
                        liveData = {
                            ...liveData,
                            ...cached,
                            status: "live",
                            cached: true,
                        };
                    } else {
                        // Fetch fresh
                        try {
                            const rawData = await fetchWithTimeout((opts) => parser(opts), 8000); // 8s timeout

                            // VALIDATION
                            // Parse (strict) or safeParse (soft)
                            const validation = ResortDataSchema.safeParse(rawData);

                            if (!validation.success) {
                                console.error(`❌ Validation failed for ${resort.id}:`, validation.error.format());

                                // Log to Sentry as warning (not error) so we track it but don't crash
                                if (typeof Sentry !== 'undefined' && Sentry.captureMessage) {
                                    Sentry.captureMessage(`Parser validation failed for ${resort.id}`, {
                                        level: 'warning',
                                        extra: {
                                            resortId: resort.id,
                                            resortName: resort.name,
                                            validationErrors: validation.error.format(),
                                            rawData: rawData
                                        }
                                    });
                                }

                                // Don't throw - gracefully degrade
                                logger.scraper.warn(`Parser validation failed for ${resort.id}, using fallback`);
                                liveData.status = "error";
                                statusLogger.log('warning', 'scraper', `Parser validation failed for ${resort.name}`);
                                statusLogger.updateComponentStatus('scraper', 'degraded'); // Mark scraper as degraded
                            } else {
                                const data = validation.data;

                                liveData = {
                                    ...liveData,
                                    ...data,
                                    status: "live",
                                    cached: false,
                                };
                                // Store in cache
                                parserCache.set(resort.id, data);
                                logger.scraper.info(`Updated ${resort.id}`, {
                                    source: data.source || resort.website,
                                    lifts: `${data.liftsOpen}/${data.liftsTotal}`

                                });
                            }
                        } catch (error) {
                            logger.scraper.error(`Parser error for ${resort.id}: ${error.message}`);
                            liveData.status = "error";
                            // Log error to system status
                            statusLogger.log('error', 'scraper', `Failed to update ${resort.name}: ${error.message}`);
                        }
                    }
                }

                // Inject Fallback Weather/Snow from Weather Service if missing
                const weatherData = weatherCache.get(resort.id);
                if (weatherData) {
                    if (!liveData.weather && weatherData.current) {
                        liveData.weather =
                            weatherData.current.emoji + " " + weatherData.current.weather;
                    }

                    // Inject Fallback Snow Data if missing or error
                    if (!liveData.snow || liveData.status === "error") {
                        const { getFallbackSnow } = await import("./snowFallback.js");
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
                const traffic = trafficCache.get(resort.id);
                if (traffic) {
                    // Overwrite static distance with live duration - DISABLED to allow comparison
                    // resort.distance = traffic.duration; 
                    liveData.traffic = traffic; // Pass full object if frontend needs distance km
                }

                return {
                    ...resort,
                    ...liveData,
                    id: resort.id,
                    name: resort.name,
                };
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
    const parser = PARSERS[resortId];

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

    const parser = PARSERS[resortId];
    if (!parser) throw new Error("No parser for this resort");

    try {
        logger.scraper.info(`🔄 Force refreshing ${resortId}...`);
        const rawData = await fetchWithTimeout((opts) => parser(opts), 10000);
        const validation = ResortDataSchema.safeParse(rawData);

        if (!validation.success) {
            throw new Error("Validation failed: " + JSON.stringify(validation.error.format()));
        }

        const data = validation.data;
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
