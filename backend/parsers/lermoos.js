import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export default async function parseLermoos() {
    const url = "https://www.bergbahnen-langes.at/winter/anlagen-pisten/";

    try {
        const response = await fetchWithHeaders(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch Lermoos status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        let liftsOpen = 0;
        let liftsTotal = 0;

        // Select rows in the table
        // The specific selector found was section.ampelsystem table.pure-table tbody tr
        $("section.ampelsystem table.pure-table, table.pure-table").find("tbody tr").each((i, el) => {
            const tds = $(el).find("td");
            if (tds.length >= 3) {
                // Name is usually in the 2nd td (index 1)
                const name = $(tds[1]).text().trim();

                // Status is in the 3rd td (index 2) as an img
                const img = $(tds[2]).find("img");
                const imgSrc = img.attr("src") || "";
                const imgTitle = img.attr("title") || "";

                if (name) {
                    liftsTotal++;
                    // Check for "on.svg" in src or "offen" in title
                    if (imgSrc.includes("on.svg") || imgTitle.toLowerCase().includes("offen")) {
                        liftsOpen++;
                    }
                }
            }
        });

        return {
            liftsOpen,
            liftsTotal,
            snow: null, // Snow depth not easily available in this table
            weather: null,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error parsing Lermoos:", error);
        return null;
    }
}
