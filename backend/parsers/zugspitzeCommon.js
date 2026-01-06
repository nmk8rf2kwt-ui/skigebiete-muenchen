import { fetchHtml, createResult } from "../utils/parserUtils.js";

export async function parseZugspitzeCommon(resortId, headerText, options = {}) {
    const URL = "https://zugspitze.de/anlagen";
    const $ = await fetchHtml(URL, options);

    const header = $("h2").filter((i, el) => $(el).text().trim() === headerText).first();
    if (header.length === 0) {
        throw new Error(`${headerText} section not found`);
    }

    const section = header.closest("section.facilities-item");

    const parseContainer = (typeFilter) => {
        const container = section.find(".facilities-item__container").filter((i, el) => {
            const title = $(el).find(".facilities-item__title").text().toLowerCase();
            if (typeFilter === "lift") return title.includes("lifte");
            if (typeFilter === "slope") return title.includes("pisten") || title.includes("abfahrten") || title.includes("talabfahrten");
            return false;
        }).first();

        const items = [];
        if (container.length > 0) {
            const rows = container.find(".facilities-item__row");
            rows.each((_, row) => {
                const $row = $(row);
                // Name often contains time in a child div, we want just the text node or trim the rest
                // But .text() grabs children too.
                // Structure: Name \n <div time>...</div>

                // Clone to remove children for text extraction
                const $name = $row.find(".facilities-item__name").clone();
                $name.find(".facilities-item__time").remove();
                const name = $name.text().trim();

                const statusTitle = $row.find(".facilities-item__state").attr("title")?.toLowerCase() || "";

                let status = "unknown";
                if (statusTitle.includes("geöffnet") || statusTitle.includes("offen")) status = "open";
                else if (statusTitle.includes("geschlossen")) status = "closed";

                const type = $row.find(".facilities-item__type").attr("title");

                // Extract operating hours
                const timeDiv = $row.find(".facilities-item__time");
                const operatingHours = timeDiv.length > 0 ? timeDiv.text().trim().replace(/\s*Uhr\s*/g, '').trim() : undefined;

                if (name) {
                    const item = { name, status, type };
                    if (operatingHours) item.operatingHours = operatingHours;
                    items.push(item);
                }
            });
        }
        return items;
    };

    const lifts = parseContainer("lift");
    const slopes = parseContainer("slope");

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0) {
        throw new Error(`${headerText} parsing returned zero lifts`);
    }

    // Snow logic (shared global script check)
    let snow = null;
    const scriptContent = $("script").map((i, el) => $(el).html()).get().join(" ");
    const snowMatch = scriptContent.match(/"snow[^"]*"\s*:\s*"?(\d+)/i);
    if (snowMatch) {
        snow = `${snowMatch[1]}cm`;
    }

    return createResult(resortId, { liftsOpen, liftsTotal, snow, lifts, slopes }, "zugspitze.de");
}
