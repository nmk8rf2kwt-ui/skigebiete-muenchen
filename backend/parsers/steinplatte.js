import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";
import { createResult } from "../utils/parserUtils.js";

export const details = {
    id: "steinplatte",
    name: "Steinplatte - Waidring",
    url: "https://www.steinplatte.tirol/de/liftstatus.html",
};

export async function steinplatte() {
    const [liftsRes, snowRes] = await Promise.all([
        fetchWithHeaders(details.url),
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

        const statusText = $lifts(el).text().trim();
        const status = statusText === "Geöffnet" ? "open" : "closed";

        // Try to find name (usually preceding sibling or parent sibling)
        // This is a rough parser, keeping it as is but wrapping in createResult
        liftsTotal++;
        if (status === "open") liftsOpen++;
    });

    // Parse Snow
    let snowData = null;
    if (snowRes.ok) {
        try {
            const snowHtml = await snowRes.text();
            const $snow = cheerio.load(snowHtml);
            const snowBody = $snow('body').text().replace(/\s+/g, ' ');

            let depth = null;
            let depthMatch = snowBody.match(/Schneehöhe Berg\s*(\d+)\s*cm/i) || snowBody.match(/(\d+)\s*cm\s*Schneehöhe Berg/i);
            if (depthMatch) depth = parseInt(depthMatch[1], 10);

            let lastSnowISO = null;
            let dateMatch = snowBody.match(/Letzter Schneefall\s*(\d{2}\.\d{2}\.\d{4})/i) || snowBody.match(/(\d{2}\.\d{2}\.\d{4})\s*Letzter Schneefall/i);
            if (dateMatch) {
                const parts = dateMatch[1].split('.');
                lastSnowISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            let snowType = null;
            const typeMatch = snowBody.match(/([a-zA-ZäöüÄÖÜ]+)\s*Schneetyp/i) || snowBody.match(/Schneetyp\s*([a-zA-ZäöüÄÖÜ]+)/i);
            if (typeMatch && typeMatch[1] !== "Live" && typeMatch[1].length > 2) snowType = typeMatch[1];

            if (depth !== null) {
                snowData = {
                    valley: null,
                    mountain: depth,
                    state: snowType || null,
                    lastSnowfall: lastSnowISO,
                };
            }
        } catch (e) {
            console.error("Steinplatte Snow Parse Error:", e);
        }
    }

    return createResult(details, {
        liftsOpen,
        liftsTotal,
        snow: snowData,
        lifts: [], // Detailed lifts missing in this rough parser
        slopes: []
    }, "steinplatte.tirol");
}

export const parse = steinplatte;
