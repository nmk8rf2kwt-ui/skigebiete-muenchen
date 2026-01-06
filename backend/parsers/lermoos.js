import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export default async function parseLermoos() {
    const url = "https://www.bergbahnen-langes.at/winter/anlagen-pisten/";

    try {
        const response = await fetchWithHeaders(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch Lermoos status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const lifts = [];
        const slopes = [];

        // Select rows in the table
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
                    // Determine status
                    let status = "unknown";
                    if (imgSrc.includes("on.svg") || imgTitle.toLowerCase().includes("offen")) {
                        status = "open";
                    } else if (imgSrc.includes("off.svg") || imgTitle.toLowerCase().includes("geschlossen")) {
                        status = "closed";
                    }

                    // Determine if lift or slope
                    const nameLower = name.toLowerCase();
                    if (nameLower.includes("bahn") || nameLower.includes("lift") || nameLower.includes("sessellift")) {
                        lifts.push({ name, status });
                    } else if (nameLower.includes("piste") || nameLower.includes("abfahrt")) {
                        slopes.push({ name, status });
                    } else {
                        // Default to lift
                        lifts.push({ name, status });
                    }
                }
            }
        });

        const liftsOpen = lifts.filter(l => l.status === "open").length;
        const liftsTotal = lifts.length;

        return createResult("lermoos", {
            liftsOpen,
            liftsTotal,
            lifts,
            slopes
        }, "bergbahnen-langes.at");
    } catch (error) {
        console.error("Error parsing Lermoos:", error);
        throw error;
    }
}

export const parse = parseLermoos;
