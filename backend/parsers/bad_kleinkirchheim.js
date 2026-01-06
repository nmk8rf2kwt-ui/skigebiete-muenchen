import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "bad_kleinkirchheim",
    name: "Bad Kleinkirchheim",
    url: "https://www.badkleinkirchheim.com",
    district: "Kärnten",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "badkleinkirchheim.com (Placeholder)");
}
