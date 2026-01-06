import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export default async function parseSkiJuwel() {
    const url = "https://www.skijuwel.com/de/winter/lifte-und-pisten";

    try {
        const response = await fetchWithHeaders(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch Ski Juwel status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        let liftsOpen = 0;
        let liftsTotal = 0;
        let snow = null;

        // Selector: tr.table__item
        $("tr.table__item").each((i, el) => {
            // Check if it is a lift (sometimes slopes are mixed in, check for lift icon or specific class if available)
            // Usually the name is in the second td
            const name = $(el).find("td:nth-child(2)").text().trim();

            // Status is in the first td
            // status class: .table__status--open or .table__status--closed
            const statusSpan = $(el).find("td:nth-child(1) .table__status");
            const statusClass = statusSpan.attr("class") || "";

            // Filter out non-lift items based on keywords
            // Lifts usually have "bahn", "lift", or are specific named lifts
            // Pistes/Loipes usually have "Loipe", "Rodelbahn", "Park", "Abfahrt", "Route"
            const lowerName = name.toLowerCase();
            const isNonLift = lowerName.includes('loipe') ||
                lowerName.includes('rodelbahn') ||
                lowerName.includes('snowpark') ||
                lowerName.includes('funpark') ||
                lowerName.includes('abfahrt') ||
                lowerName.includes('route') ||
                // Check if it's a piste number (Pistes often start with a number like "1 ", "2b ")
                // But lifts also have codes like "W1".
                // Heuristic: If it contains "bahn" or "lift", it's a lift.
                // If it DOESN'T contain bahn/lift, and looks like a piste?
                false; // formatting

            // Stronger heuristic: Must have Lift/Bahn in name?
            // "Alpbacher Bergbahn", "Arenalift".
            // Some might be "Horn 2000" (Lift).

            // Let's rely on exclusion list for now to reduce the count from 174.
            // Pistes are the main bulk.
            // Does the name contain "bahn" or "lift"?
            const isLikelyLift = lowerName.includes('bahn') || lowerName.includes('lift') || lowerName.includes('gondel') || lowerName.includes('sessel');

            // If we strictly only count items with "bahn"/"lift", we might miss some.
            // But if we exclude "Loipe", "Rodelbahn", "Route", "Park" we remove the obvious extras.
            // What about Pistes? "Familienabfahrt".

            if (lowerName.includes('loipe') ||
                lowerName.includes('rodelbahn') ||
                lowerName.includes('park') ||
                lowerName.includes('route') ||
                // "Abfahrt" matches most pistes?
                // Or maybe the table structure separates them?
                // Let's just try filtering strictly for now to see if it improves.
                // The user says 38/44 lifts.
                // If I count only lifts, I should be close to 44.
                false
            ) {
                return; // Skip
            }

            // Ski Juwel specific: Pistes are also in table__item.
            // Pistes don't usually have "Lift" or "Bahn" in name.
            // Let's try: Count ONLY if it has Bahn/Lift/Gondel/Sessel or is in a whitelist?
            // No, that's too restrictive.

            // Let's exclude things that look like Pistes.
            // Pistes often have just a name.

            // Actually, let's use the USER'S hint: "101/174 lifts open".
            // 174 is clearly Total Items.
            // We want to reduce this to ~44.
            // This means ~130 items are NOT lifts.
            // Most valid Lifts have "lift" or "bahn".

            if (!isLikelyLift) {
                // If it doesn't have lift/bahn, assume it's a slope/other UNLESS it's a special known lift
                // "Wiedersbergerhornbahn" -> match
                // "Gmahalm" -> Piste?
                return;
            }

            if (name) {
                liftsTotal++;
                if (statusClass.includes("table__status--open")) {
                    liftsOpen++;
                }
            }
        });

        // Try to find snow info
        // Often in a header or sidebar
        // <div class="weather--summary"> ... </div>
        const snowText = $(".weather--summary").text();
        const snowMatch = snowText.match(/(\d+)\s*cm/);
        if (snowMatch) {
            snow = snowMatch[0];
        }

        return {
            liftsOpen,
            liftsTotal,
            snow,
            weather: null,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error parsing Ski Juwel:", error);
        return null;
    }
}
