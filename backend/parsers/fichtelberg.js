import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function fichtelberg() {
    const url = "https://www.fichtelberg-ski.de/winter/liftstatus";
    try {
        const res = await fetchWithHeaders(url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        const lifts = [];

        $(".sidebar-status .sidebar-submenu > div").each((i, el) => {
            const $el = $(el);
            const name = $el.find("span").text().trim();
            const isOpen = $el.hasClass("status-active");

            if (name) {
                lifts.push({
                    name: name,
                    status: isOpen ? "open" : "closed"
                });
            }
        });

        const liftsOpen = lifts.filter(l => l.status === "open").length;
        const liftsTotal = lifts.length;

        if (liftsTotal === 0) {
            return {
                liftsOpen: 0,
                liftsTotal: 0,
                status: "parse_error"
            };
        }

        return {
            liftsOpen,
            liftsTotal,
            status: liftsOpen > 0 ? "open" : "closed",
            lifts: lifts
        };

    } catch (e) {
        console.error("Fichtelberg parser error:", e);
        return {
            liftsOpen: 0,
            liftsTotal: 0,
            status: "error"
        };
    }
}
