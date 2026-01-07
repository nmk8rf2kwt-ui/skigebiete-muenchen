import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resorts = JSON.parse(fs.readFileSync(path.join(__dirname, 'resorts.json'), 'utf8'));

// Error IDs (from previous checks)
const errorIds = ['steinplatte', 'skijuwel', 'kitzbuehel', 'hahnenkamm', 'lofer', 'bolsterlang', 'winterberg', 'feldberg', 'todtnauberg', 'fichtelberg'];

// Identify targets: those with errors OR those missing a webcam
const targets = resorts.filter(r =>
    errorIds.includes(r.id) ||
    !r.webcam ||
    r.webcam === ""
);

console.log(`Targeting ${targets.length} resorts...`);

// Common webcam paths to probe
const paths = [
    '/webcams', '/webcam', '/wetter-webcams', '/wetter/webcams',
    '/service/webcams', '/de/webcams', '/de/service/webcams',
    '/de/service-info/webcams', '/aktuelles/webcams', '/info/webcams',
    '/livecams', '/de/livecams', '/webcams.html', '/webcam.html',
    '/de/winter/webcams', '/service/wetter-webcams', '/de/webcams.html',
    '/webcams.php', '/webcam.php', '/service/webcam',
    '/lifte-pisten/webcams', '/webcams-wetter', '/bergwetter-webcams',
    '/service-info/wetter-webcams', '/info-service/webcams'
];

async function checkUrl(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        // Use GET to be robust, usually fast enough for probing
        const res = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
        });
        clearTimeout(timeout);
        if (res.ok) {
            return res.url;
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function probe() {
    let foundCount = 0;
    for (const resort of targets) {
        process.stdout.write(`Scanning ${resort.name}... `);

        let base = resort.website;
        if (!base) {
            console.log(`❌ SKIP: ${resort.id} (no website)`);
            continue;
        }

        // Use origin to avoid deep link issues (e.g. skijuwel.com/de/winter/...)
        try {
            base = new URL(resort.website).origin;
        } catch (e) {
            // fallback if invalid URL
        }

        let found = null;
        for (const p of paths) {
            const url = `${base}${p}`;
            const finalUrl = await checkUrl(url);
            if (finalUrl) {
                found = finalUrl;
                break;
            }
        }

        if (found) {
            console.log(`✅ FOUND: ${resort.id} -> ${found}`);
            foundCount++;
        } else {
            console.log(`❌ FAILED: ${resort.id} (${base})`);
        }

        // Small delay
        await new Promise(r => setTimeout(r, 200));
    }
    console.log(`\nProbe complete. Found URLs for ${foundCount} resorts.`);
}

probe();
