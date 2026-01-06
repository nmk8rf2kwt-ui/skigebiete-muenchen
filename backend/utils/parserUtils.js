
import * as cheerio from "cheerio";
import { fetchWithHeaders } from "./fetcher.js";

/**
 * Standardized status codes for parsers
 */
export const STATUS = {
    LIVE: "live",
    STATIC: "static_only",
    ERROR: "error",
    CLOSED: "closed"
};

/**
 * Standardized fetch and parse function using Cheerio
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options (headers, signal, etc.)
 * @returns {Promise<cheerio.CheerioAPI>} Loaded Cheerio instance
 */
export async function fetchHtml(url, options = {}) {
    try {
        const res = await fetchWithHeaders(url, options);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} fetching ${url}`);
        }
        const html = await res.text();
        return cheerio.load(html);
    } catch (error) {
        throw new Error(`Fetch failed for ${url}: ${error.message}`);
    }
}

/**
 * Helper to extract number from a string, e.g. "12/15 lifts" -> 12
 * Returns 0 if not found.
 */
export function extractNumber(text) {
    if (!text) return 0;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
}

/**
 * Helper to build a standard success result
 */
export function createResult(resortId, data, source) {
    return {
        id: resortId,
        ...data, // liftsOpen, liftsTotal, snow, etc.
        status: STATUS.LIVE,
        source: source,
        lastUpdated: new Date().toISOString()
    };
}
