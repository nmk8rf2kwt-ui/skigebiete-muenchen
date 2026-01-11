
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "snow_space_salzburg",
    name: "Snow Space Salzburg",
    url: "https://www.snow-space.com",
    apiUrl: "https://winter.intermaps.com/salzburger_sportwelt/data?lang=de",
    district: "Salzburg"
};

export async function parse(_options = {}) {
    // The feed covers the entire Salzburger Sportwelt.
    // Snow Space Salzburg core is Flachau, Wagrain, St. Johann.
    // We can filter by keywords or just return everything as the "Snow Space" region often implies the whole connected area.
    // Key lifts: Starjet (Flachau), Flying Mozart (Wagrain), Alpendorf (St. Johann).
    // Also Zauchensee, Flachauwinkl, Kleinarl are often considered part of the extended area.
    // For now, filtering for the core resorts to avoid showing Zauchensee lifts if they are distinct in user's mind, 
    // BUT the user asked for "Salzburger Sportwelt / Snow Space Salzburg", so using the full feed is safer/better.

    // HOWEVER, to be precise, let's look for known Snow Space keywords if needed. 
    // The feed dumped earlier showed "Popolo" (Eben), which is separate. 

    // Decision: Return full feed content but label it clearly.
    // Or better: Filter for Flachau/Wagrain/St.Johann/Zauchensee/Flachauwinkl/Kleinarl.

    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Snow Space Salzburg Intermaps data');
    }

    // Optional: Filter if we want to be strict about "Snow Space" vs "Sportwelt"
    // For now, delivering all Sportwelt data for this ID is a good starting point as they are highly connected.
    return createResult(details, data, 'intermaps.com (Salzburger Sportwelt)');
}
