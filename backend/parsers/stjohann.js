import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export default async function parseStJohann() {
    const url = "https://www.kitzbueheler-alpen.com/layout/locally/ski-snow-over-winter.element?lang=de&client=http%3A%2F%2Fsgm.bergbahnen-stjohann.at%2F&region=stjohann";

    try {
        const response = await fetchWithHeaders(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch St. Johann status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const lifts = [];
        const slopes = [];
        let snow = null;

        // The API returns an HTML fragment with list items
        $(".list ul li, li[class*='state']").each((i, el) => {
            const className = $(el).attr("class") || "";
            const text = $(el).text().trim();

            if (text) {
                // Determine status from class
                let status = "unknown";
                if (className.includes("state1")) {
                    status = "open";
                } else if (className.includes("state2")) {
                    status = "closed";
                }

                // Try to determine if lift or slope
                const textLower = text.toLowerCase();
                if (textLower.includes("bahn") || textLower.includes("lift") || textLower.includes("sessellift")) {
                    lifts.push({ name: text, status });
                } else if (textLower.includes("piste") || textLower.includes("abfahrt")) {
                    slopes.push({ name: text, status });
                } else {
                    // Default to lift
                    lifts.push({ name: text, status });
                }
            }
        });

        // Try to find snow depth
        const snowElement = $(".snow, .snow-depth, .schneewert");
        if (snowElement.length > 0) {
            snow = snowElement.first().text().trim();
        } else {
            const fullText = $.text();
            const snowMatch = fullText.match(/Berg:\s*(\d+\s*cm)/i);
            if (snowMatch) {
                snow = snowMatch[1];
            }
        }

        const liftsOpen = lifts.filter(l => l.status === "open").length;
        const liftsTotal = lifts.length;

        return createResult("st_johann", {
            liftsOpen,
            liftsTotal,
            lifts,
            slopes,
            snow
        }, "kitzbueheler-alpen.com");
    } catch (error) {
        console.error("Error parsing St. Johann:", error);
        throw error;
    }
}

export const parse = parseStJohann;
