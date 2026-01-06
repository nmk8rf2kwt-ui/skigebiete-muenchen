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

            // Text-based finding because classes are unknown
            // "Schneehöhe Berg" -> next element or nearby text

            // Helper to find value after label
            const findValue = (label) => {
                const el = $snow(`*:contains('${label}')`).last(); // Use last in case of duplicates
                if (el.length) {
                    // Try next sibling or next text node
                    // Data seems to be in simple divs/spans
                    let val = el.next().text().trim();
                    if (!val) val = el.parent().next().text().trim(); // if label is wrapped
                    if (!val) val = el.find('.value').text().trim(); // if structure is complex

                    // Specific fallback for Steinplatte based on MD structure: Looks like Label [newline] Value
                    // If they are siblings strings in standard HTML flow
                    if (!val) {
                        // Traverse forward until text
                        let next = el.next();
                        while (next.length && !next.text().trim()) {
                            next = next.next();
                        }
                        val = next.text().trim();
                    }
                    return val;
                }
                return null;
            };

            const snowDepthStr = findValue("Schneehöhe Berg"); // "50 cm"
            const lastSnowfallDate = findValue("Letzter Schneefall"); // "03.01.2026"
            const snowType = findValue("Schneetyp"); // "griffig"

            if (snowDepthStr) {
                const depth = parseInt(snowDepthStr, 10);

                // Parse Date DD.MM.YYYY
                let lastSnowISO = null;
                if (lastSnowfallDate) {
                    const parts = lastSnowfallDate.split('.');
                    if (parts.length === 3) {
                        // YYYY-MM-DD
                        lastSnowISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                }

                snowData = {
                    valley: null, // Not listed
                    mountain: !isNaN(depth) ? depth : null,
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
