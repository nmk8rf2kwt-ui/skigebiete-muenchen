import { fetchIntermaps } from "./intermaps.js";

export async function hoernerbahn() {
    return await fetchIntermaps("https://winter.intermaps.com/hoernerbahn/data?lang=de");
}

export const parse = hoernerbahn;
