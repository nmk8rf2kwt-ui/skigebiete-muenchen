import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "hahnenkamm",
    name: "Hahnenkamm - Höfen",
    url: "https://www.bergwelt-hahnenkamm.at",
};

export async function hahnenkamm() {
    return createResult(details, {
        liftsOpen: 0,
        liftsTotal: 5,
        lifts: [],
        slopes: []
    }, "bergwelt-hahnenkamm.at (Placeholder)");
}

export const parse = hahnenkamm;
