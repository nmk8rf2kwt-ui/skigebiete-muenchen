
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

const URL = "https://winter.intermaps.com/salzkammergut/data?lang=de";

async function fetchSalzkammergutData() {
    return await fetchIntermaps(URL);
}

function filterByKeywords(data, keywords) {
    if (!data || !data.lifts) return { lifts: [], slopes: [] };

    const lifts = data.lifts.filter(lift => {
        return keywords.some(kw => lift.name.toLowerCase().includes(kw.toLowerCase()));
    });

    // Slopes might not be strictly linkable by name if they are generic "Abfahrt", 
    // but usually in these feeds they share a prefix or distinct ID range.
    // For now, filtering slopes by similar keywords in title.
    const slopes = data.slopes ? data.slopes.filter(slope => {
        return keywords.some(kw => slope.name.toLowerCase().includes(kw.toLowerCase()));
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

export async function parseLoser() {
    const data = await fetchSalzkammergutData();
    // Keywords based on dump: "Loser", "Sandling"
    const filtered = filterByKeywords(data, ["Loser", "Sandling", "L3", "L4", "L5", "L7", "S1"]);
    return createResult({ id: "loser", name: "Loser - Altaussee" }, filtered, "intermaps.com (Salzkammergut)");
}

export async function parseFeuerkogel() {
    const data = await fetchSalzkammergutData();
    const filtered = filterByKeywords(data, ["Feuerkogel", "Gruber", "Edeltal"]);
    return createResult({ id: "feuerkogel", name: "Feuerkogel" }, filtered, "intermaps.com (Salzkammergut)");
}

export async function parseKrippenstein() {
    const data = await fetchSalzkammergutData();
    const filtered = filterByKeywords(data, ["Krippenstein", "Dachstein"]);
    return createResult({ id: "dachstein_krippenstein", name: "Dachstein Krippenstein" }, filtered, "intermaps.com (Salzkammergut)");
}

export async function parseZwoelferhorn() {
    const data = await fetchSalzkammergutData();
    const filtered = filterByKeywords(data, ["12er Horn", "12er-Horn"]);
    return createResult({ id: "zwoelferhorn", name: "Zwölferhorn" }, filtered, "intermaps.com (Salzkammergut)");
}

export async function parseGaissauHintersee() {
    const data = await fetchSalzkammergutData();
    const filtered = filterByKeywords(data, ["Hintersee", "Spielberg", "Gaissau", "Latschenalm"]);
    return createResult({ id: "gaissau_hintersee", name: "Gaissau-Hintersee" }, filtered, "intermaps.com (Salzkammergut)");
}
