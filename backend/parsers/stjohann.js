import * as cheerio from "cheerio";

export default async function parseStJohann() {
    // Use the internal API endpoint found during inspection
    const url = "https://www.kitzbueheler-alpen.com/layout/locally/ski-snow-over-winter.element?lang=de&client=http%3A%2F%2Fsgm.bergbahnen-stjohann.at%2F&region=stjohann";

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Fallback or retry logic could be added here
            throw new Error(`Failed to fetch St. Johann status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        let liftsOpen = 0;
        let liftsTotal = 0;
        let snow = null;

        // The API returns an HTML fragment.
        // Lifts are typically in a list or grouped by status.
        // Based on inspection of similar Intermaps overlays:
        // Look for list items representing lifts.

        // In the overlay HTML:
        // <li class="state1">...</li> for open
        // <li class="state2">...</li> for closed

        // We search for elements with class 'state1', 'state2', etc. inside the list container
        $(".list ul li, li[class*='state']").each((i, el) => {
            const className = $(el).attr("class") || "";
            const text = $(el).text().trim();

            // Filter out non-lift items if possible (e.g., slopes usually have different classes or sections)
            // Often Intermaps mixes lifts and slopes. Lifts might be identified by an icon or section header.
            // For now, we will count all items and try to refine if needed.
            // However, usually 'state1' implies open.

            if (text) {
                liftsTotal++;
                if (className.includes("state1")) {
                    liftsOpen++;
                }
            }
        });

        // Try to find snow depth text
        // Often in a <span class="snow"> or similar
        // Or just search text in the summary section
        const snowElement = $(".snow, .snow-depth, .schneewert");
        if (snowElement.length > 0) {
            snow = snowElement.first().text().trim();
        } else {
            // Search text for "Berg" or "Tal"
            const fullText = $.text();
            const snowMatch = fullText.match(/Berg:\s*(\d+\s*cm)/i);
            if (snowMatch) {
                snow = snowMatch[1];
            }
        }

        return {
            liftsOpen,
            liftsTotal,
            snow,
            weather: null,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error parsing St. Johann:", error);
        return null;
    }
}
