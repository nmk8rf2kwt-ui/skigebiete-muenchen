import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: 'obertauern',
    name: 'Obertauern',
    url: 'https://www.obertauern.com',
    apiUrl: 'https://winter.intermaps.com/obertauern/data?lang=de',
    district: 'Salzburg'
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Obertauern Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Obertauern)');
}
