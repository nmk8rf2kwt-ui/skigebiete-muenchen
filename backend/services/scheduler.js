import { getStaticResorts } from "./resortManager.js";
import { getWeatherForecast, getCurrentConditions } from "../weather.js";
import { weatherCache, parserCache } from "../cache.js"; // Needed for snapshotting
import { PARSERS } from "../parsers/index.js";
import { saveSnapshot, cleanup as cleanupHistory, saveTrafficLog } from "../history.js";
import { fetchTravelTimes } from "./traffic.js";
import { trafficCache } from "../cache.js";

// -- JOBS --

// 1. Refresh Weather (Hourly)
export async function refreshWeather() {
    console.log("Refreshing weather data...");
    const resorts = getStaticResorts();
    for (const resort of resorts) {
        if (resort.latitude && resort.longitude) {
            try {
                const forecast = await getWeatherForecast(resort.latitude, resort.longitude);
                if (forecast) {
                    const current = getCurrentConditions(forecast);
                    weatherCache.set(resort.id, { forecast, current, timestamp: Date.now() });
                }
            } catch (err) {
                console.error(`Failed to fetch weather for ${resort.id}:`, err);
            }
        }
    }
    console.log("Weather refresh complete.");
}

// 2. Daily Snapshots (Midnight)
export async function saveDailySnapshots() {
    console.log("📸 Saving daily snapshots...");
    const resorts = getStaticResorts();

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

                // Inject static price data for history tracking
                data = {
                    ...data,
                    price: resort.price,
                    priceDetail: resort.priceDetail
                };

                saveSnapshot(resort.id, data);
                console.log(`  ✓ Saved snapshot for ${resort.id}`);
            } catch (error) {
                console.error(`  ✗ Failed to save snapshot for ${resort.id}:`, error.message);
            }
        }
    }
    console.log("📸 Daily snapshots complete");
}

// 3. Refresh Traffic (Hourly)
export async function refreshTraffic() {
    console.log("🚦 Refreshing traffic data...");
    const resorts = getStaticResorts();
    const destinations = resorts.filter(r => r.latitude && r.longitude);

    const trafficData = await fetchTravelTimes(destinations);

    if (trafficData) {
        // Update cache
        for (const [id, data] of Object.entries(trafficData)) {
            trafficCache.set(id, data);
        }
        console.log(`✅ Updated traffic for ${Object.keys(trafficData).length} resorts.`);

        // Log to history if within 06:00 - 22:00
        const now = new Date();
        const hour = now.getHours();

        if (hour >= 6 && hour < 22) {
            console.log("📝 Logging traffic history...");
            for (const resort of resorts) {
                // Determine Standard Time (from static distance)
                // Note: resort.distance is in minutes (e.g. 60) in resorts.json
                const standard = resort.distance || 0;

                // Determine Current Time (from traffic fetch)
                const traffficInfo = trafficData[resort.id];

                if (traffficInfo && traffficInfo.duration) {
                    saveTrafficLog(resort.id, standard, traffficInfo.duration);
                }
            }
        }
    }
}

// -- SCHEDULER --

let lastSnapshotDate = null;

export function initScheduler() {
    console.log("⏰ Scheduler initialized");

    // A. Weather Loop (1 hour)
    setInterval(refreshWeather, 60 * 60 * 1000);

    // B. Traffic Loop (1 hour) -- Staggered by 5 mins from weather to spread load
    setTimeout(() => {
        // Periodic
        setInterval(refreshTraffic, 60 * 60 * 1000);
        // Immediate
        refreshTraffic();
    }, 5000);

    // Initial fetch for weather
    setTimeout(refreshWeather, 2000);

    // C. Snapshot Loop (Check every hour)
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

    // D. History Cleanup (Daily)
    setInterval(cleanupHistory, 24 * 60 * 60 * 1000);
}
