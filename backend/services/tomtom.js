import dotenv from "dotenv";
dotenv.config();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
import { trackApiUsage, markLimitReached } from './system/usage.js';
// Munich Center (Marienplatz approx)
const MUNICH_COORDS = { lat: 48.1351, lon: 11.5820 };

export async function fetchTravelTimes(destinations, origin = null) {
    // destinations: [{ id, latitude, longitude }]
    // origin: { lat, lon } (Optional, defaults to Munich)

    if (!TOMTOM_API_KEY) {
        console.warn("⚠️ TOMTOM_API_KEY not found. Traffic data will be skipped.");
        return null;
    }

    // TomTom Matrix Routing API v2 (Sync)
    const startPoint = origin
        ? { "latitude": origin.lat, "longitude": origin.lon }
        : { "latitude": MUNICH_COORDS.lat, "longitude": MUNICH_COORDS.lon };

    const origins = [{ point: startPoint }];

    const destPoints = destinations
        .filter(d => d.latitude && d.longitude)
        .map(d => ({
            point: { "latitude": d.latitude, "longitude": d.longitude }
        }));

    // Map array index back to resort ID
    const mapIndexToResortId = {};
    let validIndex = 0;
    destinations.forEach(d => {
        if (d.latitude && d.longitude) {
            mapIndexToResortId[validIndex] = d.id;
            validIndex++;
        }
    });

    if (destPoints.length === 0) return {};

    // Matrix v2 Endpoint
    const url = `https://api.tomtom.com/routing/matrix/2?key=${TOMTOM_API_KEY}`;

    const body = {
        origins: origins,
        destinations: destPoints
    };

    try {
        trackApiUsage('tomtom', destPoints.length);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            // Check for Quota Limit (403 or specific error text)
            if (response.status === 403) {
                // Ensure we mark it even if error text parsing fails
                markLimitReached('tomtom');
            }

            const err = await response.text();

            if (err.includes('OVER_TRANSACTION_LIMIT') || response.status === 403) {
                markLimitReached('tomtom');
            }

            throw new Error(`TomTom API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        const results = {};

        // v2 Response format: { data: [ { routeSummary: ... }, ... ] }
        // The array is flattened: origins * destinations
        // We have 1 origin, so data.data[i] corresponds to destination[i]

        if (!data.data) return {};

        data.data.forEach((result, index) => {
            const resortId = mapIndexToResortId[index];
            if (!resortId) return;

            // Check for success via routeSummary presence or lack of error
            const summary = result.routeSummary;

            if (summary) {
                results[resortId] = {
                    duration: summary.travelTimeInSeconds, // Seconds
                    distanceKm: (summary.lengthInMeters / 1000).toFixed(1),
                    delay: summary.trafficDelayInSeconds   // Seconds
                };
            } else {
                console.warn(`Routing failed for ${resortId}:`, result);
            }
        });

        return results;

    } catch (error) {
        console.error("Travel Times fetch failed:", error.message);
        return {};
    }
}

/**
 * Fetches traffic data for N origins to M destinations.
 * @param {Array} origins Array of { id, latitude, longitude }
 * @param {Array} destinations Array of { id, latitude, longitude }
 * @returns {Object} { [originId]: { [destId]: { duration, delay } } }
 */
export async function fetchTrafficMatrix(origins, destinations) {
    if (!TOMTOM_API_KEY) {
        console.warn("⚠️ TOMTOM_API_KEY not found.");
        return null;
    }

    // TomTom Matrix API Limit: 100 cells max (origins * destinations <= 100)
    // Dynamic batch size calculation
    const MAX_CELLS = 100;
    const numOrigins = origins.length;
    if (numOrigins === 0) return {};

    // Calculate max destinations per batch
    const BATCH_SIZE = Math.floor(MAX_CELLS / numOrigins);

    // Safety check
    if (BATCH_SIZE === 0) {
        console.error("Too many origins for Matrix API limit.");
        return null; // Or handle split origins
    }

    const results = {};

    // Initialize results structure
    origins.forEach(origin => {
        results[origin.id] = {};
    });

    // Split destinations into batches
    for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
        const destBatch = destinations.slice(i, i + BATCH_SIZE);

        console.log(`Fetching traffic matrix batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(destinations.length / BATCH_SIZE)} (${destBatch.length} destinations, ${numOrigins} origins)...`);

        // Prepare origins
        const originCoords = origins.map(o => ({
            point: { latitude: o.latitude, longitude: o.longitude }
        }));

        // Prepare destinations
        const destCoords = destBatch.map(d => ({
            point: { latitude: d.latitude, longitude: d.longitude }
        }));

        const body = {
            origins: originCoords,
            destinations: destCoords
        };

        const url = `https://api.tomtom.com/routing/matrix/2?key=${TOMTOM_API_KEY}`;

        try {
            trackApiUsage('matrix_batch');
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                if (response.status === 403) markLimitReached('matrix_batch');
                const errText = await response.text();

                if (errText.includes('OVER_TRANSACTION_LIMIT')) markLimitReached('matrix_batch');

                throw new Error(`TomTom Matrix Error: ${response.status} ${errText}`);
            }

            const data = await response.json();

            // Response data is in data.data (array of results)
            // Ordered by Origin, then Destination.
            // Index = originIndex * numDestinations + destIndex

            const nDest = destBatch.length;

            origins.forEach((origin, oIdx) => {
                destBatch.forEach((dest, dIdx) => {
                    const flatIndex = oIdx * nDest + dIdx;
                    const routeData = data.data[flatIndex];

                    if (routeData && routeData.routeSummary) {
                        const travelTime = routeData.routeSummary.travelTimeInSeconds; // live
                        const trafficDelay = routeData.routeSummary.trafficDelayInSeconds; // delay

                        results[origin.id][dest.id] = {
                            duration: travelTime, // seconds
                            delay: trafficDelay // seconds
                        };
                    } else {
                        results[origin.id][dest.id] = null;
                    }
                });
            });

            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < destinations.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

        } catch (error) {
            console.error(`Traffic Matrix batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
            // Continue with next batch even if one fails
        }
    }

    return results;
}


