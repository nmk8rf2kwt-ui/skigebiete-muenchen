import { fetchIntermaps } from './intermaps.js';
import { createResult } from '../utils/parserUtils.js';

export const details = {
  id: "garmisch",
  name: "Garmisch Classic",
  url: "https://zugspitze.de/de/Garmisch-Classic",
  apiUrl: "https://winter.intermaps.com/zugspitzbahn_garmisch/data?lang=de",
  district: "Garmisch-Partenkirchen"
};

export async function parse(options = {}) {
  const data = await fetchIntermaps(details.apiUrl);
  if (!data) {
    throw new Error('Failed to fetch Garmisch Intermaps data');
  }
  return createResult(details.id, data, 'intermaps.com (Zugspitze-Garmisch)');
}
