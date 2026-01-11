import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "wendelstein",
    name: "Wendelstein - Brannenburg/Osterhofen",
    url: "https://www.wendelsteinbahn.de/wetter",
};

export async function wendelstein() {
    try {
        const res = await fetchWithHeaders(details.url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        const lifts = [];

        $("h3").each((i, el) => {
            const name = $(el).text().trim();
            if (name === "Seilbahn" || name === "Zahnradbahn") {
                const statusText = $(el).next("p").text().trim();
                const isOpen = statusText.includes("in Betrieb") &&
                    !statusText.includes("nicht in Betrieb") &&
                    !statusText.includes("nicht mehr in Betrieb");

                lifts.push({
                    name: name,
                    status: isOpen ? "open" : "closed"
                });
            }
        });

        const uniqueLifts = [];
        const seen = new Set();
        for (const lift of lifts) {
            if (!seen.has(lift.name)) {
                seen.add(lift.name);
                uniqueLifts.push(lift);
            }
        }

        const liftsOpen = uniqueLifts.filter(l => l.status === "open").length;
        const liftsTotal = uniqueLifts.length;

        if (liftsTotal === 0) {
            throw new Error("Wendelstein parsed zero lifts");
        }

        return createResult(details, {
            liftsOpen,
            liftsTotal,
            lifts: uniqueLifts,
            slopes: []
        }, "wendelsteinbahn.de");

    } catch (e) {
        console.error("Wendelstein parser error:", e);
        return createResult(details, {
            liftsOpen: 0,
            liftsTotal: 2,
            lifts: [],
            slopes: []
        }, "wendelsteinbahn.de (Fallback)");
    }
}

export const parse = wendelstein;
