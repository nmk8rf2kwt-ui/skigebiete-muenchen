import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function wilderKaiser() {
    const res = await fetchWithHeaders("https://www.skiwelt.at/de/liftstatus.html");
    if (!res.ok) throw new Error("Failed to fetch SkiWelt");

    // The previous analysis suggests SkiWelt also uses Next.js or a dynamic loader.
    // However, the search result point to a standard HTML page.
    // Let's assume standard HTML first, but prepared for Next.js hydration if identifying markers are found.

    const html = await res.text();

    // Check for Next.js hydration first (heuristic based on other parsers)
    if (html.includes("self.__next_f.push")) {
        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let matches;
        let liftsTotal = 0;
        let liftsOpen = 0;
        let foundData = false;

        while ((matches = regex.exec(html)) !== null) {
            const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

            // Pattern for SkiWelt might be similar to others (id, status, typename)
            const liftRegex = /"id":\d+,"identifier":"[A-Z0-9]+".*?"status":(\d+).*?"typename":"[^"]+"/g;

            let liftMatch;
            while ((liftMatch = liftRegex.exec(content)) !== null) {
                foundData = true;
                const status = parseInt(liftMatch[1], 10);
                // Assumption: 1 = Open (standard for Feratel/Intermaps feeds usually used)
                liftsTotal++;
                if (status === 1) {
                    liftsOpen++;
                }
            }
        }

        // If we found data via hydration
        if (foundData) {
            return {
                resort: "Wilder Kaiser",
                liftsOpen,
                liftsTotal,
                status: "ok",
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Fallback to Cheerio for standard HTML
    const $ = cheerio.load(html);

    // Attempt to find simple status indicators if standard HTML
    // Look for "open" or "closed" classes

    let liftsTotal = 0;
    let liftsOpen = 0;

    // Generic search for list items with status
    // Many Tyrolean sites use specific classes.
    // Let's count elements with "status" and "open"

    // This is a blind guess without seeing the new page source, 
    // but better than the old broken one.
    // We will verify this with the test script.

    // Safe fallback if zero found
    // We throw to trigger the "n.a." in frontend
    throw new Error("SkiWelt parsing returned zero lifts (Needs further DOM analysis)");
}
