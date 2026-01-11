import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: 'schladming',
    name: 'Schladming-Dachstein (Planai)',
    url: 'https://www.planai.at',
    apiUrl: 'https://winter.intermaps.com/schladming_dachstein/data?lang=de',
    district: 'Steiermark'
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Schladming Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Schladming)');
}
