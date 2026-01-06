import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function balderschwang() {
    const url = "https://www.skigebiet-balderschwang.de/lifte/";
    try {
        const res = await fetchWithHeaders(url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        const lifts = [];

        // Select table rows in the lift container
        $(".container-lifte table tbody tr").each((i, el) => {
            const $el = $(el);

            // Extract status from the icon class
            // <i class="fas fa-circle open"></i>
            const $icon = $el.find("i.fas");
            let status = "closed";
            if ($icon.hasClass("open")) {
                status = "open";
            } else if ($icon.hasClass("closed")) {
                status = "closed";
            }

            // Extract name
            // <b><span class="text-dark-blue mr-1">(A)</span> Schelpenbahn</b>
            const $nameCell = $el.find("td").eq(1);
            // Remove the span (letter code) to get clean name
            $nameCell.find("span").remove();
            let name = $nameCell.text().trim();

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
                liftsOpen: 0,
                liftsTotal: 0,
                status: "parse_error"
            };
        }

        return {
            liftsOpen,
            liftsTotal,
            status: "open", // Overall status
            lifts: lifts
        };

    } catch (e) {
        console.error("Balderschwang parser error:", e);
        return {
            liftsOpen: 0,
            liftsTotal: 0,
            status: "error"
        };
    }
}
