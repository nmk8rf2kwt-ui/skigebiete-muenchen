
import { parse as parseKronplatz } from '../backend/parsers/kronplatz.js';
import { parse as parseSaalbach } from '../backend/parsers/saalbach.js';
import { parse as parseNassfeld } from '../backend/parsers/nassfeld.js';

async function testParsers() {
    console.log("🚀 Testing Intermaps Parsers...");
    
    // Test Saalbach
    try {
        console.log("\nTesting Saalbach...");
        const start = Date.now();
        const data = await parseSaalbach();
        console.log(`✅ Saalbach Success (${Date.now() - start}ms):`, data.liftsOpen + "/" + data.liftsTotal);
    } catch (e) {
        console.error("❌ Saalbach Failed:", e.message);
    }

    // Test Kronplatz
    try {
        console.log("\nTesting Kronplatz...");
        const start = Date.now();
        const data = await parseKronplatz();
        console.log(`✅ Kronplatz Success (${Date.now() - start}ms):`, data.liftsOpen + "/" + data.liftsTotal);
    } catch (e) {
        console.error("❌ Kronplatz Failed:", e.message);
    }

    // Test Nassfeld
    try {
        console.log("\nTesting Nassfeld...");
        const start = Date.now();
        const data = await parseNassfeld();
        console.log(`✅ Nassfeld Success (${Date.now() - start}ms):`, data.liftsOpen + "/" + data.liftsTotal);
    } catch (e) {
        console.error("❌ Nassfeld Failed:", e.message);
    }
}

testParsers();
