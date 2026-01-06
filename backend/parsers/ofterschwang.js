import { fetchIntermaps } from "./intermaps.js";

export async function ofterschwang() {
    return await fetchIntermaps("https://winter.intermaps.com/ofterschwang/data?lang=de");
}

export const parse = ofterschwang;
