import { fetchHtml, createResult } from "../utils/parserUtils.js";

/**
 * Shared parser for Intermaps "detail_*.aspx" iframes (AlpenPlus)
 * @param {string} resortId 
 * @param {string} url 
 * @param {object} options 
 */
export async function parseIntermapsHtml(resortId, url, options = {}) {
    const $ = await fetchHtml(url, options);

    const lifts = [];
    const slopes = [];

    // Intermaps structure:
    // Usually 2 .row.infra elements. 
    // 1st = Lifts
    // 2nd = Slopes
    const infraRows = $(".row.infra");

    if (infraRows.length === 0) {
        throw new Error("No lift rows found in Intermaps iframe");
    }

    const processItems = (container, targetArray) => {
        const items = $(container).find(".col-xs-12 > div");

        items.each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            const name = text.replace(/\s+/g, " ").trim();

            const imgs = $el.find("img").map((_, img) => $(img).attr("src")).get();
            const isOpen = imgs.some(src => src.includes("169.png")); // Green tick
            const isClosed = imgs.some(src => src.includes("94.png")); // Red X

            let status = "unknown";
            if (isOpen) status = "open";
            else if (isClosed) status = "closed";

            if (name) {
                targetArray.push({
                    name: name,
                    status: status
                });
            }
        });
    };

    if (infraRows.length > 0) processItems(infraRows.eq(0), lifts);
    if (infraRows.length > 1) processItems(infraRows.eq(1), slopes);

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0 && slopes.length === 0) {
        throw new Error("Intermaps parsing returned zero items");
    }

    return createResult(resortId, { liftsOpen, liftsTotal, lifts, slopes }, new URL(url).hostname);
}
