
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "turracher_hoehe",
    name: "Turracher Höhe",
    url: "https://www.turracherhoehe.at",
    apiUrl: "https://winter.intermaps.com/turracher_hoehe/data?lang=de",
    district: "Kärnten / Steiermark"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Turracher Höhe Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Turracher Höhe)');
}
