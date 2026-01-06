import { fetchHtml, createResult } from "../utils/parserUtils.js";

export const details = {
    id: "ehrwald",
    name: "Ehrwalder Almbahn",
    url: "https://www.almbahn.at/de/winter/skigebiet/anlagen-pisten/",
    district: "Tiroler Zugspitz Arena",
};

export async function parse(options = {}) {
    const $ = await fetchHtml(details.url, options);

    let liftsTotal = 0;
    let liftsOpen = 0;

    // Selector based on agent findings:
    // Container usually has title and status as children or descendants
    // .style-facility__title
    // .style-facility__status > .style-facility__status-open / -closed matches

    // We can iterate over titles, find parent, then find status
    $(".style-facility__title").each((i, el) => {
        const name = $(el).text().trim();
        const row = $(el).closest(".style-facility, li, div"); // Robust parenting

        // Find status indicator
        const statusContainer = row.find(".style-facility__status");

        // Check for specific modifier classes on the status container or its children
        // The agent said: "class style-facility__status-open" exists.
        // It might be ON the status div or a Child.
        const hasOpenClass = statusContainer.find(".style-facility__status-open").length > 0 || statusContainer.hasClass("style-facility__status-open");
        const hasClosedClass = statusContainer.find(".style-facility__status-closed").length > 0 || statusContainer.hasClass("style-facility__status-closed");
        const hasPendingClass = statusContainer.find(".style-facility__status-pending").length > 0 || statusContainer.hasClass("style-facility__status-pending");

        // Determine status
        let status = "unknown";
        if (hasOpenClass) status = "open";
        else if (hasClosedClass) status = "closed";
        else if (hasPendingClass) status = "scheduled";

        if (name && (status === "open" || status === "closed")) {
            // Heuristic: Filter out Pistes if they are mixed in?
            // Usually lifts have specific names. "Ganghofer 6er" vs "Skiweg"
            // But let's count everything for now to be safe, or filter "Abfahrt"
            liftsTotal++;
            if (status === "open") liftsOpen++;
        }
    });

    if (liftsTotal === 0) {
        throw new Error("Ehrwald parsing returned zero lifts");
    }

    return createResult(details.id, { liftsOpen, liftsTotal }, "almbahn.at");
}
