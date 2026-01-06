import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function wendelstein() {
    const url = "https://www.wendelsteinbahn.de/wetter";
    try {
        const res = await fetchWithHeaders(url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);
        
        const lifts = [];
        
        // Find all h3 headers for lift names and their following paragraphs for status
        $("h3").each((i, el) => {
            const name = $(el).text().trim();
            
            // Only process Seilbahn and Zahnradbahn
            if (name === "Seilbahn" || name === "Zahnradbahn") {
                const statusText = $(el).next("p").text().trim();
                
                // Check if "in Betrieb" or "nicht in Betrieb" / "geschlossen"
                const isOpen = statusText.includes("in Betrieb") && 
                              !statusText.includes("nicht in Betrieb") &&
                              !statusText.includes("nicht mehr in Betrieb");
                
                lifts.push({
                    name: name,
                    status: isOpen ? "open" : "closed"
                });
            }
        });

        // Remove duplicates (the page shows the same info twice)
        const uniqueLifts = [];
        const seen = new Set();
        for (const lift of lifts) {
            if (!seen.has(lift.name)) {
                seen.add(lift.name);
                uniqueLifts.push(lift);
            }
        }

        const liftsOpen = uniqueLifts.filter(l => l.status === "open").length;
        const liftsTotal = uniqueLifts.length;

        if (liftsTotal === 0) {
            return {
                liftsOpen: 0,
                liftsTotal: 0,
                status: "parse_error"
            };
        }

        return {
            liftsOpen,
            liftsTotal,
            status: liftsOpen > 0 ? "open" : "closed",
            lifts: uniqueLifts
        };

    } catch (e) {
        console.error("Wendelstein parser error:", e);
        return {
            liftsOpen: 0,
            liftsTotal: 0,
            status: "error"
        };
    }
}
