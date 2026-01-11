import { PARSERS } from '../parsers/index.js';
import { ResortDataSchema } from '../validation/schemas.js';
import logger from '../services/logger.js';

async function validateAllParsers() {
    console.log("Starting full validation check for all parsers...");
    console.log("===============================================");

    const resortIds = Object.keys(PARSERS);
    let passed = 0;
    let failed = 0;

    for (const id of resortIds) {
        process.stdout.write(`Validating ${id.padEnd(25)} ... `);
        try {
            const parser = PARSERS[id];
            // We pass a dummy options to avoid timeouts if possible, 
            // but use a shorter timeout for the script
            const result = await parser({ timeout: 10000 });

            if (!result) {
                console.log("❌ NULL Result");
                failed++;
                continue;
            }

            const validation = ResortDataSchema.safeParse(result);
            if (validation.success) {
                console.log("✅ OK");
                passed++;
            } else {
                console.log("❌ FAILED Validation");
                console.error(JSON.stringify(validation.error.format(), null, 2));
                failed++;
            }
        } catch (err) {
            console.log(`❌ ERROR: ${err.message}`);
            failed++;
        }
    }

    console.log("===============================================");
    console.log(`Summary: ${passed} Passed, ${failed} Failed`);
    
    if (failed > 0) {
        process.exit(1);
    }
}

validateAllParsers().catch(err => {
    console.error("Fatal validation script error:", err);
    process.exit(1);
});
