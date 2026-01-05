import * as cheerio from "cheerio";

export async function kitzbuehel() {
    // Updated URL - the old path returned 404
    const res = await fetch("https://www.kitzski.at/de/service/offene-anlagen-pisten", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
    });
    if (!res.ok) throw new Error("Failed to fetch KitzSki");
    const html = await res.text();

    // Check for Next.js hydration
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
                resort: "Kitzbühel",
                liftsOpen,
                liftsTotal,
                status: "ok",
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Fallback to Cheerio
    const $ = cheerio.load(html);
    const listItems = $("[class*='Item_mobileWrapper']");

    let liftsTotal = 0;
    let liftsOpen = 0;

    listItems.each((_, item) => {
        const $li = $(item).closest("li");
        const $statusIcon = $li.find("[class*='State_iconOpen']");
        const $statusClosed = $li.find("[class*='State_iconClosed']");

        if ($statusIcon.length > 0 || $statusClosed.length > 0) {
            liftsTotal++;
            if ($statusIcon.length > 0) {
                liftsOpen++;
            }
        }
    });

    if (liftsTotal === 0) {
        throw new Error("KitzSki parsing returned zero lifts");
    }

    return {
        resort: "Kitzbühel",
        liftsOpen,
        liftsTotal,
        status: "ok",
        lastUpdated: new Date().toISOString()
    };
}
