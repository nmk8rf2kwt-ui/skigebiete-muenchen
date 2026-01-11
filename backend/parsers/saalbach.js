import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: 'saalbach',
    name: 'Saalbach Hinterglemm Leogang Fieberbrunn',
    url: 'https://www.saalbach.com',
    apiUrl: 'https://winter.intermaps.com/saalbach_hinterglemm_leogang_fieberbrunn/data?lang=de',
    district: 'Pinzgau'
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Saalbach Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Saalbach)');
}
