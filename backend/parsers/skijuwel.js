import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export default async function parseSkiJuwel() {
    const url = "https://www.skijuwel.com/de/winter/lifte-und-pisten";

    try {
        const response = await fetchWithHeaders(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch Ski Juwel status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const lifts = [];
        const slopes = [];
        let snow = null;

        // Selector: tr.table__item
        $("tr.table__item").each((i, el) => {
            const name = $(el).find("td:nth-child(2)").text().trim();
            const statusSpan = $(el).find("td:nth-child(1) .table__status");
            const statusClass = statusSpan.attr("class") || "";

            if (!name) return;

            // Determine status
            let status = "unknown";
            if (statusClass.includes("table__status--open")) {
                status = "open";
            } else if (statusClass.includes("table__status--closed")) {
                status = "closed";
            }

            // Classify as lift or slope
            const lowerName = name.toLowerCase();

            // Skip non-ski facilities
            if (lowerName.includes('loipe') ||
                lowerName.includes('rodelbahn') ||
                lowerName.includes('park') ||
                lowerName.includes('route')) {
                return;
            }

            // Lifts have specific keywords
            const isLift = lowerName.includes('bahn') ||
                lowerName.includes('lift') ||
                lowerName.includes('gondel') ||
                lowerName.includes('sessel');

            if (isLift) {
                lifts.push({ name, status });
            } else {
                // Assume it's a slope
                slopes.push({ name, status });
            }
        });

        // Try to find snow info
        const snowText = $(".weather--summary").text();
        const snowMatch = snowText.match(/(\d+)\s*cm/);
        if (snowMatch) {
            snow = snowMatch[0];
        }

        const liftsOpen = lifts.filter(l => l.status === "open").length;
        const liftsTotal = lifts.length;

        return createResult("ski_juwel", {
            liftsOpen,
            liftsTotal,
            lifts,
            slopes,
            snow
        }, "skijuwel.com");
    } catch (error) {
        console.error("Error parsing Ski Juwel:", error);
        throw error;
    }
}

export const parse = parseSkiJuwel;
