import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "hintertux",
    name: "Hintertuxer Gletscher",
    url: "https://www.hintertuxergletscher.at",
    apiUrl: "https://winter.intermaps.com/tux_finkenberg/data?lang=de",
    district: "Zillertal"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Hintertux (Tux-Finkenberg) Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Tux-Finkenberg)');
}
