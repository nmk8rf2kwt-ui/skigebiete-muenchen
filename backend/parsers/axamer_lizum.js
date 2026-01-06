import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "axamer_lizum",
    name: "Axamer Lizum",
    url: "https://www.axamer-lizum.at",
    district: "Innsbruck",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "axamer-lizum.at (Placeholder)");
}
