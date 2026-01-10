import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "obergurgl_hochgurgl",
    name: "Obergurgl-Hochgurgl",
    url: "https://www.obergurgl.com",
    apiUrl: "https://winter.intermaps.com/obergurgl_hochgurgl/data?lang=de",
    district: "Ötztal"
};

export async function parse(options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Obergurgl Intermaps data');
    }
    return createResult(details.id, data, 'intermaps.com (Obergurgl)');
}
