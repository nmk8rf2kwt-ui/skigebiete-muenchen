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
  // Unfiltered URL to fetch all facilities
  const apiUrl = "https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter";

  const res = await fetchWithHeaders(apiUrl, options);
  if (!res.ok) throw new Error("Failed to fetch KitzSki API");

  const data = await res.json();
  const facilities = data.facilities || (Array.isArray(data) ? data : []);

  if (facilities.length === 0) {
    throw new Error("KitzSki parsing returned zero items from API");
  }

  const lifts = [];
  const slopes = [];

  facilities.forEach(item => {
    // Check status: 1 = Open
    const isLive = item.operatingState === 1 || item.status === 1 || item.status === "opened";
    const status = isLive ? "open" : (item.operatingState === 2 || item.status === 2 || item.status === "closed" ? "closed" : "unknown");

    const type = item.type || "";
    const name = item.title || item.name || item.identifier;

    // Classification
    if (type.includes("piste") || type.includes("skiroute")) {
      slopes.push({ name, status, type: item.typename || type });
    } else if (
      type.includes("chairlift") ||
      type.includes("ropeway") ||
      type.includes("draglift") ||
      type.includes("conveyor") ||
      type.includes("gondola") ||
      type.includes("cablecar")
    ) {
      lifts.push({ name, status, type: item.typename || type });
    }
    // Ignore huts, parking, webcams
  });

  const liftsOpen = lifts.filter(l => l.status === "open").length;
  const liftsTotal = lifts.length;

  if (liftsTotal === 0) {
    throw new Error("KitzSki parsing returned zero lifts");
  }

  return createResult(details.id, { liftsOpen, liftsTotal, lifts, slopes }, "kitzski.at (API)");
}

