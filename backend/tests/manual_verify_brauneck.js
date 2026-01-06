import { fetchWithHeaders } from '../utils/fetcher.js';

const URL = "https://www.brauneck-bergbahn.de/de/lift-pistenstatus.html";

async function verify() {
    console.log("Fetching Brauneck HTML...");
    try {
        const res = await fetchWithHeaders(URL);
        const html = await res.text();

        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let matches;
        const types = new Set();
        const items = [];

        while ((matches = regex.exec(html)) !== null) {
            const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const itemRegex = /"status":(\d+)[^}]*?"title":"([^"]+)"[^}]*?"typename":"([^"]+)"/g;
            let m;
            while ((m = itemRegex.exec(content)) !== null) {
                const type = m[3];
                types.add(type);
                items.push({ status: m[1], name: m[2], type });
            }
        }

        console.log("Unique Typenames found:");
        console.log([...types]);
        console.log(`Total items: ${items.length}`);

    } catch (error) {
        console.error(error);
    }
}

verify();
