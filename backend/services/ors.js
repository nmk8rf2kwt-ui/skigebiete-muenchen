import dotenv from "dotenv";
dotenv.config();
import { statusLogger } from "./statusLogger.js";

const ORS_API_KEY = process.env.ORS_API_KEY;

export async function geocodeAddress(query) {
    if (!ORS_API_KEY) {
        console.warn("⚠️ ORS_API_KEY not found. Geocoding may fail.");
        statusLogger.updateComponentStatus('geocoding', 'degraded');
    }

    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&size=1`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`ORS Geocode failed: ${res.status}`);

        const data = await res.json();
        if (!data.features || data.features.length === 0) {
            statusLogger.log('warn', 'geocoding', `No results found for: ${query}`);
            return null;
        }

        const feat = data.features[0];
        statusLogger.updateComponentStatus('geocoding', 'healthy');
        statusLogger.log('success', 'geocoding', `Geocoded: ${query}`);

        return {
            name: feat.properties.label,
            longitude: feat.geometry.coordinates[0],
            latitude: feat.geometry.coordinates[1]
        };
    } catch (error) {
        console.error("ORS Geocode error:", error.message);
        statusLogger.updateComponentStatus('geocoding', 'degraded');
        statusLogger.log('error', 'geocoding', `Geocoding failed: ${error.message}`);
        return null;
    }
}
