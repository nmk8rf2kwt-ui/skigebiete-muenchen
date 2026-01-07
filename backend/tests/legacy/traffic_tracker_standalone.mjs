import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchTrafficMatrix } from '../backend/services/tomtom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESORTS_PATH = path.join(__dirname, '../backend/resorts.json');
const DATA_DIR = path.join(__dirname, '../backend/data/traffic');

// Reference Cities
const CITIES = [
    { id: 'munich', latitude: 48.1351, longitude: 11.5820 },
    { id: 'augsburg', latitude: 48.3705, longitude: 10.8978 },
    { id: 'salzburg', latitude: 47.8095, longitude: 13.0550 }
];

async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function loadResorts() {
    const data = await fs.readFile(RESORTS_PATH, 'utf-8');
    const resorts = JSON.parse(data);
    // Filter resorts with valid coordinates
    return resorts.filter(r => r.latitude && r.longitude).map(r => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude
    }));
}

async function appendToCsv(cityId, results) {
    const filePath = path.join(DATA_DIR, `traffic_${cityId}.csv`);
    const timestamp = new Date().toISOString();
    
    // Check if file exists to write header
    let fileExists = false;
    try {
        await fs.access(filePath);
        fileExists = true;
    } catch {}

    let content = '';
    if (!fileExists) {
        content += 'Timestamp,ResortId,DurationMin,DelayMin\n';
    }

    // Results is object { resortId: { duration, delay } }
    Object.entries(results).forEach(([resortId, data]) => {
        if (data) {
            content += `${timestamp},${resortId},${data.duration},${data.delay}\n`;
        }
    });

    await fs.appendFile(filePath, content, 'utf-8');
    console.log(`Updated ${filePath} with ${Object.keys(results).length} entries`);
}

async function main() {
    try {
        console.log(`[${new Date().toISOString()}] Starting Traffic Tracker...`);
        
        await ensureDir(DATA_DIR);
        const resorts = await loadResorts();
        
        console.log(`Fetching traffic for ${CITIES.length} cities to ${resorts.length} resorts...`);
        
        const matrix = await fetchTrafficMatrix(CITIES, resorts);
        
        if (!matrix) {
            console.error("Failed to fetch traffic matrix");
            process.exit(1);
        }

        // Process results per city
        for (const city of CITIES) {
            const cityResults = matrix[city.id];
            if (cityResults) {
                await appendToCsv(city.id, cityResults);
            }
        }

        console.log("Traffic tracking completed successfully.");

    } catch (error) {
        console.error("Traffic Tracker Error:", error);
        process.exit(1);
    }
}

main();
