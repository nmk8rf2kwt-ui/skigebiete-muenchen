import * as cheerio from "cheerio";

export async function ehrwalderAlmbahn() {
    const res = await fetch("https://www.almbahn.at/de/service/aktuelles/ehrwalder-alm-heute/", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
    });
    if (!res.ok) throw new Error("Failed to fetch Ehrwald");
    const html = await res.text();

    // Check for Next.js hydration first
    if (html.includes("self.__next_f.push")) {
        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let matches;
        let liftsTotal = 0;
        let liftsOpen = 0;
        let foundData = false;

        while ((matches = regex.exec(html)) !== null) {
            const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const liftRegex = /"id":\d+,"identifier":"[A-Z0-9]+".*?"status":(\d+).*?"typename":"[^"]+"/g;

            let liftMatch;
            while ((liftMatch = liftRegex.exec(content)) !== null) {
                foundData = true;
                const status = parseInt(liftMatch[1], 10);
                liftsTotal++;
                if (status === 1) liftsOpen++;
            }
        }

        if (foundData) {
            return {
                resort: "Ehrwald",
                liftsOpen,
                liftsTotal,
                status: "ok",
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Fallback to Cheerio
    const $ = cheerio.load(html);
    const lifts = $(".swiper-slide.js-facility[data-facility-type='lift']");

    let liftsTotal = 0;
    let liftsOpen = 0;

    lifts.each((_, el) => {
        const $el = $(el);
        const state = $el.attr("data-state");
        liftsTotal++;
        if (state === "1") {
            liftsOpen++;
        }
    });

    if (liftsTotal === 0) {
        throw new Error("Ehrwald parsing returned zero lifts");
    }

    // Try to extract snow data
    let snow = null;
    const snowRegex = /"snow[^"]*":\s*"?(\d+)/i;
    const snowMatch = html.match(snowRegex);
    if (snowMatch) {
        snow = `${snowMatch[1]}cm`;
    }

    return {
        resort: "Ehrwald",
        liftsOpen,
        liftsTotal,
        snow,
        status: "ok",
        source: "almbahn.at",
        lastUpdated: new Date().toISOString()
    };
}
