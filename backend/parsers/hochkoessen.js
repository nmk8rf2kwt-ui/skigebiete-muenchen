import { fetchWithHeaders } from "../utils/fetcher.js";
import * as cheerio from "cheerio";

export const details = {
    id: "hochkoessen",
    name: "Hochkössen",
    url: "https://www.kaiserwinkl.com/de/skiurlaub-tirol/geoeffnete-lifte.html",
    district: "Kitzbühel",
};

export async function parse() {
    const URL = details.url;
    const res = await fetchWithHeaders(URL);
    if (!res.ok) throw new Error("Failed to fetch Hochkössen");

    const html = await res.text();
    const $ = cheerio.load(html);

    const lifts = {};

    // Kaiserwinkl list parsing
    // Tables with lift names and status icons/text

    $("table tr").each((i, row) => {
        const name = $(row).find("td").first().text().trim();
        const statusHtml = $(row).html() || "";

        const isOpen = statusHtml.includes("icon-check") || statusHtml.includes("geöffnet") || statusHtml.includes("open");
        const isClosed = statusHtml.includes("icon-close") || statusHtml.includes("geschlossen") || statusHtml.includes("closed");

        // Filter out slopes if possible, usually distinguishable by "Piste" in name or header
        // But for now, getting data is priority.
        if (name && (isOpen || isClosed)) {
            // Simple heuristic to avoid Pisten if they are explicitly named so
            if (!name.toLowerCase().includes("piste") && !name.toLowerCase().includes("abfahrt")) {
                lifts[name] = isOpen ? "open" : "closed";
            }
        }
    });

    const liftsTotal = Object.keys(lifts).length;
    const liftsOpen = Object.values(lifts).filter((s) => s === "open").length;

    if (liftsTotal === 0) {
        // Fallback: The user suggested tirol.at which has summary "8/11"
        // If detailed parsing fails, we could try that, but let's throw for now to see in debug.
        throw new Error("Hochkössen parsing returned zero lifts");
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
