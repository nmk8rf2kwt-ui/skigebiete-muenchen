import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: 'soelden',
    name: 'Sölden',
    url: 'https://www.soelden.com',
    apiUrl: 'https://winter.intermaps.com/soelden/data?lang=de',
    district: 'Ötztal'
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Sölden Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Sölden)');
}
