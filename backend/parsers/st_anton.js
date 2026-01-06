import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "st_anton",
    name: "St. Anton am Arlberg",
    url: "https://www.skiarlberg.at",
    district: "Arlberg",
};

export async function parse(options = {}) {
    // TODO: Implement parsing (API not found)
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "skiarlberg.at (Placeholder)");
}
