import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "ischgl",
    name: "Ischgl / Samnaun Silvretta Arena",
    url: "https://www.ischgl.com",
    apiUrl: "https://winter.intermaps.com/silvretta_arena/data?lang=de",
    district: "Paznaun"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Ischgl Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Ischgl)');
}
