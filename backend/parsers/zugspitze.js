import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "zugspitze",
    name: "Zugspitze",
    url: "https://zugspitze.de/de/Zugspitze",
    apiUrl: "https://winter.intermaps.com/zugspitzbahn_garmisch/data?lang=de",
    district: "Garmisch-Partenkirchen"
};

export async function parse(options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Zugspitze Intermaps data');
    }
    // Note: This endpoint returns data for both Garmisch-Classic and Zugspitze.
    // For now, we return the full set as it provides comprehensive status.
    return createResult(details.id, data, 'intermaps.com (Zugspitze-Garmisch)');
}
