import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "snow_space_salzburg",
    name: "Snow Space Salzburg",
    url: "https://www.snow-space.com",
    district: "Salzburger Land",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "snow-space.com (Placeholder)");
}
