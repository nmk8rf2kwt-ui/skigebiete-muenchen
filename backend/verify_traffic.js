import { trafficCache } from './services/cache.js';
import { getAllResortsLive } from './services/resorts/service.js';

// Mock DB connection to avoid timeout/errors if possible, 
// but getAllResortsLive uses getStaticResorts which loads from JSON.

console.log("🛠️ Starting logic verification...");

// 1. Inject Mock History into Cache
trafficCache.set('spitzingsee', {
    duration: 3600,
    delay: 0,
    trafficHistory: [
        { duration: 3300, delay: 0 },
        { duration: 3400, delay: 0 },
        { duration: 3500, delay: 0 }, // Avg ~3500 (58 min)
        { duration: 3600, delay: 0 },
        { duration: 3700, delay: 0 },
        { duration: 3800, delay: 0 },
        { duration: 4000, delay: 0 }
    ]
});

// 2. Fetch Data via Service
const data = await getAllResortsLive();
const resort = data.find(r => r.id === 'spitzingsee');

console.log(`Resort Traffic Data for ${resort.id}:`, JSON.stringify(resort.traffic, null, 2));

if (resort.traffic.historyStats) {
    console.log("✅ historyStats present!");
    console.log("Stats:", resort.traffic.historyStats);
} else {
    console.log("❌ historyStats missing.");
}

process.exit(0);
