import { fetchHtml, createResult } from "../utils/parserUtils.js";

export async function parseZugspitzeCommon(resortId, headerText, options = {}) {
    const URL = "https://zugspitze.de/anlagen";
    const $ = await fetchHtml(URL, options);

    const header = $("h2").filter((i, el) => $(el).text().trim() === headerText).first();
    if (header.length === 0) {
        throw new Error(`${headerText} section not found`);
    }

    const section = header.closest("section.facilities-item");

    const parseContainer = (typeFilter) => {
        const container = section.find(".facilities-item__container").filter((i, el) => {
            const title = $(el).find(".facilities-item__title").text().toLowerCase();
            if (typeFilter === "lift") return title.includes("lifte");
            if (typeFilter === "slope") return title.includes("pisten") || title.includes("abfahrten") || title.includes("talabfahrten");
            return false;
        }).first();

        const items = [];
        if (container.length > 0) {
            const rows = container.find(".facilities-item__row");
            rows.each((_, row) => {
                const $row = $(row);
                // Name often contains time in a child div, we want just the text node or trim the rest
                // But .text() grabs children too.
                // Structure: Name \n <div time>...</div>

                // Clone to remove children for text extraction
                const $name = $row.find(".facilities-item__name").clone();
                $name.find(".facilities-item__time").remove();
                const name = $name.text().trim();

                const statusTitle = $row.find(".facilities-item__state").attr("title")?.toLowerCase() || "";

                let status = "unknown";
                if (statusTitle.includes("geöffnet") || statusTitle.includes("offen")) status = "open";
                else if (statusTitle.includes("geschlossen")) status = "closed";

                const type = $row.find(".facilities-item__type").attr("title");

                // Extract operating hours
                const timeDiv = $row.find(".facilities-item__time");
                const operatingHours = timeDiv.length > 0 ? timeDiv.text().trim().replace(/\s*Uhr\s*/g, '').trim() : undefined;

                if (name) {
                    const item = { name, status, type };
                    if (operatingHours) item.operatingHours = operatingHours;
                    items.push(item);
                }
            });
        }
        return items;
    };

    const lifts = parseContainer("lift");
    const slopes = parseContainer("slope");

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0) {
        throw new Error(`${headerText} parsing returned zero lifts`);
    }

    // Snow logic: Fetch from weather page
    let snowData = null;
    try {
        const weatherUrl = "https://zugspitze.de/de/Service-Informationen/Wetter";
        const $weather = await fetchHtml(weatherUrl, options);
        
        // Find the section for this specific resort (Zugspitze or Garmisch-Classic)
        const sections = $weather("h2");
        let targetSection = null;
        
        sections.each((i, el) => {
            const sectionTitle = $weather(el).text().trim();
            if (sectionTitle === headerText) {
                targetSection = $weather(el).closest("section");
            }
        });
        
        if (targetSection && targetSection.length > 0) {
            // Find the snow height container
            const snowContainer = targetSection.find(".weather-item__container").filter((i, el) => {
                return $weather(el).find(".weather-item__title").text().includes("Schneehöhe");
            }).first();
            
            if (snowContainer.length > 0) {
                let mountain = null;
                let valley = null;
                
                // Extract Berg and Tal values
                snowContainer.find(".weather-item__info").each((i, info) => {
                    const title = $weather(info).find(".weather-item__title").text().trim();
                    const valueText = $weather(info).find("div").last().text().trim();
                    const valueMatch = valueText.match(/(\d+)\s*cm/);
                    
                    if (valueMatch) {
                        const value = parseInt(valueMatch[1], 10);
                        if (title === "Berg") mountain = value;
                        if (title === "Tal") valley = value;
                    }
                });
                
                if (mountain !== null || valley !== null) {
                    snowData = {
                        valley: valley,
                        mountain: mountain,
                        state: null,
                        lastSnowfall: null, // Could be extracted if available
                        source: "resort",
                        timestamp: new Date().toISOString()
                    };
                }
            }
        }
    } catch (err) {
        console.error(`Failed to fetch snow data for ${headerText}:`, err.message);
    }

    return createResult(resortId, { liftsOpen, liftsTotal, snow: snowData, lifts, slopes }, "zugspitze.de");
}
