import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "zugspitze",
    name: "Zugspitze",
    url: "https://zugspitze.de/de/Zugspitze",
    district: "Garmisch-Partenkirchen",
};

export async function parse(_options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "zugspitze.de (Placeholder)");
}
