import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "achensee",
    name: "Achensee Regions (Christlum/Rofan/Karwendel)",
    url: "https://www.achensee.com",
    apiUrls: {
        christlum: "https://winter.intermaps.com/christlum/data?lang=de",
        rofan: "https://winter.intermaps.com/rofan/data?lang=de",
        karwendel: "https://winter.intermaps.com/karwendel_pertisau/data?lang=de"
    },
    district: "Schwaz"
};

export async function parse(_options = {}) {
    const results = await Promise.all(
        Object.values(details.apiUrls).map(url => fetchIntermaps(url))
    );

    const validResults = results.filter(r => r !== null);
    if (validResults.length === 0) {
        throw new Error('Failed to fetch any Achensee Intermaps data');
    }

    const combined = {
        liftsOpen: validResults.reduce((sum, r) => sum + r.liftsOpen, 0),
        liftsTotal: validResults.reduce((sum, r) => sum + r.liftsTotal, 0),
        lifts: validResults.flatMap(r => r.lifts),
        slopes: validResults.flatMap(r => r.slopes),
        lastUpdated: validResults.reduce((latest, r) => {
            if (!latest || new Date(r.lastUpdated) > new Date(latest)) return r.lastUpdated;
            return latest;
        }, null)
    };

    return createResult(details, combined, 'intermaps.com (Achensee Combined)');
}
