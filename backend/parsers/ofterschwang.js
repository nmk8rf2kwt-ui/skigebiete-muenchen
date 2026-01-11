import { fetchIntermaps } from "./intermaps.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "ofterschwang",
    name: "Weltcup-Express Ofterschwang-Gunzesried",
    url: "https://www.go-ofterschwang.de",
    apiUrl: "https://winter.intermaps.com/ofterschwang/data?lang=de",
};

export async function ofterschwang() {
    const data = await fetchIntermaps(details.apiUrl);
    return createResult(details, data, "intermaps.com (Ofterschwang)");
}

export const parse = ofterschwang;
