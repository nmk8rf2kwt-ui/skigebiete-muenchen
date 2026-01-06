import { fetchIntermaps } from "./intermaps.js";

export async function berwang() {
    return await fetchIntermaps("https://winter.intermaps.com/berwang/data?lang=de");
}
