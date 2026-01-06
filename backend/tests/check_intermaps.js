import { fetchWithHeaders } from '../utils/fetcher.js';

const urls = [
    "https://sdds4.intermaps.com/alpenplus/detail_brauneck.aspx",
    "https://sdds4.intermaps.com/alpenplus/detail_spitzingsee.aspx",
    "https://sdds4.intermaps.com/alpenplus/detail_wallberg.aspx"
];

async function check() {
    for (const url of urls) {
        try {
            const res = await fetchWithHeaders(url);
            if (res.ok) {
                console.log(`✅ Exists: ${url} (Status: ${res.status})`);
                const html = await res.text();
                // Check if it has content (sometimes it returns 200 with empty body)
                if (html.length > 500) {
                    console.log("   Has content (length > 500)");
                } else {
                    console.log("   Content empty/short?");
                }
            } else {
                console.log(`❌ Failed: ${url} (Status: ${res.status})`);
            }
        } catch (e) {
            console.log(`❌ Error: ${url} - ${e.message}`);
        }
    }
}

check();
