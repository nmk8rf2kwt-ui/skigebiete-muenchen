import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "venet",
    name: "Venet Bergbahnen",
    url: "https://www.venet.at",
    apiUrl: "https://winter.intermaps.com/venet/data?lang=de",
    district: "Landeck"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Venet Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Venet)');
}
