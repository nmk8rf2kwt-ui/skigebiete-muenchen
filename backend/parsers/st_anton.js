import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "st_anton",
    name: "St. Anton am Arlberg",
    url: "https://www.skiarlberg.at",
    apiUrl: "https://winter.intermaps.com/skiarlberg/data?lang=de",
    district: "Landeck"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch St. Anton (Ski Arlberg) Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Ski Arlberg)');
}
