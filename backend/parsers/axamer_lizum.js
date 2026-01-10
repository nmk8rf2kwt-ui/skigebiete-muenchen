import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "axamer_lizum",
    name: "Axamer Lizum",
    url: "https://www.axamer-lizum.at",
    apiUrl: "https://winter.intermaps.com/axamer_lizum/data?lang=de",
    district: "Innsbruck"
};

export async function parse(options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Axamer Lizum Intermaps data');
    }
    return createResult(details.id, data, 'intermaps.com (Axamer Lizum)');
}
