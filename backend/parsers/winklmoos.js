import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "winklmoos",
    name: "Winklmoosalm - Reit im Winkl",
    url: "https://www.winklmoosalm.de/anlagen",
};

export async function winklmoos() {
    const res = await fetchWithHeaders(details.url);
    if (!res.ok) throw new Error("Failed to fetch Winklmoos");
    const html = await res.text();
    const $ = cheerio.load(html);

    const rows = $("tbody tr.text-gray-800");

    let liftsTotal = 0;
    let liftsOpen = 0;

    rows.each((_, row) => {
        const $row = $(row);
        const isOpen = $row.find(".bg-emerald-400").length > 0 || $row.find(".bg-emerald-500").length > 0;

        liftsTotal++;
        if (isOpen) {
            liftsOpen++;
        }
    });

    // Fallback if no specific rows found (sometimes dynamic loading)
    if (liftsTotal === 0) {
        const text = $("body").text();
        const match = text.match(/Geöffnete Anlagen.*?(\d+)\s*\/\s*(\d+)/i);
        if (match) {
            liftsOpen = parseInt(match[1], 10);
            liftsTotal = parseInt(match[2], 10);
        } else {
            throw new Error("Winklmoos parsed zero lifts");
        }
    }

    return createResult(details, {
        liftsOpen,
        liftsTotal,
        lifts: [],
        slopes: []
    }, "winklmoosalm.de");
}

export const parse = winklmoos;
