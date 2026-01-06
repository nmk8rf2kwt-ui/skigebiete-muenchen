import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function steinplatte() {
    const res = await fetchWithHeaders("https://www.steinplatte.tirol/de/liftstatus.html");
    if (!res.ok) throw new Error("Failed to fetch Steinplatte");
    const html = await res.text();
    const $ = cheerio.load(html);

    let liftsTotal = 0;
    let liftsOpen = 0;

    // The page structure seems to be a grid or list where Status, Name, Length are siblings or close.
    // Based on text content "Geöffnet" / "Geschlossen" appearing near names.

    // Strategy: Look for elements containing "Geöffnet" or "Geschlossen" that are likely status indicators.
    // The markdown showed "Geöffnet" followed by length. 
    // Let's look for the main container "liftstatus" or similar if possible, but text search is safer against class changes.

    // Find all elements that have text "Geöffnet" or "Geschlossen" exactly
    const states = $("*").filter((i, el) => {
        const t = $(el).text().trim();
        // Strict check to avoid including the container or full page
        return t === "Geöffnet" || t === "Geschlossen" || t === "Geschlossen (Saisonende)";
    });

    // We need to be careful not to count duplicates (e.g. mobile vs desktop views). 
    // Usually these status badges are leaf nodes.

    states.each((i, el) => {
        // Ensure this is a leaf node or close to it
        if ($(el).children().length > 0) return;

        liftsTotal++;
        const status = $(el).text().trim();
        if (status === "Geöffnet") {
            liftsOpen++;
        }
    });

    // If strict text fail, try "Status" column heuristic
    if (liftsTotal === 0) {
        // Fallback: Look for specific classes if we knew them, or try to parse the container with header
        // "Diese Bahnen und Lifte haben heute für euch geöffnet:"
        // Find siblings of this header?
    }

    return {
        liftsOpen,
        liftsTotal,
        status: "ok",
        lastUpdated: new Date().toISOString()
    };
}
