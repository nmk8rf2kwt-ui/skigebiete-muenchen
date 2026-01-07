import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "hochkoenig",
    name: "Hochkönig",
    url: "https://www.hochkoenig.at",
    district: "Salzburger Land",
};

export async function parse(_options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "hochkoenig.at (Placeholder)");
}
