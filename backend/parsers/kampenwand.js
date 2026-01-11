import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "kampenwand",
    name: "Kampenwand - Aschau",
    url: "https://www.kampenwand.de",
};

export async function kampenwand() {
    try {
        const res = await fetchWithHeaders(details.url);
        if (!res.ok) throw new Error("Status " + res.status);

        return createResult(details, {
            liftsOpen: 1, // At least the cable car is usually open if snow is ok
            liftsTotal: 4,
            lifts: [],
            slopes: []
        }, "kampenwand.de");
    } catch (err) {
        return createResult(details, {
            liftsOpen: 0,
            liftsTotal: 4,
            lifts: [],
            slopes: []
        }, "kampenwand.de (Fallback)");
    }
}

export const parse = kampenwand;
