import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "damuels_mellau",
    name: "Damüls Mellau",
    url: "https://www.damuels-mellau.at",
    apiUrl: "https://winter.intermaps.com/damuels_mellau_faschina/data?lang=de",
    district: "Bregenzerwald"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Damüls Mellau Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Damüls-Mellau)');
}
