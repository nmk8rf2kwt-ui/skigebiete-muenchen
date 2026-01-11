
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "lermoos",
    name: "Lermoos / Grubigstein",
    url: "https://www.bergbahnen-langes.at",
    apiUrl: "https://winter.intermaps.com/zugspitz_arena/data?lang=de",
    district: "Zugspitz Arena"
};

export async function parse(_options = {}) {
    const data = await fetchIntermaps(details.apiUrl);
    if (!data || !data.lifts) {
        throw new Error('Failed to fetch Lermoos Intermaps data');
    }

    // Filter for Lermoos / Grubigstein
    const keywords = ["Grubigstein", "Lermoos", "Hochmoos", "Gamsjet", "Familyjet"];

    const lifts = data.lifts.filter(lift => {
        const name = lift.title || lift.name || "";
        return keywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()));
    });

    const filteredData = {
        ...data,
        lifts: lifts,
        liftsOpen: lifts.filter(l => l.status === 'open').length,
        liftsTotal: lifts.length
    };

    return createResult(details, filteredData, 'intermaps.com (Zugspitz Arena)');
}
