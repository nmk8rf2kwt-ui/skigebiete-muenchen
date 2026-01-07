import { garmisch } from '../parsers/garmisch.js';
import { zugspitze } from '../parsers/zugspitze.js';

async function verify() {
    console.log("=== Verifying Garmisch/Zugspitze Parsers ===");

    try {
        console.log("\nTesting Garmisch...");
        const resG = await garmisch();
        console.log(`✅ Garmisch: Live`);
        console.log(`   Lifts: ${resG.liftsOpen}/${resG.liftsTotal}`);
        console.log(`   Detailed Lifts: ${resG.lifts?.length}`);
        console.log(`   Detailed Slopes: ${resG.slopes?.length}`);
        if (resG.lifts?.length > 0) console.log("   Sample Lift:", resG.lifts[0]);

        console.log("\nTesting Zugspitze...");
        const resZ = await zugspitze();
        console.log(`✅ Zugspitze: Live`);
        console.log(`   Lifts: ${resZ.liftsOpen}/${resZ.liftsTotal}`);
        console.log(`   Detailed Lifts: ${resZ.lifts?.length}`);
        console.log(`   Detailed Slopes: ${resZ.slopes?.length}`);
        if (resZ.lifts?.length > 0) console.log("   Sample Lift:", resZ.lifts[0]);
    } catch (e) {
        console.error("FAILED:", e);
    }
}

verify();
