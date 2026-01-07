import { brauneck } from '../parsers/brauneck.js';
import { spitzingsee } from '../parsers/spitzingsee.js';
import { parse as sudelfeld } from '../parsers/sudelfeld.js';

async function verify() {
    console.log("=== Verifying AlpenPlus Resorts ===");

    const parsers = [
        { name: 'Sudelfeld', fn: sudelfeld },
        { name: 'Brauneck', fn: brauneck },
        { name: 'Spitzingsee', fn: spitzingsee }
    ];

    for (const p of parsers) {
        console.log(`\nTesting ${p.name}...`);
        try {
            const result = await p.fn();
            console.log(`✅ ${p.name}: Live`);
            console.log(`   Lifts: ${result.liftsOpen}/${result.liftsTotal}`);
            if (result.lifts) console.log(`   Detailed Lifts: ${result.lifts.length}`);
            else console.log(`   ❌ Detailed Lifts missing`);
            if (result.slopes) console.log(`   Detailed Slopes: ${result.slopes.length}`);
            else console.log(`   ❌ Detailed Slopes missing`);
        } catch (error) {
            console.error(`❌ ${p.name} Failed: ${error.message}`);
        }
    }
}

verify();
