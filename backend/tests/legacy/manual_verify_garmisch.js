import { fetchHtml } from '../utils/parserUtils.js';

const URL = "https://zugspitze.de/anlagen";

async function verify() {
    console.log("Fetching Zugspitze/Garmisch HTML...");
    const $ = await fetchHtml(URL);

    const headers = ["Garmisch-Classic", "Zugspitze"];

    for (const h of headers) {
        console.log(`\nAnalyzing ${h}...`);
        const header = $("h2").filter((i, el) => $(el).text().trim() === h).first();
        if (header.length === 0) {
            console.log("Header not found!");
            continue;
        }

        const section = header.closest("section.facilities-item");

        // Find Lifts Container
        const liftContainer = section.find(".facilities-item__container").filter((i, el) => {
            return $(el).find(".facilities-item__title").text().includes("Lifte");
        }).first();

        if (liftContainer.length > 0) {
            console.log("Found Lifte container. Sample row HTML:");
            console.log(liftContainer.find(".facilities-item__row").first().html());
        }

        // Find Slopes Container
        const slopeContainer = section.find(".facilities-item__container").filter((i, el) => {
            const title = $(el).find(".facilities-item__title").text();
            return title.includes("Pisten") || title.includes("Abfahrt");
        }).first();

        if (slopeContainer.length > 0) {
            console.log("Found Slopes container. Sample row HTML:");
            console.log(slopeContainer.find(".facilities-item__row").first().html());
        } else {
            console.log("Slopes container not found (looking for Pisten/Abfahrt)");
        }
    }
}

verify();
