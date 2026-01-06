import { brauneck } from '../parsers/brauneck.js';
import { fetchWithHeaders } from '../utils/fetcher.js';

const URL = "https://www.brauneck-bergbahn.de/de/lift-pistenstatus.html";

async function verify() {
    console.log("Fetching Brauneck HTML...");
    try {
        const res = await fetchWithHeaders(URL);
        const html = await res.text();

        // Debug the regex matches
        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let matches;
        let found = false;

        console.log("Searching for lift data in hydration blobs...");

        while ((matches = regex.exec(html)) !== null) {
            const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

            // Look for a sample lift to see structure
            if (content.includes("Flori-Hang")) { // Known lift/slope? Or just look for "typename"
                console.log("Found blob with likely lift data!");
                console.log(content.substring(content.indexOf("Flori-Hang") - 100, content.indexOf("Flori-Hang") + 200));
                found = true;
            }

            // Or just search for the pattern used in parser
            const liftRegex = /"id":\d+,"identifier":"([A-Z0-9 .-]+)".*?"status":(\d+).*?"typename":"([^"]+)"/g;
            let m;
            let count = 0;
            while ((m = liftRegex.exec(content)) !== null) {
                if (count < 3) {
                    console.log(`Match: Name='${m[1]}', Status=${m[2]}, Type='${m[3]}'`);
                }
                count++;
            }
            if (count > 0) console.log(`Total matches in this blob: ${count}`);
        }

    } catch (error) {
        console.error(error);
    }
}

verify();
