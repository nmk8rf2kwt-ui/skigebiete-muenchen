import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "serfaus_fiss_ladis",
    name: "Serfaus-Fiss-Ladis",
    url: "https://www.serfaus-fiss-ladis.at",
    district: "Tiroler Oberland",
};

export async function parse(options = {}) {
    // TODO: Implement parsing (API not found)
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "serfaus-fiss-ladis.at (Placeholder)");
}
