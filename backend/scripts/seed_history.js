
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_DIR = path.join(__dirname, '../data/history');
const RESORTS_FILE = path.join(__dirname, '../resorts.json');

// Ensure history dir exists
if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

const resorts = JSON.parse(fs.readFileSync(RESORTS_FILE, 'utf8'));

// Generate 7 days of dummy history
const today = new Date();

resorts.forEach(resort => {
    const resortDir = path.join(HISTORY_DIR, resort.id);
    if (!fs.existsSync(resortDir)) {
        fs.mkdirSync(resortDir, { recursive: true });
    }

    console.log(`Seeding history for ${resort.id}...`);

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const file = path.join(resortDir, `${dateStr}.json`);

        // Skip if exists
        if (fs.existsSync(file)) continue;

        const liftsTotal = resort.lifts || 10;
        const liftsOpen = Math.floor(Math.random() * liftsTotal);
        const snow = Math.floor(Math.random() * 100) + 20;

        const data = {
            resortId: resort.id,
            date: dateStr,
            timestamp: date.toISOString(),
            data: {
                liftsOpen,
                liftsTotal,
                snow: `${snow} cm`,
                weather: ['Sonne', 'Wolken', 'Schnee'][Math.floor(Math.random() * 3)]
            }
        };

        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    }
});

console.log("History seeding complete.");
