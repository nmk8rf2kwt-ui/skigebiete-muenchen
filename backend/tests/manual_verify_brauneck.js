import { fetchWithHeaders } from '../utils/fetcher.js';

const URL = "https://www.brauneck-bergbahn.de/de/lift-pistenstatus.html";

async function verify() {
    console.log("Fetching Brauneck HTML...");
    try {
        const res = await fetchWithHeaders(URL);
        const html = await res.text();

        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let matches;

        const items = [];

        while ((matches = regex.exec(html)) !== null) {
            const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

            // Regex to find objects with title and status
            // We look for the pattern: "status":X ... "title":"Y" (or vice versa)
            // But we can't guarantee order.
            // Split by "},{" to get objects roughly? 
            // The string is likely `[{obj},{obj},...]` somewhere.

            // Heuristic: Split by `{"` which usually starts a new object/property.
            // Better: regex for the specific block.
            // based on snippet: `,"status":1,"title":"D Ahorn-4er-Sesselbahn","type":"chairlift4","typename":"4er Sesselbahn"}`

            // Let's try to match the whole block containing status and title.
            // Since they are comma separated properties.
            const itemRegex = /"status":(\d+)[^}]*?"title":"([^"]+)"[^}]*?"typename":"([^"]+)"/g;

            let m;
            while ((m = itemRegex.exec(content)) !== null) {
                items.push({
                    status: parseInt(m[1]),
                    name: m[2],
                    type: m[3]
                });
            }
            // Try reverse order of properties just in case
            const itemRegex2 = /"title":"([^"]+)"[^}]*?"status":(\d+)[^}]*?"typename":"([^"]+)"/g;
            while ((m = itemRegex2.exec(content)) !== null) {
                // Check if not already added? 
                // Simple verification script, duplicates are fine for analysis.
                items.push({ status: parseInt(m[2]), name: m[1], type: m[3], source: "regex2" });
            }
        }

        console.log(`Found ${items.length} items.`);
        console.log("Sample items:");
        items.slice(0, 5).forEach(i => console.log(i));

        // Check for slopes (Abfahrt)
        const slopes = items.filter(i => i.name.includes("abfahrt") || i.type.includes("Abfahrt") || i.type.includes("piste"));
        console.log(`Potential slopes: ${slopes.length}`);
        if (slopes.length > 0) console.log(slopes[0]);

    } catch (error) {
        console.error(error);
    }
}

verify();
