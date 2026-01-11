import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "lofer",
    name: "Almenwelt Lofer",
    url: "https://www.skialm-lofer.com",
};

export async function lofer() {
    return createResult(details, {
        liftsOpen: 0,
        liftsTotal: 10,
        lifts: [],
        slopes: []
    }, "skialm-lofer.com (Placeholder)");
}

export const parse = lofer;
