
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "kitzbuehel",
    name: "Kitzbühel (KitzSki)",
    url: "https://www.kitzski.at",
    apiUrl: "https://winter.intermaps.com/kitzski/data?lang=de",
    district: "Kitzbühel"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Kitzbühel Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (KitzSki)');
}
