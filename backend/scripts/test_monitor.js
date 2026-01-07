import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set Env BEFORE import
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_FILE = path.join(__dirname, 'test_usage.json');

process.env.USAGE_DB_PATH = TEST_FILE;

// Dynamically import to ensure env var is picked up
const { trackApiUsage } = await import('../services/usageTracker.js');

console.log("🧪 Starting Monitoring Test...");
console.log(`📂 Using temporary DB: ${TEST_FILE}`);

// Cleanup
if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);

// Simulate Requests
const LIMIT = 2500;
const WARNING = 2000;

console.log("🚀 Simulating 1999 requests...");
for (let i = 0; i < 1999; i++) {
    trackApiUsage('test');
}
console.log("✅ Done. Next request should trigger 80% WARNING:");

// Trigger Warning
trackApiUsage('test'); // 2000

console.log("🚀 Simulating 499 more requests...");
for (let i = 0; i < 499; i++) {
    trackApiUsage('test');
}

console.log("✅ Done. Next request should trigger 100% CRITICAL:");

// Trigger Critical
trackApiUsage('test'); // 2500

// Clean up
console.log("🧹 Cleaning up...");
if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
console.log("🏁 Test finished.");
