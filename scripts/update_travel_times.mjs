import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchTravelTimes } from '../backend/services/traffic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESORTS_PATH = path.join(__dirname, '../backend/resorts.json');

async function main() {
    try {
        console.log("Loading resorts...");
        const resortsData = await fs.readFile(RESORTS_PATH, 'utf-8');
        const resorts = JSON.parse(resortsData);

        const destinations = resorts.map(r => ({
            id: r.id,
            latitude: r.latitude,
            longitude: r.longitude
        }));

        console.log(`Fetching travel times for ${destinations.length} resorts...`);
        const travelTimes = await fetchTravelTimes(destinations);

        if (!travelTimes) {
            console.error("Failed to fetch travel times.");
            process.exit(1);
        }

        let updatedCount = 0;
        const updatedResorts = resorts.map(resort => {
            const trafficData = travelTimes[resort.id];
            if (trafficData && trafficData.duration) {
                // Only update if difference is significant (> 2 mins) to avoid noise
                // Or just update always to be precise. Let's update always to strictly match ORS.
                if (resort.distance !== trafficData.duration) {
                    console.log(`Updating ${resort.name}: ${resort.distance} min -> ${trafficData.duration} min`);
                    resort.distance = trafficData.duration;
                    updatedCount++;
                }
            } else {
                console.warn(`No travel time found for ${resort.name} (${resort.id})`);
            }
            return resort;
        });

        if (updatedCount > 0) {
            console.log(`Saving ${updatedCount} updates to resorts.json...`);
            await fs.writeFile(RESORTS_PATH, JSON.stringify(updatedResorts, null, 4), 'utf-8');
            console.log("Done.");
        } else {
            console.log("No updates needed. All times match.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
