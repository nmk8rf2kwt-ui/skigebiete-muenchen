import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function wurmberg() {
    const url = "https://www.wurmberg-seilbahn.de/";
    try {
        const res = await fetchWithHeaders(url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        let liftsOpen = 0;
        let liftsTotal = 0;
        let foundTable = false;

        // Find the table with "Lifte" row
        $(".simple-table tr").each((i, el) => {
            const $cols = $(el).find("td");
            if ($cols.length >= 3) {
                const label = $cols.eq(0).text().trim();
                if (label === "Lifte") {
                    liftsTotal = parseInt($cols.eq(1).text().trim(), 10) || 0;
                    liftsOpen = parseInt($cols.eq(2).text().trim(), 10) || 0;
                    foundTable = true;
                }
            }
        });

        if (!foundTable) {
            return {
                liftsOpen: 0,
                liftsTotal: 0,
                status: "parse_error"
            };
        }

        // Create a generic lift object since individual status isn't listed
        const lifts = [{
            name: "Gesamtstatus (siehe Webseite für Details)",
            status: liftsOpen > 0 ? "open" : "closed"
        }];

        return {
            liftsOpen,
            liftsTotal,
            status: liftsOpen > 0 ? "open" : "closed",
            lifts: lifts
        };

    } catch (e) {
        console.error("Wurmberg parser error:", e);
        return {
            liftsOpen: 0,
            liftsTotal: 0,
            status: "error"
        };
    }
}
