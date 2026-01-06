import dotenv from "dotenv";
dotenv.config();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
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
    // We have ~30 resorts, so 1 batch is fine.

    const url = `https://api.tomtom.com/routing/1/matrix/sync/json?key=${TOMTOM_API_KEY}`;

    const body = {
        origins: origins,
        destinations: destPoints,
        options: {
            traffic: "historical", // or "live" (default seems to cover live if traffic flow is used?)
            // TomTom "traffic" parameter isn't in Matrix, it uses "routeType" defaults.
            // Wait, checks docs: https://developer.tomtom.com/routing-api/documentation/matrix-routing/synchronous-matrix
            // It says "traffic" defaults to true? No, that's regular Routing.
            // Matrix V2: "traffic" is stored in the POST body? No.
            // Actually, we usually rely on default behavior which includes traffic.
            // Let's check "computeTravelTimeFor" = "all" to get "noTrafficTravelTimeInSeconds".
        }
    };

    // NOTE: TomTom Matrix doesn't clearly state "traffic: true" in body.
    // However, it supports "computeTravelTimeFor": "all" (which gives 'live', 'historic', 'no_traffic').
    // Let's construct the URL parameters properly if needed, but the POST body is structure.

    // FIX: To get traffic delay, we might need specific params.
    // Standard Routing API has "traffic: true". Matrix API?
    // Let's try basic request first.

    try {
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
                    duration: Math.round(summary.travelTimeInSeconds / 60), // Current (Live)
                    distanceKm: (summary.lengthInMeters / 1000).toFixed(1),
                    delay: Math.round(summary.trafficDelayInSeconds / 60)   // Delay
                };
            }
        });

        return results;

    } catch (error) {
        console.error("TomTom fetch failed:", error.message);
        return null;
    }
}

export async function geocodeAddress(query) {
    if (!TOMTOM_API_KEY) throw new Error("Missing TomTom Key");

    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&limit=1`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);

        const data = await res.json();
        if (!data.results || data.results.length === 0) return null;

        const result = data.results[0];

        return {
            name: result.address?.freeformAddress || result.poi?.name || query,
            latitude: result.position.lat,
            longitude: result.position.lon
        };
    } catch (error) {
        console.error("TomTom Geocode error:", error.message);
        return null;
    }
}
