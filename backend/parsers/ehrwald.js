import { fetchWithHeaders } from "../utils/fetcher.js";
import * as cheerio from "cheerio";

export const details = {
    id: "ehrwald",
    name: "Ehrwalder Almbahn",
    url: "https://www.almbahn.at/de/winter/skigebiet/anlagen-pisten/",
    district: "Tiroler Zugspitz Arena",
};

export async function parse() {
    const URL = details.url;
    const res = await fetchWithHeaders(URL);
    if (!res.ok) throw new Error("Failed to fetch Ehrwald");

    const html = await res.text();
    const $ = cheerio.load(html);

    const lifts = {};

    // Ehrwald "Anlagen & Pisten" page
    // Table structure
    $("table tbody tr").each((i, row) => {
        const cells = $(row).find("td");
        if (cells.length >= 2) {
            const name = $(cells[0]).text().trim();
            const statusHtml = $(cells[1]).html() || "";

            // Look for status icons
            const isOpen = statusHtml.includes("icon-check") || statusHtml.includes("grün") || statusHtml.includes("open");
            const isClosed = statusHtml.includes("icon-close") || statusHtml.includes("rot") || statusHtml.includes("closed");

            if (name && (isOpen || isClosed)) {
                lifts[name] = isOpen ? "open" : "closed";
            }
        }
    });

    const liftsTotal = Object.keys(lifts).length;
    const liftsOpen = Object.values(lifts).filter((s) => s === "open").length;

    if (liftsTotal === 0) {
        throw new Error("Ehrwald parsing returned zero lifts");
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
