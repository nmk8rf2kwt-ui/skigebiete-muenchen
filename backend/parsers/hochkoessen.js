import * as cheerio from "cheerio";

export async function hochkoessen() {
    // Note: This site uses heavy client-side rendering with no server-side data
    // The HTML returned is mostly empty templates that get populated by JavaScript
    // This makes it impossible to parse without a headless browser
    throw new Error("Hochkoessen uses client-side rendering - parser unavailable");
}
