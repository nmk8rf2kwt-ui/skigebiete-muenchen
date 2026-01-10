import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "stubaier_gletscher",
    name: "Stubaier Gletscher",
    url: "https://www.stubaier-gletscher.com",
    apiUrl: "https://winter.intermaps.com/stubaier_gletscher/data?lang=de",
    district: "Innsbruck-Land"
};

export async function parse(options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Stubaier Gletscher Intermaps data');
    }
    return createResult(details.id, data, 'intermaps.com (Stubai)');
}
