import dotenv from "dotenv";
dotenv.config();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
import { trackApiUsage } from './system/usage.js';
// Munich Center (Marienplatz approx)
const MUNICH_COORDS = { lat: 48.1351, lon: 11.5820 };

export async function fetchTravelTimes(destinations, origin = null) {
    // destinations: [{ id, latitude, longitude }]
    // origin: { lat, lon } (Optional, defaults to Munich)

    if (!TOMTOM_API_KEY) {
        console.warn("⚠️ TOMTOM_API_KEY not found. Traffic data will be skipped.");
        return null;
    }

    // TomTom Matrix Routing API (Sync)
    // Limits: 2500 requests/day, but batch size is strictly limited?
    // Matrix Routing V2 allows POST with body.
    // Origins: [Munich], Destinations: [All Resorts]

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

    // TomTom Batch Limit: Matrix synchronous is limited to 100 cells (1 origin * 100 dests). 
    // We have ~60 resorts, so 1 batch is fine.

    const url = `https://api.tomtom.com/routing/1/matrix/sync/json?key=${TOMTOM_API_KEY}`;

    const body = {
        origins: origins,
        destinations: destPoints
        // Note: Traffic is included by default in Matrix API
        // No 'options' parameter needed - it causes 400 errors
    };

    try {
        trackApiUsage('routing_sync');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`TomTom API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        const results = {};

        // data.matrix is 2D array [originIndex][destIndex]
        // data.matrix[0] -> Array of results for Munich to All Dests

        if (!data.matrix || !data.matrix[0]) return {};

        data.matrix[0].forEach((result, index) => {
            const resortId = mapIndexToResortId[index];
            if (!resortId) return;

            if (result.statusCode !== 200) {
                console.warn(`Routing failed for ${resortId}`);
                return;
            }

            const summary = result.routeSummary || result.response?.routeSummary;
            // Structure: { lengthInMeters: 123, travelTimeInSeconds: 123, trafficDelayInSeconds: 0, ... }

            if (summary) {
                results[resortId] = {
                    duration: summary.travelTimeInSeconds, // Store in seconds!
                    distanceKm: (summary.lengthInMeters / 1000).toFixed(1),
                    delay: summary.trafficDelayInSeconds   // Store in seconds!
                };
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
    // We have 5 cities and 60 resorts = 300 cells → Need to batch!
    // Strategy: Split destinations into batches of 20 (5 origins * 20 dests = 100 cells)

    const BATCH_SIZE = 20; // 5 origins * 20 destinations = 100 cells
    const results = {};

    // Initialize results structure
    origins.forEach(origin => {
        results[origin.id] = {};
    });

    // Split destinations into batches
    for (let i = 0; i < destinations.length; i += BATCH_SIZE) {
        const destBatch = destinations.slice(i, i + BATCH_SIZE);

        console.log(`Fetching traffic matrix batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(destinations.length / BATCH_SIZE)} (${destBatch.length} destinations)...`);

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
                const errText = await response.text();
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


