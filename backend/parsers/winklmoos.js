import * as cheerio from "cheerio";

export async function winklmoos() {
    const res = await fetch("https://www.winklmoosalm.de/anlagen", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
    });
    if (!res.ok) throw new Error("Failed to fetch Winklmoos");
    const html = await res.text();
    const $ = cheerio.load(html);

    // First table in content seems to be lifts
    // Agent found: tbody tr.text-gray-800
    // Open status: bg-emerald-400

    const rows = $("tbody tr.text-gray-800");

    let liftsTotal = 0;
    let liftsOpen = 0;

    rows.each((_, row) => {
        const $row = $(row);
        // Check openness: find div with bg-emerald-400
        // Note: Tailwind classes might be specific
        const isOpen = $row.find(".bg-emerald-400").length > 0 || $row.find(".bg-emerald-500").length > 0;

        liftsTotal++;
        if (isOpen) {
            liftsOpen++;
        }
    });

    // Fallback if no specific rows found (sometimes dynamic loading)
    if (liftsTotal === 0) {
        // Check if there is a summary text like "12 / 13"
        const text = $("body").text();
        const match = text.match(/Geöffnete Anlagen.*?(\d+)\s*\/\s*(\d+)/i);
        if (match) {
            liftsOpen = parseInt(match[1], 10);
            liftsTotal = parseInt(match[2], 10);
        } else {
            throw new Error("Winklmoos parsed zero lifts");
        }
    }

    return {
        liftsOpen,
        liftsTotal,
        status: "ok",
        lastUpdated: new Date().toISOString()
    };
}
