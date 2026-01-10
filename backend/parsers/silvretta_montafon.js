import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "silvretta_montafon",
    name: "Silvretta Montafon",
    url: "https://www.silvretta-montafon.at",
    apiUrl: "https://winter.intermaps.com/montafon/data?lang=de",
    district: "Montafon"
};

export async function parse(options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Silvretta Montafon Intermaps data');
    }
    return createResult(details.id, data, 'intermaps.com (Montafon)');
}
