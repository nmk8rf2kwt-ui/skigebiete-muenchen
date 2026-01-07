import { parse as kitzbuehel } from '../parsers/kitzbuehel.js';
import { parse as wilder_kaiser } from '../parsers/wilder-kaiser.js';

async function verify() {
    console.log("=== Verifying Micado Resorts ===");

    const parsers = [
        { name: 'Kitzbühel', fn: kitzbuehel },
        { name: 'Wilder Kaiser', fn: wilder_kaiser }
    ];

    for (const p of parsers) {
        console.log(`\nTesting ${p.name}...`);
        try {
            const result = await p.fn();
            console.log(`✅ ${p.name}: Live`);
            console.log(`   Lifts: ${result.liftsOpen}/${result.liftsTotal}`);
            console.log(`   Detailed Lifts: ${result.lifts?.length}`);
            console.log(`   Detailed Slopes: ${result.slopes?.length}`);
            if (result.lifts?.length > 0) console.log("   Sample Lift:", result.lifts[0]);
            if (result.slopes?.length > 0) console.log("   Sample Slope:", result.slopes[0]);
        } catch (error) {
            console.error(`❌ ${p.name} Failed: ${error.message}`);
        }
    }
}

verify();
