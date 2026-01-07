import { fetchWithHeaders } from '../utils/fetcher.js';

const candidates = [
    {
        id: "kitzbuehel",
        urlLift: "https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter&type=lift",
        urlSlope: "https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter&type=slope"
    },
    {
        id: "wilder-kaiser",
        urlLift: "https://www.skiwelt.at/webapi/micadoweb?api=Micado.Ski.Web/Micado.Ski.Web.IO.Api.FacilityApi/List.api&client=https%3A%2F%2Fsgm.skiwelt.at&lang=de&region=skiwelt&season=winter&typeIDs=1",
        // Try typeIDs=2 for slopes?
        urlSlope: "https://www.skiwelt.at/webapi/micadoweb?api=Micado.Ski.Web/Micado.Ski.Web.IO.Api.FacilityApi/List.api&client=https%3A%2F%2Fsgm.skiwelt.at&lang=de&region=skiwelt&season=winter&typeIDs=2"
    }
];

async function check() {
    console.log("Checking Micado APIs...");
    for (const c of candidates) {
        console.log(`\n--- ${c.id} ---`);
        try {
            console.log("Fetching Lifts...");
            const resL = await fetchWithHeaders(c.urlLift);
            const jsonL = await resL.json();
            const listL = Array.isArray(jsonL) ? jsonL : (jsonL.items || jsonL.facilities || []);
            console.log(`Lifts found: ${listL.length}`);
            if (listL.length > 0) console.log("Sample Lift:", listL[0].name || listL[0].title); // check key

            console.log("Fetching Slopes (Guess)...");
            const resS = await fetchWithHeaders(c.urlSlope);
            const jsonS = await resS.json();
            const listS = Array.isArray(jsonS) ? jsonS : (jsonS.items || jsonS.facilities || []);
            console.log(`Slopes found? ${listS.length}`);
            if (listS.length > 0) console.log("Sample Slope:", listS[0].name || listS[0].title); // check key
        } catch (e) {
            console.log(`❌ Error ${c.id}: ${e.message}`);
        }
    }
}

check();
