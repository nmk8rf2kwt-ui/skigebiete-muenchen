import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "pitztal",
    name: "Pitztaler Gletscher & Rifflsee",
    url: "https://www.pitztaler-gletscher.at",
    apiUrl: "https://winter.intermaps.com/pitztaler_gletscher/data?lang=de",
    district: "Imst"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Pitztal Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Pitztal)');
}
