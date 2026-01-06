import { parse } from '../parsers/sudelfeld.js';
import { ResortDataSchema } from '../schema.js';

async function verify() {
    console.log("Running Sudelfeld parser verification...");
    try {
        const result = await parse();
        console.log("Parser Result:", JSON.stringify(result, null, 2));

        const validation = ResortDataSchema.safeParse(result);
        if (validation.success) {
            console.log("✅ Schema Validation Passed");
            if (result.lifts && result.lifts.length > 0) {
                console.log(`✅ Extracted ${result.lifts.length} lifts.`);
            } else {
                console.error("❌ No detailed lifts extracted.");
            }
            if (result.slopes && result.slopes.length > 0) {
                console.log(`✅ Extracted ${result.slopes.length} slopes.`);
            } else {
                console.log("ℹ️ No detailed slopes extracted (check if expected).");
            }
        } else {
            console.error("❌ Schema Validation Failed:", validation.error.format());
        }

    } catch (error) {
        console.error("❌ Parser Execution Failed:", error);
    }
}

verify();
