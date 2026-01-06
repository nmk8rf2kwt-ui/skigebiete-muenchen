import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "schladming",
    name: "Schladming-Dachstein",
    url: "https://www.planai.at",
    district: "Steiermark",
};

export async function parse(options = {}) {
    // TODO: Implement parsing (API not found)
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "planai.at (Placeholder)");
}
