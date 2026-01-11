import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "oberaudorf",
    name: "Hocheck - Oberaudorf",
    url: "https://www.hocheck.com/winter/anlagenbericht",
};

export async function oberaudorf() {
    try {
        const res = await fetchWithHeaders(details.url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        return createResult(details, {
            liftsOpen: 0,
            liftsTotal: 5,
            lifts: [],
            slopes: []
        }, "Static Data (404 fallback)");
    } catch (_err) {
        return createResult(details, {
            liftsOpen: 0,
            liftsTotal: 5,
            lifts: [],
            slopes: []
        }, "Static Data (404 fallback)");
    }
}

export const parse = oberaudorf;
