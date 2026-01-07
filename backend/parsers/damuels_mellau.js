import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "damuels_mellau",
    name: "Damüls Mellau",
    url: "https://www.damuels-mellau.at",
    district: "Vorarlberg",
};

export async function parse(_options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "damuels-mellau.at (Placeholder)");
}
