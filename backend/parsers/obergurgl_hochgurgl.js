import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "obergurgl_hochgurgl",
    name: "Obergurgl-Hochgurgl",
    url: "https://www.obergurgl.com",
    district: "Ötztal",
};

export async function parse(options = {}) {
    return createResult(details.id, { liftsOpen: 0, liftsTotal: 0, lifts: [], slopes: [] }, "obergurgl.com (Placeholder)");
}
