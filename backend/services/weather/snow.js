
/**
 * Transforms cached weather data (from Open-Meteo) into the standardized Snow Object.
 * 
 * Target Structure:
 * {
 *   valley: number | null,
 *   mountain: number | null,
 *   lastSnowfall: string | null, // YYYY-MM-DD
 *   source: "api",
 *   timestamp: string // ISO
 * }
 */
export function getFallbackSnow(weatherData) {
    if (!weatherData || !weatherData.current) return null;

    // weatherData.current.snow is currently a string like "15 cm" or "0 cm"
    // We need to parse it back to a number.
    const snowDepthStr = weatherData.current.snow || "";
    const match = snowDepthStr.match(/(\d+)/);
    const snowDepth = match ? parseInt(match[0], 10) : null;

    // Use forecast for lastSnowfall
    let lastSnowfall = null;
    if (weatherData.forecast && weatherData.forecast.lastSnowfall) {
        lastSnowfall = weatherData.forecast.lastSnowfall;
    }

    if (snowDepth === null && lastSnowfall === null) return null;

    return {
        valley: snowDepth, // Open-Meteo gives one value, we assume valley/base for safety or just general depth
        mountain: null,     // Distinct mountain data not available via this simple fallback yet
        lastSnowfall: lastSnowfall,
        source: "api",
        timestamp: new Date().toISOString()
    };
}
