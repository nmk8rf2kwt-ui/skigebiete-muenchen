import { fetchWithHeaders } from '../utils/fetcher.js';

// Try removing type filter
const urlNoFilter = "https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter";

async function check() {
    console.log("Checking Kitzbühel unfiltered...");
    try {
        const res = await fetchWithHeaders(urlNoFilter);
        const json = await res.json();
        const items = json.facilities || [];
        console.log(`Total items found: ${items.length}`);

        // Count types
        const types = {};
        items.forEach(i => {
            const t = i.type || "unknown";
            types[t] = (types[t] || 0) + 1;
        });
        console.log("Types distribution:", types);

        if (items.length > 0) console.log("Sample item:", items[0]);

    } catch (e) {
        console.log(e.message);
    }
}

check();
