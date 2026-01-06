import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function oberaudorf() {
    try {
        const res = await fetchWithHeaders("https://www.hocheck.com/winter/anlagenbericht");
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        // Hocheck usually has a clear list or table
        // Looking for "Geöffnet" count
        let liftsOpen = 0;
        let liftsTotal = 0;

        // Hypothetical selectors - will need adjustment based on real HTML
        // Looking for rows with "in Betrieb" or "Geöffnet"
        // Common German indicators:
        // "in Betrieb", "Geöffnet", "Offen"

        const items = $(".anlagenstatus-item, tr, li");

        // Simple Text Search Strategy as fallback
        const content = $.text();
        // This is risky without specific HTML structure.

        return {
            liftsOpen: null,
            liftsTotal: 5,
            status: "static_only" // Marking as static until verified
        };
    } catch (e) {
        return {
            liftsOpen: 0,
            liftsTotal: 5,
            status: "error"
        };
    }
}
