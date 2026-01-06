import dotenv from "dotenv";
dotenv.config();

const ORS_API_KEY = process.env.ORS_API_KEY;
const MUNICH_COORDS = [11.5820, 48.1351]; // lon, lat

export async function fetchTravelTimes(destinations) {
    // destinations: [{ id, latitude, longitude }]
    // ORS Matrix expects [[lon, lat], [lon, lat], ...]

    if (!ORS_API_KEY) {
        console.warn("⚠️ ORS_API_KEY not found. Traffic data will be skipped.");
        return null;
    }

    // Prepare coordinates: Index 0 is Origin (Munich)
    const locations = [MUNICH_COORDS];
    const mapIndexToResortId = {};

    destinations.forEach((dest, index) => {
        if (dest.longitude && dest.latitude) {
            locations.push([dest.longitude, dest.latitude]);
            // Matrix result index will be index + 1 (because of origin at 0)
            // Actually, sources=[0], destinations=[1, 2, 3...]
            mapIndexToResortId[index] = dest.id;
        }
    });

    const body = {
        locations: locations,
        metrics: ["duration", "distance"],
        sources: [0], // Munich is index 0
        // all other indices are destinations
        destinations: locations.map((_, i) => i).slice(1)
    };

    try {
        const response = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
            method: 'POST',
            headers: {
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`ORS API Error: ${response.status} ${errText}`);
        }

        const data = await response.json();

        // data.durations[0] is array of durations from source 0 to all destinations
        // data.distances[0] is array of distances

        const results = {};
        const sourceDurations = data.durations[0];
        const sourceDistances = data.distances[0];

        // Map back to resort IDs
        // Note: destinations array in body was slice(1), so it corresponds to locations indices 1..N
        // The API returns arrays corresponding to the `destinations` parameter indices.
        // Wait, ORS Matrix response order depends on `destinations` param.
        // We requested destinations = [1, 2, 3, ... N]
        // So result[0] corresponds to location[1], result[1] to location[2], etc.

        Object.keys(mapIndexToResortId).forEach((destIndexStr, arrayIndex) => {
            const destIndex = parseInt(destIndexStr); // This is the index in `destinations` array passed to function? 
            // No, mapIndexToResortId keys are 0, 1, 2 (index of input array).

            // Let's trace carefully.
            // Input: destinations[0] -> Resort A
            // locations: [Munich, Resort A]
            // destinations param: [1]
            // response.durations[0] -> [ DurationToLocation1 ]

            // So: response.durations[0][i] corresponds to locations[ destinations[i] ]
            // destinations[i] is (i + 1) in our setup.
            // locations[i+1] comes from destinations[i] in input array.

            const durationSeconds = sourceDurations[arrayIndex];
            const distanceMeters = sourceDistances[arrayIndex];
            const resortId = mapIndexToResortId[arrayIndex]; // keys are 0..N-1

            if (resortId) {
                results[resortId] = {
                    duration: Math.round(durationSeconds / 60), // minutes
                    distance: (distanceMeters / 1000).toFixed(1) // km
                };
            }
        });

        return results;

    } catch (error) {
        console.error("Traffic fetch failed:", error.message);
        return null;
    }
}

export async function fetchDynamicTravelTimes(originLat, originLon, destinations) {
    if (!process.env.ORS_API_KEY) throw new Error("Missing ORS Key");

    // Origin is index 0
    const locations = [[originLon, originLat]];
    const mapIndexToResortId = {};

    destinations.forEach((dest, index) => {
        if (dest.longitude && dest.latitude) {
            locations.push([dest.longitude, dest.latitude]);
            mapIndexToResortId[index] = dest.id;
        }
    });

    const body = {
        locations: locations,
        metrics: ["duration", "distance"],
        sources: [0],
        destinations: locations.map((_, i) => i).slice(1)
    };

    const response = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
        method: 'POST',
        headers: {
            'Authorization': process.env.ORS_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();
    const results = {};

    if (!data.durations || !data.durations[0]) return {};

    const sourceDurations = data.durations[0];
    const sourceDistances = data.distances[0];

    Object.keys(mapIndexToResortId).forEach((destIndexStr, arrayIndex) => {
        const durationSeconds = sourceDurations[arrayIndex];
        const distanceMeters = sourceDistances[arrayIndex];
        const resortId = mapIndexToResortId[arrayIndex];

        if (resortId && durationSeconds !== null) {
            results[resortId] = {
                duration: Math.round(durationSeconds / 60), // minutes
                distance: (distanceMeters / 1000).toFixed(1) // km
            };
        }
    });

    return results;
}

export async function geocodeAddress(query) {
    if (!process.env.ORS_API_KEY) throw new Error("Missing ORS Key");

    const url = `https://api.openrouteservice.org/geocode/search?api_key=${process.env.ORS_API_KEY}&text=${encodeURIComponent(query)}&size=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocode failed");

    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const feat = data.features[0];
    return {
        name: feat.properties.label,
        longitude: feat.geometry.coordinates[0],
        latitude: feat.geometry.coordinates[1]
    };
}
