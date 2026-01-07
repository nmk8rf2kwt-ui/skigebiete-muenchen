import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function kampenwand() {
    try {
        const res = await fetchWithHeaders("https://www.kampenwand.de");
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        // const $ = cheerio.load(html); // Unused (commented out to avoid lint warning)

        return {
            liftsOpen: null,
            liftsTotal: 4,
            status: "static_only"
        };
    } catch (_) { // Unused error arg
        return {
            liftsOpen: 0,
            liftsTotal: 4,
            status: "error"
        };
    }
}
