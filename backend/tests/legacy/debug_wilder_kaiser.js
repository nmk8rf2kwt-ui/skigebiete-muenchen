import { fetchWithHeaders } from '../utils/fetcher.js';

const apiUrl = "https://www.skiwelt.at/webapi/micadoweb?api=Micado.Ski.Web/Micado.Ski.Web.IO.Api.FacilityApi/List.api&client=https%3A%2F%2Fsgm.skiwelt.at&lang=de&region=skiwelt&season=winter&typeIDs=1";

async function check() {
    console.log("Checking Wilder Kaiser API structure...");
    const res = await fetchWithHeaders(apiUrl);
    const data = await res.json();
    const items = data.items || [];

    console.log(`Total items: ${items.length}`);
    if (items.length > 0) {
        console.log("Sample item keys:", Object.keys(items[0]));
        console.log("Sample item:", JSON.stringify(items[0], null, 2));
    }
}

check();
