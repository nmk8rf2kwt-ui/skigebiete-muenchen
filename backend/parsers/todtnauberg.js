import { createResult } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";
import * as cheerio from "cheerio";

export const details = {
    id: "todtnauberg",
    name: "Todtnauberg",
    url: "https://www.skilifte-todtnauberg.de/aktuelles-2",
    district: "Schwarzwald",
};

export async function parse(options = {}) {
    const url = details.url;
    const res = await fetchWithHeaders(url, options);

    if (!res.ok) {
        throw new Error(`Failed to fetch Todtnauberg: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const lifts = [];

    // Look for accordion titles which contain the lift names and status emojis
    // grep specific: <div class="accordion-title"> ... <h3>✅ Bucklift (Länge 450 m)</h3>
    $(".accordion-title h3").each((i, el) => {
        const text = $(el).text().trim();

        // Check for emojis
        const isOpen = text.includes("✅");
        const isClosed = text.includes("❌");

        let status = "unknown";
        if (isOpen) status = "open";
        else if (isClosed) status = "closed";

        // Extract Name (remove emoji and parentheses if possible, but keeping it simple is fine)
        // "✅ Bucklift (Länge 450 m)" -> "Bucklift"
        let name = text.replace(/[✅❌]/g, "").trim();
        // Optional: remove parens
        name = name.split("(")[0].trim();

        if (name) {
            lifts.push({
                name,
                status,
                type: "lift" // Generic type as it's not easily parseable without more logic
            });
        }
    });

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0) {
        // Fallback: If no accordion items found, maybe the layout changed or selector is wrong.
        // Try searching p tags or div content for specific keywords if this fails.
        // For now, throw error to detect failure.
        throw new Error("Todtnauberg parser found 0 lifts (Selectors might need adjustment)");
    }

    return createResult(details.id, { liftsOpen, liftsTotal, lifts }, "skilifte-todtnauberg.de");
}
