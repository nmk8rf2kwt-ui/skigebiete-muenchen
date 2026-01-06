import { createResult } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";
import * as cheerio from "cheerio";

export const details = {
    id: "winterberg",
    name: "Skiliftkarussell Winterberg",
    url: "https://www.skiliftkarussell.de/aktuell/lift-und-pisteninfo/",
    district: "Sauerland",
};

export async function parse(options = {}) {
    const url = details.url;
    const res = await fetchWithHeaders(url, options);

    if (!res.ok) {
        throw new Error(`Failed to fetch Winterberg: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const lifts = [];

    // Iterate over lift rows
    // Based on winterberg.html view: <tr class="default-visible-infos ...">
    $("tr.default-visible-infos").each((i, row) => {
        const $row = $(row);
        const name = $row.find(".lift-id-name").text().trim();
        const number = $row.find(".lift-id-number").text().trim();

        // Status can be found in .lift-icon
        // <span class="lift-icon status-yes">
        // <span class="lift-icon status-no">
        const isYes = $row.find(".lift-icon.status-yes").length > 0;
        const isNo = $row.find(".lift-icon.status-no").length > 0;

        let status = "unknown";
        if (isYes) status = "open";
        else if (isNo) status = "closed";

        // Type detection based on class: lift-type-sessel-4, etc.
        let type = "lift";
        const typeSpan = $row.find(".de-lifttyp span").first();
        const typeClass = typeSpan.attr("class") || "";
        if (typeClass.includes("sessel")) type = "chairlift";
        else if (typeClass.includes("schlepp")) type = "draglift";
        else if (typeClass.includes("gondel")) type = "gondola";
        else if (typeClass.includes("band")) type = "conveyor";

        if (name) {
            lifts.push({
                name: number ? `${number} ${name}` : name,
                status,
                type
            });
        }
    });

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0) {
        throw new Error("Winterberg parser found 0 lifts");
    }

    // Parse Snow/Slopes if possible (Todo later or basic now)
    // For now return basic lift data

    return createResult(details.id, { liftsOpen, liftsTotal, lifts }, "skiliftkarussell.de");
}
