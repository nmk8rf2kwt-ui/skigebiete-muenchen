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
    const res = await fetchWithHeaders(details.apiUrl, options);
    if (!res.ok) throw new Error("Failed to fetch SkiWelt API");

    const data = await res.json();

    // API returns object with 'items' array
    const items = data.items || [];

    let liftsTotal = 0;
    let liftsOpen = 0;

    items.forEach(item => {
        liftsTotal++;
        // state: "opened", "closed"
        if (item.state === "opened") {
            liftsOpen++;
        }
    });

    if (liftsTotal === 0) {
        throw new Error("SkiWelt parsing returned zero lifts from API");
    }

    // Snow data: The API might have regions with snow info?
    // Often separate API. For now focus on lifts.

    return createResult(details.id, { liftsOpen, liftsTotal }, "skiwelt.at (API)");
}
