import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "stubaier_gletscher",
    name: "Stubaier Gletscher",
    url: "https://www.stubaier-gletscher.com",
    district: "Stubaital",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "stubaier-gletscher.com (Placeholder)");
}
