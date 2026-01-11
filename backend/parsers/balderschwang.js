import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "balderschwang",
    name: "Balderschwang",
    url: "https://www.skigebiet-balderschwang.de/lifte/",
};

export async function balderschwang() {
    try {
        const res = await fetchWithHeaders(details.url);
        if (!res.ok) throw new Error("Status " + res.status);

        const html = await res.text();
        const $ = cheerio.load(html);

        const lifts = [];

        $(".container-lifte table tbody tr").each((i, el) => {
            const $el = $(el);
            const $icon = $el.find("i.fas");
            let status = "closed";
            if ($icon.hasClass("open")) {
                status = "open";
            } else if ($icon.hasClass("closed")) {
                status = "closed";
            }

            const $nameCell = $el.find("td").eq(1);
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
            throw new Error("Balderschwang parsed zero lifts");
        }

        return createResult(details, {
            liftsOpen,
            liftsTotal,
            lifts: lifts,
            slopes: []
        }, "skigebiet-balderschwang.de");

    } catch (e) {
        console.error("Balderschwang parser error:", e);
        return null;
    }
}

export const parse = balderschwang;
