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
