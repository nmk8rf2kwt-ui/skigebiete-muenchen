import { fetchIntermaps } from "./intermaps.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "bolsterlang",
    name: "Hörnerbahn Bolsterlang",
    url: "https://www.hoernerbahn.de",
    apiUrl: "https://winter.intermaps.com/hoernerbahn/data?lang=de",
};

export async function hoernerbahn() {
    const data = await fetchIntermaps(details.apiUrl);
    return createResult(details, data, "intermaps.com (Hoernerbahn)");
}

export const parse = hoernerbahn;
