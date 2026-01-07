import { fetchHtml } from '../utils/parserUtils.js';
import { fetchWithHeaders } from '../utils/fetcher.js';

async function analyzeDataSources() {
    console.log("=== Analyzing Operating Hours Data Availability ===\n");

    // 1. Intermaps (Sudelfeld)
    console.log("1. Intermaps (Sudelfeld):");
    try {
        const $ = await fetchHtml("https://sdds4.intermaps.com/alpenplus/detail_sudelfeld.aspx");
        const sample = $(".row.infra").first().find(".col-xs-12 > div").first();
        console.log("   Sample HTML:", sample.html()?.substring(0, 300));
        console.log("   Has time info:", sample.html()?.includes("Uhr") || sample.html()?.includes(":"));
    } catch (e) {
        console.log("   Error:", e.message);
    }

    // 2. Zugspitze.de (Garmisch)
    console.log("\n2. Zugspitze.de (Garmisch):");
    try {
        const $ = await fetchHtml("https://zugspitze.de/anlagen");
        const sample = $(".facilities-item__row").first();
        const timeDiv = sample.find(".facilities-item__time");
        console.log("   Has time div:", timeDiv.length > 0);
        if (timeDiv.length > 0) {
            console.log("   Sample time:", timeDiv.text().trim());
        }
    } catch (e) {
        console.log("   Error:", e.message);
    }

    // 3. Micado API (Wilder Kaiser)
    console.log("\n3. Micado API (Wilder Kaiser):");
    try {
        const res = await fetchWithHeaders("https://www.skiwelt.at/webapi/micadoweb?api=Micado.Ski.Web/Micado.Ski.Web.IO.Api.FacilityApi/List.api&client=https%3A%2F%2Fsgm.skiwelt.at&lang=de&region=skiwelt&season=winter&typeIDs=1");
        const data = await res.json();
        const sample = data.items[0];
        console.log("   Has operatingTimes:", !!sample.operatingTimes);
        if (sample.operatingTimes) {
            console.log("   Sample operating time:", JSON.stringify(sample.operatingTimes[0], null, 2));
        }
    } catch (e) {
        console.log("   Error:", e.message);
    }

    // 4. Kitzbühel API
    console.log("\n4. Kitzbühel API:");
    try {
        const res = await fetchWithHeaders("https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter");
        const data = await res.json();
        const sample = data.facilities[0];
        console.log("   Has openingHours:", !!sample.openingHours);
        console.log("   Has operatingDateFrom:", !!sample.operatingDateFrom);
        if (sample.openingHours) {
            console.log("   Sample openingHours:", sample.openingHours);
        }
        if (sample.operatingDateFrom) {
            console.log("   Sample dates:", sample.operatingDateFrom, "to", sample.operatingDateTo);
        }
    } catch (e) {
        console.log("   Error:", e.message);
    }
}

analyzeDataSources();
