import { parse as ofterschwang } from '../parsers/ofterschwang.js';
import { parse as bolsterlang } from '../parsers/bolsterlang.js';
import { parse as berwang } from '../parsers/berwang.js';

async function verify() {
    console.log("=== Verifying Intermaps JSON Parsers ===\n");

    const parsers = [
        { name: 'Ofterschwang', fn: ofterschwang },
        { name: 'Bolsterlang', fn: bolsterlang },
        { name: 'Berwang', fn: berwang }
    ];

    for (const p of parsers) {
        console.log(`\n${p.name}:`);
        try {
            const result = await p.fn();

            console.log(`  Status: ${result.status}`);
            console.log(`  Lifts: ${result.liftsOpen}/${result.liftsTotal}`);

            if (result.lifts && result.lifts.length > 0) {
                console.log(`  ✅ Detailed lifts: ${result.lifts.length}`);
                console.log(`     Sample: ${result.lifts[0].name} (${result.lifts[0].status})`);
            } else {
                console.log(`  ❌ No detailed lifts`);
            }

            if (result.slopes && result.slopes.length > 0) {
                console.log(`  ✅ Detailed slopes: ${result.slopes.length}`);
                console.log(`     Sample: ${result.slopes[0].name} (${result.slopes[0].status})`);
            } else {
                console.log(`  ❌ No detailed slopes`);
            }
        } catch (error) {
            console.error(`  ❌ Failed: ${error.message}`);
        }
    }
}

verify();
