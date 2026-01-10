
import { PARSERS } from "../parsers/index.js";

const target = process.argv[2];

if (!target) {
    console.log("Usage: node debug_parsers.js <parser_name> OR node debug_parsers.js check-all");
    console.log("Available parsers:", Object.keys(PARSERS).join(", "));
    process.exit(1);
}

if (target === "check-all") {
    runAllParsers();
} else {
    runParser(target);
}

async function runParser(name) {
    const parser = PARSERS[name];
    if (!parser) {
        console.error(`Parser '${name}' not found.`);
        process.exit(1);
    }

    console.log(`Running parser: ${name}...`);
    try {
        const data = await parser();
        console.log("✅ Success:");
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("❌ Error:");
        console.error(err);
    }
}

async function runAllParsers() {
    console.log("Running QA check for ALL parsers...");
    console.log("===================================");

    let success = 0;
    let fail = 0;
    const failedParsers = [];

    const entries = Object.entries(PARSERS);

    for (const [name, parser] of entries) {
        process.stdout.write(`Testing ${name.padEnd(20)} ... `);
        try {
            // limit timeout to 10s per parser to avoid hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 10000)
            );

            await Promise.race([parser(), timeoutPromise]);

            console.log("✅ OK");
            success++;
        } catch (err) {
            console.log("❌ FAIL");
            console.error(`   -> ${err.message}`);
            fail++;
            failedParsers.push(name);
        }
    }

    console.log("===================================");
    console.log(`Summary: ${success} Passed, ${fail} Failed`);
    if (fail > 0) {
        console.log("Failed Parsers:", failedParsers.join(", "));
        process.exit(1);
    } else {
        process.exit(0);
    }
}
