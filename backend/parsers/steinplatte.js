import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function steinplatte() {
    const [liftsRes, snowRes] = await Promise.all([
        fetchWithHeaders("https://www.steinplatte.tirol/de/liftstatus.html"),
        fetchWithHeaders("https://www.steinplatte.tirol/de/schneebericht-steinplatte-winklmoosalm.html")
    ]);

    if (!liftsRes.ok) throw new Error("Failed to fetch Steinplatte Lifts");

    // Parse Lifts
    const liftsHtml = await liftsRes.text();
    const $lifts = cheerio.load(liftsHtml);

    let liftsTotal = 0;
    let liftsOpen = 0;

    const states = $lifts("*").filter((i, el) => {
        const t = $lifts(el).text().trim();
        return t === "Geöffnet" || t === "Geschlossen" || t === "Geschlossen (Saisonende)";
    });

    states.each((i, el) => {
        if ($lifts(el).children().length > 0) return;
        liftsTotal++;
        if ($lifts(el).text().trim() === "Geöffnet") {
            liftsOpen++;
        }
    });

    // Parse Snow - only if fetch succeeded, else ignore (graceful degradation)
    let snowData = null;
    if (snowRes.ok) {
        try {
            const snowHtml = await snowRes.text();
            const $snow = cheerio.load(snowHtml);

            // Normalize whitespace for Regex
            const snowBody = $snow('body').text().replace(/\s+/g, ' ');

            // --- Regex Strategy ---
            let depth = null;
            // Matches:
            // 1. "Schneehöhe Berg 50 cm"
            // 2. "50 cm Schneehöhe Berg"
            let depthMatch = snowBody.match(/Schneehöhe Berg\s*(\d+)\s*cm/i) || snowBody.match(/(\d+)\s*cm\s*Schneehöhe Berg/i);

            if (depthMatch) {
                // Determine which group has the digit. Could be index 1 in both cases regexes above.
                depth = parseInt(depthMatch[1], 10);
            }

            // Last Snowfall
            let lastSnowISO = null;
            // Matches:
            // 1. "Letzter Schneefall 03.01.2026"
            // 2. "03.01.2026 Letzter Schneefall"
            let dateMatch = snowBody.match(/Letzter Schneefall\s*(\d{2}\.\d{2}\.\d{4})/i) || snowBody.match(/(\d{2}\.\d{2}\.\d{4})\s*Letzter Schneefall/i);

            if (dateMatch) {
                const parts = dateMatch[1].split('.');
                lastSnowISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            // Snow Type
            // Keep the DOM traversal as backup or just regex
            let snowType = null;
            // "Schneetyp" - usually Value follows Label or precedes it.
            // "griffig Schneetyp" or "Schneetyp griffig"
            // Let's assume the word next to "Schneetyp" that is NOT "Live" or empty
            const typeMatch = snowBody.match(/([a-zA-ZäöüÄÖÜ]+)\s*Schneetyp/i) || snowBody.match(/Schneetyp\s*([a-zA-ZäöüÄÖÜ]+)/i);
            if (typeMatch) {
                const candidate = typeMatch[1];
                // Filter out common UI words if needed
                if (candidate !== "Live" && candidate.length > 2) {
                    snowType = candidate;
                }
            }

            // If regex failed, maybe try the old findValue technique?
            // Re-implement simplified findValue if needed, but regex is usually stronger for "Text Soup"

            if (depth !== null) {
                snowData = {
                    valley: null,
                    mountain: depth,
                    state: snowType || null,
                    lastSnowfall: lastSnowISO,
                    source: "resort",
                    timestamp: new Date().toISOString()
                };
            }
        } catch (e) {
            console.error("Steinplatte Snow Parse Error:", e);
        }
    }

    return {
        liftsOpen,
        liftsTotal,
        snow: snowData,
        status: "ok",
        lastUpdated: new Date().toISOString()
    };
}
