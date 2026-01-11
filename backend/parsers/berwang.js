import { fetchIntermaps } from "./intermaps.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "berwang",
    name: "Berwang - Bichlbach",
    url: "https://www.berwang.tirol",
    apiUrl: "https://winter.intermaps.com/berwang/data?lang=de",
};

export async function berwang() {
    const data = await fetchIntermaps(details.apiUrl);
    return createResult(details, data, "intermaps.com (Berwang)");
}

export const parse = berwang;
