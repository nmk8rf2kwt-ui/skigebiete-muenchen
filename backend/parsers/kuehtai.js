import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "kuehtai",
    name: "Kühtai",
    url: "https://www.kuehtai.info",
    district: "Innsbruck",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "kuehtai.info (Placeholder)");
}
