import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "seefeld",
    name: "Seefeld - Rosshütte",
    url: "https://www.rosshuette.at",
};

export async function seefeld() {
    return createResult(details, {
        liftsOpen: 0,
        liftsTotal: 10,
        lifts: [],
        slopes: []
    }, "rosshuette.at (Placeholder)");
}

export const parse = seefeld;
