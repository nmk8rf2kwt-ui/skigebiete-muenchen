import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "sella_ronda",
    name: "Sella Ronda",
    url: "https://www.dolomitisuperski.com/en/Experience/Sellaronda",
    district: "Dolomiten",
};

export async function parse(_options = {}) {
    // TODO: Implement using Open Data Hub API (tourism.api.opendatahub.com)
    return createResult(details, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "dolomitisuperski.com (Placeholder)");
}
