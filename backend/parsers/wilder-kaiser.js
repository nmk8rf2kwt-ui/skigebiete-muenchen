import { fetchWithHeaders } from "../utils/fetcher.js";
import * as cheerio from "cheerio";

export const details = {
    id: "wilder-kaiser",
    name: "Wilder Kaiser",
    url: "https://www.skiwelt.at/de/liftstatus.html",
    district: "Wilder Kaiser",
};

export async function parse() {
    const URL = details.url;
    const res = await fetchWithHeaders(URL);
    if (!res.ok) throw new Error("Failed to fetch SkiWelt");

    const html = await res.text();
    const $ = cheerio.load(html);

    const lifts = {};

    // SkiWelt generic table parser
    // Look for tables with lift logic
    $("table tr").each((i, row) => {
        const name = $(row).find("td").first().text().trim();
        const statusHtml = $(row).html() || "";

        // Status logic for SkiWelt
        // Often "status-1" implies open, "status-2" closed, etc.
        // Or check for "Geöffnet" / "Geschlossen"
        const isOpen = statusHtml.includes("status-1") || statusHtml.includes("open") || statusHtml.includes("check");
        const isClosed = statusHtml.includes("status-2") || statusHtml.includes("closed") || statusHtml.includes("times");

        if (name && (isOpen || isClosed)) {
            lifts[name] = isOpen ? "open" : "closed";
        }
    });

    // Verify finding specific lifts if possible to ensure we parsed the right table
    // but generic should work if the page is standard.

    const liftsTotal = Object.keys(lifts).length;
    const liftsOpen = Object.values(lifts).filter((s) => s === "open").length;

    if (liftsTotal === 0) {
        throw new Error("SkiWelt parsing returned zero lifts (Needs further DOM analysis)");
    }

    return {
        lifts: {
            total: liftsTotal,
            open: liftsOpen,
            status: liftsOpen === 0 ? "closed" : liftsOpen === liftsTotal ? "open" : "scheduled",
        },
        lastUpdated: new Date().toISOString(),
    };
}
