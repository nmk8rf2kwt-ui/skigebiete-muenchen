import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchTravelTimes, fetchTrafficMatrix } from '../backend/services/tomtom.js';
import { saveMatrixTrafficLog } from '../backend/services/resorts/archive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESORTS_PATH = path.join(__dirname, '../backend/resorts.json');
const CITIES_PATH = path.join(__dirname, '../backend/data/reference_cities.json');

async function main() {
    try {
        console.log("🚦 Starting Traffic Update script...");

        // 1. Load Data
        const resortsData = await fs.readFile(RESORTS_PATH, 'utf-8');
        const resorts = JSON.parse(resortsData);

        const citiesData = await fs.readFile(CITIES_PATH, 'utf-8');
        const cities = JSON.parse(citiesData);

        const activeResorts = resorts.filter(r => r.latitude && r.longitude);
        console.log(`Processing ${activeResorts.length} resorts from ${cities.length} origin cities...`);

        // 2. Fetch Matrix (Cities x Resorts)
        const trafficMatrix = await fetchTrafficMatrix(cities, activeResorts);

        if (!trafficMatrix) {
            console.error("❌ Failed to fetch traffic matrix.");
            process.exit(1);
        }

        // 3. Persist to Supabase and update local config for Munich distance
        let logCount = 0;
        let configUpdateCount = 0;

        for (const city of cities) {
            const cityData = trafficMatrix[city.id];
            if (!cityData) continue;

            for (const resort of resorts) {
                const data = cityData[resort.id];
                if (data) {
                    // Update Munich-based distance in resorts.json (Legacy compatibility)
                    if (city.id === 'muenchen' && resort.distance !== data.duration) {
                        console.log(`Updating Munich-base for ${resort.name}: ${resort.distance} min -> ${data.duration} min`);
                        resort.distance = data.duration;
                        configUpdateCount++;
                    }

                    // Save to Supabase
                    console.log(`Saving matrix data: ${city.id} -> ${resort.id} (${data.duration}m, ${data.delay}m)`);
                    await saveMatrixTrafficLog(
                        city.id,
                        city.name,
                        resort.id,
                        data.duration,
                        data.delay
                    );
                    logCount++;
                }
            }
        }

        // 4. Save resorts.json if updated
        if (configUpdateCount > 0) {
            console.log(`Saving ${configUpdateCount} updates to resorts.json...`);
            await fs.writeFile(RESORTS_PATH, JSON.stringify(resorts, null, 4), 'utf-8');
        }

        console.log(`✅ Success: Logged ${logCount} entries to Supabase. Updated ${configUpdateCount} local config entries.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Critical Error:", error.message);
        process.exit(1);
    }
}

main();
