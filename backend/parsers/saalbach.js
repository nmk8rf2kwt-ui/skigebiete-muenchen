import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "saalbach",
    name: "Saalbach Hinterglemm",
    url: "https://www.saalbach.com",
    district: "Pinzgau",
};

export async function parse(options = {}) {
    // TODO: Implement parsing (API not found)
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "saalbach.com (Placeholder)");
}
