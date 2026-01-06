import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "silvretta_montafon",
    name: "Silvretta Montafon",
    url: "https://www.silvretta-montafon.at",
    district: "Vorarlberg",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "silvretta-montafon.at (Placeholder)");
}
