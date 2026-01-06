import { createResult, STATUS } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";

export const details = {
    id: "wilder-kaiser",
    name: "Wilder Kaiser",
    url: "https://www.skiwelt.at/de/liftstatus.html",
    apiUrl: "https://www.skiwelt.at/webapi/micadoweb?api=Micado.Ski.Web/Micado.Ski.Web.IO.Api.FacilityApi/List.api&client=https%3A%2F%2Fsgm.skiwelt.at&lang=de&region=skiwelt&season=winter&typeIDs=1",
    district: "Wilder Kaiser",
};

export async function parse(options = {}) {
    // Unfiltered URL (removed typeIDs=1)
    const apiUrl = "https://www.skiwelt.at/webapi/micadoweb?api=Micado.Ski.Web/Micado.Ski.Web.IO.Api.FacilityApi/List.api&client=https%3A%2F%2Fsgm.skiwelt.at&lang=de&region=skiwelt&season=winter";

    // Strategy 2: Parallel Fetch
    const [resLifts, resSlopes] = await Promise.all([
        fetchWithHeaders(details.apiUrl, options), // lifts (typeIDs=1)
        fetchWithHeaders(details.apiUrl.replace("typeIDs=1", "typeIDs=2"), options) // slopes
    ]);

    if (!resLifts.ok) throw new Error("Failed to fetch SkiWelt Lifts API");
    if (!resSlopes.ok) throw new Error("Failed to fetch SkiWelt Slopes API");

    const liftsData = await resLifts.json();
    const slopesData = await resSlopes.json();

    const liftsItems = liftsData.items || [];
    const slopesItems = slopesData.items || [];

    const lifts = [];
    const slopes = [];

    // Process Lifts
    liftsItems.forEach(item => {
        lifts.push({
            name: item.title,
            status: item.state === "opened" ? "open" : "closed",
            type: item.facilityTypeIdentifier || "lift"
        });
    });

    // Process Slopes
    slopesItems.forEach(item => {
        slopes.push({
            name: item.title,
            status: item.state === "opened" ? "open" : "closed",
            type: item.facilityTypeIdentifier || "slope"
        });
    });

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0) {
        throw new Error("SkiWelt parsing returned zero lifts from API");
    }

    return createResult(details.id, { liftsOpen, liftsTotal, lifts, slopes }, "skiwelt.at (API)");
}
