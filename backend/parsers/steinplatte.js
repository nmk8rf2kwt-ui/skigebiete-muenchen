import * as cheerio from "cheerio";

export async function steinplatte() {
    const res = await fetch("https://www.steinplatte.tirol/de/liftstatus.html", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
    });
    if (!res.ok) throw new Error("Failed to fetch Steinplatte");
    const html = await res.text();
    const $ = cheerio.load(html);

    // Steinplatte uses CSS modules like 'Item-module-scss-module__hY3Vha__mobileWrapper'
    // using identifier [class*='Item-module-scss-module']

    // Specific list container
    const rows = $("[class*='mco-livedata-table__row']");

    let liftsTotal = 0;
    let liftsOpen = 0;

    if (rows.length > 0) {
        rows.each((_, row) => {
            const $row = $(row);
            const name = $row.text().toLowerCase();

            // Filter out non-lift items if any (sometimes pistes are mixed, but usually separate tabs)
            // Checking for "bahn", "lift", "gondel", "sessel"
            if (name.includes("bahn") || name.includes("lift") || name.includes("gondel") || name.includes("sessel")) {
                liftsTotal++;
                // Status: look for check icon or green color or specific class
                const isOpen = $row.find(".fa-check").length > 0 || $row.find(".text-success").length > 0 || $row.html().includes("status-1"); // status-1 often means open in some systems
                if (isOpen) {
                    liftsOpen++;
                }
            }
        });
    } else {
        // Fallback to Intermaps V3 style if they updated
        const items = $("[class*='Item-module-scss-module']");
        items.each((_, item) => {
            liftsTotal++;
            if ($(item).closest("li").find("[class*='iconOpen']").length > 0) {
                liftsOpen++;
            }
        });
    }

    return {
        liftsOpen,
        liftsTotal,
        status: "ok",
        lastUpdated: new Date().toISOString()
    };
}
