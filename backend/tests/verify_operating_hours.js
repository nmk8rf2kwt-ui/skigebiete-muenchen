import { zugspitze } from '../parsers/zugspitze.js';
import { garmisch } from '../parsers/garmisch.js';
import { parse as kitzbuehel } from '../parsers/kitzbuehel.js';
import { parse as wilderKaiser } from '../parsers/wilder-kaiser.js';

async function verify() {
    console.log("=== Verifying Operating Hours Implementation ===\n");

    const parsers = [
        { name: 'Zugspitze', fn: zugspitze },
        { name: 'Garmisch-Classic', fn: garmisch },
        { name: 'Kitzbühel', fn: kitzbuehel },
        { name: 'Wilder Kaiser', fn: wilderKaiser }
    ];

    for (const p of parsers) {
        console.log(`\n${p.name}:`);
        try {
            const result = await p.fn();

            // Check lifts
            if (result.lifts && result.lifts.length > 0) {
                const sample = result.lifts[0];
                console.log(`  ✅ ${result.lifts.length} lifts`);
                console.log(`     Sample: ${sample.name}`);
                if (sample.operatingHours) {
                    console.log(`     Operating Hours: ${sample.operatingHours}`);
                }
                if (sample.seasonStart && sample.seasonEnd) {
                    console.log(`     Season: ${sample.seasonStart} to ${sample.seasonEnd}`);
                }
                if (!sample.operatingHours && !sample.seasonStart) {
                    console.log(`     ⚠️  No operating hours/season data`);
                }
            }

            // Check slopes
            if (result.slopes && result.slopes.length > 0) {
                const sample = result.slopes[0];
                console.log(`  ✅ ${result.slopes.length} slopes`);
                if (sample.operatingHours || sample.seasonStart) {
                    console.log(`     Sample has time data: ${!!sample.operatingHours}`);
                }
            }
        } catch (error) {
            console.error(`  ❌ Failed: ${error.message}`);
        }
    }
}

verify();
