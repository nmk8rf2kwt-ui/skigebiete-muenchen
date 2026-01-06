import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "turracher_hoehe",
    name: "Turracher Höhe",
    url: "https://www.turracherhoehe.at",
    district: "Kärnten/Steiermark",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "turracherhoehe.at (Placeholder)");
}
