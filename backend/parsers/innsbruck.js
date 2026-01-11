
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

const URL = "https://winter.intermaps.com/innsbruck/data?lang=de";

async function fetchInnsbruckData() {
    return await fetchIntermaps(URL);
}

function filterByKeywords(data, keywords) {
    if (!data || !data.lifts) return { lifts: [], slopes: [] };

    const lifts = data.lifts.filter(lift => {
        // Intermaps helper now returns 'name' as best effort from title/popup.title
        // But the raw data might have region_id or distinct names.
        // Let's rely on name keyword matching as proven in Salzkammergut.
        const name = lift.name || "";
        return keywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()));
    });

    const slopes = data.slopes ? data.slopes.filter(slope => {
        const name = slope.name || "";
        return keywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()));
    }) : [];

    return {
        lifts,
        slopes,
        liftsOpen: lifts.filter(l => l.status === 'open').length,
        liftsTotal: lifts.length,
        slopesOpen: slopes.filter(s => s.status === 'open').length,
        slopesTotal: slopes.length
    };
}

export async function parseNordpark() {
    const data = await fetchInnsbruckData();
    const filtered = filterByKeywords(data, ["Nordkette", "Seegrube", "Hafelekar", "Hungerburg"]);
    return createResult({ id: "nordpark", name: "Innsbruck - Nordkette" }, filtered, "intermaps.com (Innsbruck)");
}

export async function parsePatscherkofel() {
    const data = await fetchInnsbruckData();
    const filtered = filterByKeywords(data, ["Patscherkofel", "Heiligwasser", "Espen", "Ochsen"]);
    return createResult({ id: "patscherkofel", name: "Patscherkofel" }, filtered, "intermaps.com (Innsbruck)");
}

export async function parseMutters() {
    const data = await fetchInnsbruckData();
    const filtered = filterByKeywords(data, ["Muttereralm", "Götzner", "Pfriemes", "Almboden"]);
    return createResult({ id: "mutters", name: "Muttereralm" }, filtered, "intermaps.com (Innsbruck)");
}

export async function parseBergeralm() {
    const data = await fetchInnsbruckData();
    const filtered = filterByKeywords(data, ["Bergeralm", "Steinach"]);
    return createResult({ id: "bergeralm", name: "Bergeralm" }, filtered, "intermaps.com (Innsbruck)");
}

export async function parseGlungezer() {
    const data = await fetchInnsbruckData();
    const filtered = filterByKeywords(data, ["Glungezer", "Halsmarter", "Tulfein"]);
    return createResult({ id: "glungezer", name: "Glungezer" }, filtered, "intermaps.com (Innsbruck)");
}

export async function parseSchlick2000() {
    const data = await fetchInnsbruckData();
    const filtered = filterByKeywords(data, ["Schlick", "Kreuzjoch", "Sennjoch", "Galtberg"]);
    return createResult({ id: "schlick_2000", name: "Schlick 2000" }, filtered, "intermaps.com (Innsbruck)");
}

export async function parseOberperfuss() {
    const data = await fetchInnsbruckData();
    const filtered = filterByKeywords(data, ["Rangger", "Peter Anich", "Sulzstich"]);
    return createResult({ id: "oberperfuss", name: "Oberperfuss - Rangger Köpfl" }, filtered, "intermaps.com (Innsbruck)");
}
