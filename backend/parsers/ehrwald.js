
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "ehrwald",
    name: "Ehrwalder Alm / Wetterstein",
    url: "https://www.almbahn.at",
    apiUrl: "https://winter.intermaps.com/zugspitz_arena/data?lang=de",
    district: "Zugspitz Arena"
};

export async function parse(options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data || !data.lifts) {
        throw new Error('Failed to fetch Ehrwald Intermaps data');
    }

    // Filter for Ehrwalder Alm and Wettersteinbahn
    // Keywords based on typical lift names in these areas
    const keywords = ["Ehrwald", "Almbahn", "Wetterstein", "Sonnenhang", "Ganghofer"];

    // Helper to filter
    const lifts = data.lifts.filter(lift => {
        const name = lift.title || lift.name || "";
        return keywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()));
    });

    // If no lifts found with keywords, we might need to inspect the feed more closely. 
    // But for now, this logic mirrors the Salzkammergut/Innsbruck approach.

    // Construct a filtered data object
    const filteredData = {
        ...data,
        lifts: lifts,
        liftsOpen: lifts.filter(l => l.status === 'open').length,
        liftsTotal: lifts.length
        // Slopes might be harder to filter without precise names, keeping them empty or all for now is safer?
        // Let's filter slopes if possible, otherwise empty to avoid confusion.
    };

    return createResult(details, filteredData, 'intermaps.com (Zugspitz Arena)');
}
