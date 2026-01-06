import { createResult, STATUS } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";

export const details = {
  id: "kitzbuehel",
  name: "Kitzbühel",
  url: "https://www.kitzski.at/de/aktuelle-info/kitzski-liftstatus.html",
  apiUrl: "https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter&type=lift",
  district: "Kitzbühel",
};

export async function parse(options = {}) {
  const res = await fetchWithHeaders(details.apiUrl, options);
  if (!res.ok) throw new Error("Failed to fetch KitzSki API");

  const data = await res.json();

  // API returns object with 'facilities' array (or sometimes just array?)
  // Agent said: "The response contains a facilities array."
  const facilities = data.facilities || [];

  if (facilities.length === 0) {
    // Sometimes just 'data' is the array? Let's check keys if we fail
    if (Array.isArray(data)) {
      facilities.push(...data);
    }
  }

  let liftsTotal = 0;
  let liftsOpen = 0;

  facilities.forEach(lift => {
    liftsTotal++;
    // status: 1 = Open, 2 = Closed? 
    // Agent said: "status / operatingState: Integer value (1 usually indicates Geöffnet / Open)"
    if (lift.operatingState === 1 || lift.status === 1 || lift.status === "opened") {
      liftsOpen++;
    }
  });

  if (liftsTotal === 0) {
    throw new Error("KitzSki parsing returned zero lifts from API");
  }

  return createResult(details.id, { liftsOpen, liftsTotal }, "kitzski.at (API)");
}
