import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "oberjoch",
    name: "Oberjoch - Bad Hindelang",
    url: "https://www.bergbahnen-hindelang-oberjoch.de/status/",
};

export async function oberjoch() {
    try {
        const res = await fetchWithHeaders(details.url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        const lifts = [];

        $("ul.lifts li.lift").each((i, el) => {
            const $el = $(el);
            const $icon = $el.find(".status-icon");
            let status = "closed";
            if ($icon.hasClass("open")) {
                status = "open";
            } else if ($icon.hasClass("closed")) {
                status = "closed";
            }

            let name = $el.text().trim();
            name = name.replace(/\u00AD/g, "");
            name = name.replace(/\s+/g, " ").trim();

            if (name) {
                lifts.push({
                    name: name,
                    status: status
                });
            }
        });

        const liftsOpen = lifts.filter(l => l.status === "open").length;
        const liftsTotal = lifts.length;

        if (liftsTotal === 0) {
            throw new Error("Oberjoch parsed zero lifts");
        }

        return createResult(details, {
            liftsOpen,
            liftsTotal,
            lifts: lifts,
            slopes: []
        }, "bergbahnen-hindelang-oberjoch.de");

    } catch (e) {
        console.error("Oberjoch parser error:", e);
        return null;
    }
}

export const parse = oberjoch;
