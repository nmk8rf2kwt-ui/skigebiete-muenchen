import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function oberstdorf() {
    const url = "https://www.ok-bergbahnen.com/skigebiete/status-anlagen-pisten-wege/";
    try {
        const res = await fetchWithHeaders(url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        const lifts = [];

        // Select all elements that represent lifts
        $(".element").each((i, el) => {
            const $el = $(el);

            // Extract name
            const name = $el.find(".name").text().trim();

            // Extract status icon src
            const iconSrc = $el.find(".status img.icon").attr("src") || "";

            // Determine status
            let status = "closed";
            if (iconSrc.includes("offen.svg")) {
                status = "open";
            } else if (iconSrc.includes("geschlossen.svg")) {
                status = "closed";
            } else {
                // Determine if there might be other statuses like 'scheduled'
                // For now, default to closed if not explicit open
                status = "closed";
            }

            // Extract type
            // const type = $el.find(".typ img.icon").attr("title"); // e.g. "Sessellift"

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
            // Fallback if parsing fails or layout changes
            return {
                liftsOpen: null,
                liftsTotal: null,
                status: "parse_error"
            };
        }

        return {
            liftsOpen,
            liftsTotal,
            status: "open", // Overall status. Could be derived.
            lifts: lifts
        };

    } catch (e) {
        console.error("Oberstdorf parser error:", e);
        return {
            liftsOpen: 0,
            liftsTotal: 0,
            status: "error"
        };
    }
}
