import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function oberjoch() {
    const url = "https://www.bergbahnen-hindelang-oberjoch.de/status/";
    try {
        const res = await fetchWithHeaders(url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        const lifts = [];

        // Select lifts list
        $("ul.lifts li.lift").each((i, el) => {
            const $el = $(el);

            // Extract status
            const $icon = $el.find(".status-icon");
            let status = "closed";
            if ($icon.hasClass("open")) {
                status = "open";
            } else if ($icon.hasClass("closed")) {
                status = "closed";
            }

            // Extract name and clean it
            // The name is the text of the li, excluding children text if possible, but here 
            // the structure is <li class="lift"><span ...></span> Name </li>
            // So we can get text and trim.
            let name = $el.text().trim();
            // Remove soft hyphens and &nbsp; artifacts if any remain
            name = name.replace(/\u00AD/g, ""); // Remove soft hyphen
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
            return {
                liftsOpen: 0, // safe fallback
                liftsTotal: 0,
                status: "parse_error" // indicates something went wrong with parsing structure
            };
        }

        return {
            liftsOpen,
            liftsTotal,
            status: "open", // Overall status could be computed
            lifts: lifts
        };

    } catch (e) {
        console.error("Oberjoch parser error:", e);
        return {
            liftsOpen: 0,
            liftsTotal: 0,
            status: "error"
        };
    }
}
