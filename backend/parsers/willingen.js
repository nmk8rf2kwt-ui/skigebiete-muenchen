import { load } from "cheerio";
import { createResult } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";

export const details = {
    id: "willingen",
    name: "Willingen (Sauerland)",
    url: "https://www.skigebiet-willingen.de/",
    district: "Sauerland",
};

export async function parse(_options = {}) {
    const url = details.url;
    const res = await fetchWithHeaders(url, _options);

    if (!res.ok) {
        throw new Error(`Failed to fetch Willingen: ${res.status}`);
    }

    const html = await res.text();
    const $ = load(html);

    // Parse summary counts from header/dashboard
    // Example: <a href="..." class="ico-lifte"><strong>12</strong> Lifte<br /><span>in Betrieb</span></a>

    let liftsOpen = 0;

    const liftsOpenText = $(".ico-lifte strong").first().text().trim();
    const slopesOpenText = $(".ico-abfahrt strong").first().text().trim();

    if (liftsOpenText && !isNaN(parseInt(liftsOpenText))) {
        liftsOpen = parseInt(liftsOpenText);
    }

    if (slopesOpenText && !isNaN(parseInt(slopesOpenText))) {
        // slopesOpen = parseInt(slopesOpenText);
    }

    // Hardcoded total for now as it's not dynamically available on the main page summary
    const liftsTotal = 16;

    // We can't easily get individual lift status without detailed parsing, so we return empty lists
    // logical status calculation in frontend might rely on liftsOpen/liftsTotal ratios

    const lifts = [];
    // Populate dummy lifts to matching the count if needed, but 'liftsOpen' property usually overrides
    // For now, let's just return the counts.

    return createResult(details, { liftsOpen, liftsTotal, lifts, slopes: [] }, "skigebiet-willingen.de (Summary)");
}
