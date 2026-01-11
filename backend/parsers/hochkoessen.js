import { fetchHtml, createResult } from "../utils/parserUtils.js";

export const details = {
    id: "hochkoessen",
    name: "Hochkössen",
    url: "https://www.kaiserwinkl.com/de/skiurlaub-tirol/geoeffnete-lifte.html",
    district: "Kitzbühel",
};

export async function parse(options = {}) {
    const $ = await fetchHtml(details.url, options);

    let liftsTotal = 0;
    let liftsOpen = 0;

    // Looking for list items with title and state
    // Classes are hashed like "Title_title__oOG8L"
    // We use partial matching
    const titleElements = $("[class*='Title_title']");

    // Iterate over titles (lift names) and find sibling state
    titleElements.each((i, el) => {
        const name = $(el).text().trim();
        // Assuming the state is in the same row/container
        // Find the closest common container or row then search for State
        const row = $(el).closest("li, div[class*='Content_item']");
        // Need to be loose here if we don't know the exact container class
        // But usually titles are inside a container

        let stateText = "";

        // Try finding state within the parent container
        if (row.length > 0) {
            stateText = row.find("[class*='State_state']").text().trim();
        } else {
            // Fallback: search siblings
            stateText = $(el).parent().find("[class*='State_state']").text().trim();
        }

        const isOpen = stateText.toLowerCase().includes("geöffnet");
        const isClosed = stateText.toLowerCase().includes("geschlossen");

        if (name && (isOpen || isClosed)) {
            // Exclude slopes if possible. Heuristic: Piste usually has "Piste" or number only?
            // But actually users want lifts.
            // If name contains "Piste", skip?
            if (!name.toLowerCase().includes("piste") && !name.toLowerCase().includes("abfahrt")) {
                liftsTotal++;
                if (isOpen) liftsOpen++;
            }
        }
    });

    if (liftsTotal === 0) {
        throw new Error("Hochkössen parsing returned zero lifts");
    }

    return createResult(details, { liftsOpen, liftsTotal }, "kaiserwinkl.com");
}
