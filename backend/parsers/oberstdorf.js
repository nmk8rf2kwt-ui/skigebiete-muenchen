
import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
    id: "oberstdorf",
    name: "Oberstdorf / Kleinwalsertal",
    url: "https://www.ok-bergbahnen.com",
    apiUrl: "https://winter.intermaps.com/oberstdorf_kleinwalsertal/data?lang=de",
    district: "Oberallgäu"
};

export async function parse(_options = {}) {
    // Note: The API 'oberstdorf_kleinwalsertal' covers Nebelhorn, Fellhorn, Kanzelwand, Walmendingerhorn, Ifen, Söllereck
    // We could filter here or just return everything as "Oberstdorf-Kleinwalsertal"
    const data = await fetchIntermaps(details.apiUrl);
    if (!data) {
        throw new Error('Failed to fetch Oberstdorf Intermaps data');
    }
    return createResult(details, data, 'intermaps.com (Oberstdorf-Kleinwalsertal)');
}
