import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function zugspitze() {
    const res = await fetchWithHeaders("https://zugspitze.de/anlagen");
    if (!res.ok) throw new Error("Failed to fetch Zugspitze");
    const html = await res.text();
    const $ = cheerio.load(html);

    // Locate the Zugspitze section by text in h2
    const header = $("h2").filter((i, el) => $(el).text().trim() === "Zugspitze").first();

    if (header.length === 0) {
        throw new Error("Zugspitze section not found");
    }

    // The container is the parent section
    const section = header.closest("section.facilities-item");

    const container = section.find(".facilities-item__container").filter((i, el) => {
        return $(el).find(".facilities-item__title").text().includes("Lifte");
    }).first();

    const rows = container.length > 0 ? container.find(".facilities-item__row") : section.find(".facilities-item__row");

    let liftsTotal = 0;
    let liftsOpen = 0;

    rows.each((_, row) => {
        const statusEl = $(row).find(".facilities-item__state");
        const statusTitle = statusEl.attr("title")?.toLowerCase() || "";
        const statusText = statusEl.text().toLowerCase();

        // Check for open status
        if (statusTitle.includes("geöffnet") || statusTitle.includes("offen") || statusText.includes("geöffnet")) {
            liftsOpen++;
        }
        liftsTotal++;
    });

    if (liftsTotal === 0) {
        throw new Error("Zugspitze parsing returned zero lifts");
    }

    return {
        resort: "Zugspitze",
        liftsOpen,
        liftsTotal,
        status: "ok",
        lastUpdated: new Date().toISOString()
    };
}
