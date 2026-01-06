import { createResult, STATUS } from "../utils/parserUtils.js";
import { fetchWithHeaders } from "../utils/fetcher.js";

export const details = {
  id: "kitzbuehel",
  name: "Kitzbühel",
  url: "https://www.kitzski.at/de/aktuelle-info/kitzski-liftstatus.html",
  apiUrl: "https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter&type=lift",
  district: "Kitzbühel",
};

// Helper to map slope type to difficulty
function mapDifficulty(type) {
  if (!type) return undefined;
  const t = type.toLowerCase();
  if (t.includes('easy') || t.includes('leicht')) return 'blue';
  if (t.includes('medium') || t.includes('mittel')) return 'red';
  if (t.includes('difficult') || t.includes('schwer')) return 'black';
  if (t.includes('skiroute') || t.includes('freeride')) return 'freeride';
  return undefined;
}

import * as cheerio from "cheerio";
export async function parse(options = {}) {
  // Unfiltered URL to fetch all facilities
  const liftApiUrl = "https://www.kitzski.at/webapi/micadoweb?api=SkigebieteManager/Micado.SkigebieteManager.Plugin.FacilityApi/ListFacilities.api&extensions=o&client=https%3A%2F%2Fsgm.kitzski.at&lang=de&location=&omitClosed=0&region=kitzski&season=winter";

  // Snow Report Page (Corrected)
  const snowUrl = "https://www.kitzski.at/de/winter/skigebiet-kitzbuehel/schneebericht-kitzski.html";

  // Parallel fetch: API for lifts (JSON) and Website for Snow (HTML)
  // We use Promise.allSettled to ensure lift data success even if snow fails
  const [liftRes, snowRes] = await Promise.allSettled([
    fetchWithHeaders(liftApiUrl, options),
    fetchWithHeaders(snowUrl, options)
  ]);

  if (liftRes.status === "rejected" || !liftRes.value.ok) {
    throw new Error("Failed to fetch KitzSki API");
  }

  const data = await liftRes.value.json();
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

    // Extract operating hours and seasonal dates
    const operatingHours = item.openingHours || undefined;
    const seasonStart = item.operatingDateFrom ? item.operatingDateFrom.split('T')[0] : undefined;
    const seasonEnd = item.operatingDateTo ? item.operatingDateTo.split('T')[0] : undefined;

    // Classification
    if (type.includes("piste") || type.includes("skiroute")) {
      const slope = { name, status, type: item.typename || type };
      if (operatingHours) slope.operatingHours = operatingHours;
      if (seasonStart) slope.seasonStart = seasonStart;
      if (seasonEnd) slope.seasonEnd = seasonEnd;
      // Enhanced metadata
      if (item.length) slope.length = item.length;
      if (item.height) slope.altitudeStart = item.height;
      const difficulty = mapDifficulty(type);
      if (difficulty) slope.difficulty = difficulty;
      slopes.push(slope);
    } else if (
      type.includes("chairlift") ||
      type.includes("ropeway") ||
      type.includes("draglift") ||
      type.includes("conveyor") ||
      type.includes("gondola") ||
      type.includes("cablecar")
    ) {
      const lift = { name, status, type: item.typename || type };
      if (operatingHours) lift.operatingHours = operatingHours;
      if (seasonStart) lift.seasonStart = seasonStart;
      if (seasonEnd) lift.seasonEnd = seasonEnd;
      // Enhanced metadata
      if (item.length) lift.length = item.length;
      if (item.height) lift.altitudeStart = item.height;
      lifts.push(lift);
    }
  });

  const liftsOpen = lifts.filter(l => l.status === "open").length;
  const liftsTotal = lifts.length;

  if (liftsTotal === 0) {
    throw new Error("KitzSki parsing returned zero lifts");
  }

  // --- Parse Snow Data ---
  let snowData = null;
  if (snowRes.status === "fulfilled" && snowRes.value.ok) {
    try {
      const html = await snowRes.value.text();
      const $ = cheerio.load(html);
      const bodyText = $('body').text().replace(/\s+/g, ' ');

      // Regex extraction based on search results:
      // "Pisten-Schneehöhe Berg: 62 cm"
      // "Pisten-Schneehöhe Tal: 42 cm"
      // "Letzter Schneefall: 03.11.2024" (assumption of label) or just date near text

      const mountainMatch = bodyText.match(/Schneehöhe Berg[^\d]*(\d+)\s*cm/i);
      const valleyMatch = bodyText.match(/Schneehöhe Tal[^\d]*(\d+)\s*cm/i);

      // Date match: Look for "Letzter Schneefall"
      const dateMatch = bodyText.match(/Letzter Schneefall\s*(\d{2}\.\d{2}\.\d{4})/i) || bodyText.match(/(\d{2}\.\d{2}\.\d{4})\s*Letzter Schneefall/i);

      let lastSnowISO = null;
      if (dateMatch) {
        const parts = dateMatch[1].split('.');
        lastSnowISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      const mountain = mountainMatch ? parseInt(mountainMatch[1], 10) : null;
      const valley = valleyMatch ? parseInt(valleyMatch[1], 10) : null;

      if (mountain !== null || valley !== null) {
        snowData = {
          valley: valley,
          mountain: mountain,
          state: null, // Could parse "Pistenzustand"
          lastSnowfall: lastSnowISO,
          source: "resort",
          timestamp: new Date().toISOString()
        };
      }

    } catch (e) {
      console.error("KitzSki Snow Parse Error:", e);
    }
  }

  return createResult(details.id, { liftsOpen, liftsTotal, lifts, slopes, snow: snowData }, "kitzski.at (API+Web)");
}

