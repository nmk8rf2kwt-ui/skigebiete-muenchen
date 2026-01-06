import { createResult } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";

export const details = {
    id: "soelden",
    name: "Sölden",
    url: "https://www.soelden.com",
    district: "Ötztal",
};

export async function parse(options = {}) {
    const apiUrl = "https://winter.intermaps.com/soelden/data?lang=de";

    const res = await fetchWithHeaders(apiUrl, options);
    if (!res.ok) {
        throw new Error(`Failed to fetch Sölden API: ${res.status}`);
    }

    const data = await res.json();

    // Validation
    if (!data || !Array.isArray(data.lifts)) {
        throw new Error("Invalid Sölden API response: 'lifts' array missing");
    }

    const lifts = [];
    const slopes = [];

    // Parse Lifts
    data.lifts.forEach(item => {
        const name = item.popup?.title || item.title || "Unknown Lift";
        const statusRaw = item.status;

        let status = "unknown";
        if (statusRaw === "open") status = "open";
        else if (statusRaw === "closed") status = "closed";
        else if (statusRaw === "scheduled") status = "scheduled";

        lifts.push({
            name,
            status,
            type: "lift"
        });
    });

    // Parse Slopes
    if (Array.isArray(data.slopes)) {
        data.slopes.forEach(item => {
            const name = item.popup?.title || item.title || "Unknown Slope";
            let status = "unknown";
            if (item.status === "open") status = "open";
            else if (item.status === "closed") status = "closed";

            slopes.push({
                name,
                status,
                type: "slope"
            });
        });
    }

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    return createResult(details.id, { liftsOpen, liftsTotal, lifts, slopes }, "Intermaps (soelden.com)");
}
