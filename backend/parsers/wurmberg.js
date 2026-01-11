import { load } from "cheerio";
import { createResult } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";

export const details = {
    id: "wurmberg",
    name: "Wurmberg - Braunlage",
    url: "https://www.wurmberg-seilbahn.de/winter/skigebiet/aktuelles/",
    district: "Harz",
};

export async function parse(options = {}) {
    const url = details.url;
    const res = await fetchWithHeaders(url, options);

    if (!res.ok) {
        throw new Error(`Failed to fetch Wurmberg: ${res.status}`);
    }

    const html = await res.text();
    const $ = load(html);
    const lifts = [];

    // Find the "Übersicht Lifte" heading and get the table following it
    // The HTML structure is h3 -> div.ce_table -> table
    // We can look for the H3 containing "Übersicht Lifte"
    const liftTable = $("h3:contains('Übersicht Lifte')").next(".ce_table").find("table.simple-table");

    if (liftTable.length === 0) {
        console.warn("Wurmberg: Lift table not found");
        // Fallback or just return empty?
        // Let's inspect if there is another structure if this fails, but based on source it should work.
    }

    liftTable.find("tr").each((i, row) => {
        // Skip header row
        if (i === 0) return;

        const cols = $(row).find("td");
        if (cols.length < 3) return;

        const name = $(cols[0]).text().trim();
        const typeRaw = $(cols[1]).text().trim();
        const statusRaw = $(cols[2]).text().trim().toLowerCase();

        let status = "unknown";
        if (statusRaw.includes("offen")) {
            status = "open";
        } else if (statusRaw.includes("geschlossen") || statusRaw.includes("gesperrt")) {
            status = "closed";
        }

        // Map type if possible, or just use raw for now (parserUtils doesn't enforce strict types yet)
        let type = "lift";
        if (typeRaw.includes("Sessel")) type = "chairlift";
        if (typeRaw.includes("Gondel") || typeRaw.includes("EUB")) type = "gondola";
        if (typeRaw.includes("Schlepp")) type = "platter";

        lifts.push({
            name,
            status,
            type
        });
    });

    const liftsOpen = lifts.filter((l) => l.status === "open").length;
    const liftsTotal = lifts.length;

    return createResult(details, { liftsOpen, liftsTotal, lifts }, "www.wurmberg-seilbahn.de");
}
