
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "zugspitze",
    name: "Zugspitze",
    url: "https://zugspitze.de",
    apiUrl: "https://winter.intermaps.com/zugspitzplatt/data?lang=de",
    district: "Garmisch-Partenkirchen"
};

export async function parse(_options = {}) {
    // This API provides the lift status for the Zugspitzplatt (Glacier)
    const data = await fetchIntermaps(details.apiUrl);

    if (!data) {
        throw new Error('Failed to fetch Zugspitze Intermaps data');
    }

    return createResult(details, data, 'intermaps.com (Zugspitzplatt)');
}
