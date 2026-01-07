import { fetchWithHeaders } from '../utils/fetcher.js';

const candidates = [
    { id: "ehrwald", url: "https://sdds4.intermaps.com/zugspitzarena/detail_ehrwald.aspx" },
    { id: "lermoos", url: "https://sdds4.intermaps.com/zugspitzarena/detail_lermoos.aspx" },
    { id: "kitzbuehel", url: "https://sdds4.intermaps.com/kitzbuehel/detail.aspx" }, // Guess
    { id: "kitzbuehel_2", url: "https://sdds4.intermaps.com/kitzski/detail.aspx" }, // Guess
    { id: "skiwelt", url: "https://sdds4.intermaps.com/skiwelt/detail.aspx" }, // Guess
    { id: "steinplatte", url: "https://sdds4.intermaps.com/steinplatte/detail.aspx" }, // Guess
    { id: "st_johann", url: "https://sdds4.intermaps.com/stjohann/detail.aspx" } // Guess
];

async function check() {
    console.log("Checking Intermaps candidates...");
    for (const c of candidates) {
        try {
            const res = await fetchWithHeaders(c.url);
            if (res.ok) {
                const html = await res.text();
                // Check if it looks like the standard Intermaps detail page (has .row.infra)
                if (html.includes("row infra") || html.includes("row service")) {
                    console.log(`✅ MATCH: ${c.id} -> ${c.url}`);
                } else {
                    console.log(`❓ Exists but weird content: ${c.id} -> ${c.url}`);
                }
            } else {
                console.log(`❌ Failed: ${c.id}`);
            }
        } catch (e) {
            console.log(`❌ Error ${c.id}: ${e.message}`);
        }
    }
}

check();
