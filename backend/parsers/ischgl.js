import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "ischgl",
    name: "Ischgl / Samnaun",
    url: "https://www.ischgl.com",
    district: "Paznaun",
};

export async function parse(options = {}) {
    // TODO: Implement parsing (API not found, HTML needs research) or find API
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "ischgl.com (Placeholder)");
}
