import { createResult } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";

export const details = {
    id: "wilder-kaiser",
    name: "Wilder Kaiser",
    url: "https://www.skiwelt.at/de/liftstatus.html",
    apiUrl: "https://www.skiwelt.at/webapi/micadoweb?api=Micado.Ski.Web/Micado.Ski.Web.IO.Api.FacilityApi/List.api&client=https%3A%2F%2Fsgm.skiwelt.at&lang=de&region=skiwelt&season=winter&typeIDs=1",
    district: "Wilder Kaiser",
};

// Helper to map slope type to difficulty
function mapDifficulty(type) {
    if (!type) return undefined;
    const t = type.toLowerCase();
    if (t.includes('easy') || t.includes('leicht')) return 'blue';
    if (t.includes('medium') || t.includes('mittel')) return 'red';
    if (t.includes('difficult') || t.includes('schwer')) return 'black';
    if (t.includes('freeride') || t.includes('skiroute')) return 'freeride';
    return undefined;
}

// Helper to extract current operating times
function getCurrentOperatingTime(operatingTimes) {
    if (!operatingTimes || operatingTimes.length === 0) return {};

    const now = new Date();
    // Find the period that includes today
    const current = operatingTimes.find(period => {
        const from = new Date(period.dateFrom);
        const to = new Date(period.dateTo);
        return now >= from && now <= to;
    });

    if (current) {
        return {
            operatingHours: `${current.timeFrom} - ${current.timeTo}`,
            seasonStart: current.dateFrom.split('T')[0],
            seasonEnd: current.dateTo.split('T')[0]
        };
    }

    // Fallback to first period if no current match
    if (operatingTimes[0]) {
        return {
            operatingHours: `${operatingTimes[0].timeFrom} - ${operatingTimes[0].timeTo}`,
            seasonStart: operatingTimes[0].dateFrom.split('T')[0],
            seasonEnd: operatingTimes[0].dateTo.split('T')[0]
        };
    }

    return {};
}

export async function parse(options = {}) {
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
        const lift = {
            name: item.title,
            status: item.state === "opened" ? "open" : "closed",
            type: item.facilityTypeIdentifier || "lift"
        };

        const times = getCurrentOperatingTime(item.operatingTimes);
        if (times.operatingHours) lift.operatingHours = times.operatingHours;
        if (times.seasonStart) lift.seasonStart = times.seasonStart;
        if (times.seasonEnd) lift.seasonEnd = times.seasonEnd;

        // Enhanced metadata
        if (item.liftLength) lift.length = item.liftLength;
        if (item.altitude) lift.altitudeStart = item.altitude;

        lifts.push(lift);
    });

    // Process Slopes
    slopesItems.forEach(item => {
        const slope = {
            name: item.title,
            status: item.state === "opened" ? "open" : "closed",
            type: item.facilityTypeIdentifier || "slope"
        };

        const times = getCurrentOperatingTime(item.operatingTimes);
        if (times.operatingHours) slope.operatingHours = times.operatingHours;
        if (times.seasonStart) slope.seasonStart = times.seasonStart;
        if (times.seasonEnd) slope.seasonEnd = times.seasonEnd;

        // Enhanced metadata
        if (item.liftLength) slope.length = item.liftLength;
        if (item.altitude) slope.altitudeStart = item.altitude;
        const difficulty = mapDifficulty(item.facilityTypeIdentifier);
        if (difficulty) slope.difficulty = difficulty;

        slopes.push(slope);
    });

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0) {
        throw new Error("SkiWelt parsing returned zero lifts from API");
    }

    return createResult(details, { liftsOpen, liftsTotal, lifts, slopes }, "skiwelt.at (API)");
}
