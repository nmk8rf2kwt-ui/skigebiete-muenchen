import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchTravelTimes } from '../services/tomtom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESORTS_FILE = path.join(__dirname, '../resorts.json');

async function updateTraffic() {
    console.log("🚦 Starting Traffic Update Script...");

    try {
        // 1. Load Resorts
        if (!fs.existsSync(RESORTS_FILE)) {
            throw new Error(`Resorts file not found at ${RESORTS_FILE}`);
        }
        const resorts = JSON.parse(fs.readFileSync(RESORTS_FILE, 'utf-8'));
        console.log(`✅ Loaded ${resorts.length} resorts.`);

        // 2. Prepare Destinations
        const destinations = resorts
            .filter(r => r.latitude && r.longitude)
            .map(r => ({
                id: r.id,
                latitude: r.latitude,
                longitude: r.longitude
            }));

        // 3. Fetch Traffic
        console.log(`🌍 Fetching traffic for ${destinations.length} destinations...`);
        const trafficData = await fetchTravelTimes(destinations);

        if (!trafficData) {
            console.error("❌ No traffic data returned.");
            process.exit(1);
        }

        // 4. Update Resorts
        let updateCount = 0;
        const updatedResorts = resorts.map(resort => {
            const traffic = trafficData[resort.id];
            if (traffic) {
                updateCount++;
                return {
                    ...resort,
                    traffic: {
                        ...traffic,
                        lastUpdated: new Date().toISOString()
                    }
                };
            }
            return resort;
        });

        // 5. Save Back to File
        fs.writeFileSync(RESORTS_FILE, JSON.stringify(updatedResorts, null, 2));
        console.log(`✅ Successfully updated traffic for ${updateCount} resorts.`);
        console.log(`💾 Saved to ${RESORTS_FILE}`);

    } catch (error) {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    }
}

updateTraffic();
