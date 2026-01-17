
import { PARSERS } from '../backend/parsers/index.js';
import { fetchWithHeaders } from '../backend/utils/fetcher.js';

const RESORTS_TO_TEST = ['nassfeld', 'kronplatz', 'saalbach', 'sella_ronda', 'kitzsteinhorn', 'hochzillertal'];

async function testResort(id) {
    console.log(`\n🔍 Testing ${id}...`);
    const parser = PARSERS[id];
    if (!parser) {
        console.error(`❌ No parser found for ${id}`);
        return;
    }

    try {
        const result = await parser();
        console.log(`✅ Success for ${id}:`);
        console.log(JSON.stringify(result, null, 2));

        // Basic Validation Check logic (mimicking service.js)
        if (!result.name) console.error("⚠️  Validation Warning: Missing 'name'");
        if (result.liftsOpen === undefined) console.error("⚠️  Validation Warning: Missing 'liftsOpen'");
        if (result.liftsTotal === undefined) console.error("⚠️  Validation Warning: Missing 'liftsTotal'");

    } catch (error) {
        console.error(`❌ Failed for ${id}:`, error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
        }
    }
}

async function run() {
    for (const id of RESORTS_TO_TEST) {
        await testResort(id);
    }
}

run();
