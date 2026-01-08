import { fetchTravelTimes } from '../services/tomtom.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

// Load env from backend/.env
dotenv.config({ path: path.join(backendDir, '.env') });

const resortsPath = path.join(backendDir, 'resorts.json');
const resortsRaw = JSON.parse(fs.readFileSync(resortsPath, 'utf8'));

// Stuttgart coordinates
const origin = { lat: 48.7758, lon: 9.1829 };

console.log("TOMTOM_KEY present:", !!process.env.TOMTOM_API_KEY);

async function run() {
    console.log(`Testing routing from Stuttgart for ${resortsRaw.length} resorts...`);

    // Filter like the real backend
    const destinations = resortsRaw.filter(r => r.latitude && r.longitude);
    console.log(`Valid destinations: ${destinations.length}`);

    try {
        const results = await fetchTravelTimes(destinations, origin);

        const ids = Object.keys(results);
        console.log(`Received results for ${ids.length} resorts.`);

        const missing = destinations.filter(d => !results[d.id]);
        if (missing.length > 0) {
            console.log("Missing resorts:");
            missing.forEach(m => console.log(`- ${m.id} (${m.name})`));
        } else {
            console.log("All resorts returned data.");
        }

        // Check sample
        if (ids.length > 0) {
            console.log("Sample result (Zugspitze):", results['zugspitze']);
        }
    } catch (e) {
        console.error("Run failed:", e);
    }
}

run();
