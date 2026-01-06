import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

const URL = "https://www.brauneck-bergbahn.de/de/lift-pistenstatus.html";

export async function brauneck() {
  const res = await fetchWithHeaders(URL);
  if (!res.ok) throw new Error("Failed to fetch Brauneck");

  const html = await res.text();

  // Next.js hydration parsing (same as Spitzingsee)
  const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
  let matches;
  let liftsTotal = 0;
  let liftsOpen = 0;
  let foundData = false;

  while ((matches = regex.exec(html)) !== null) {
    const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

    const liftRegex = /"id":\d+,"identifier":"[A-Z0-9]+".*?"status":(\d+).*?"typename":"[^"]+"/g;

    let liftMatch;
    while ((liftMatch = liftRegex.exec(content)) !== null) {
      foundData = true;
      const status = parseInt(liftMatch[1], 10);

      liftsTotal++;
      if (status === 1) {
        liftsOpen++;
      }
    }
  }

  // Fallback scan
  if (!foundData) {
    const fullHtmlLiftRegex = /"id":\d+,"identifier":"[A-Z0-9]+"[^}]*?"status":(\d+)[^}]*?"typename"/g;
    let fallbackMatch;
    while ((fallbackMatch = fullHtmlLiftRegex.exec(html)) !== null) {
      foundData = true;
      const status = parseInt(fallbackMatch[1], 10);
      liftsTotal++;
      if (status === 1) liftsOpen++;
    }
  }

  if (liftsTotal === 0) {
    throw new Error("Brauneck parsing returned zero lifts");
  }

  // Extract snow data from Next.js hydration
  let snow = null;
  const snowRegex = /"snow[^"]*"\s*:\s*"?(\d+)/i;
  const snowMatch = html.match(snowRegex);
  if (snowMatch) {
    snow = `${snowMatch[1]}cm`;
  }

  return {
    resort: "Brauneck",
    liftsOpen,
    liftsTotal,
    snow,
    source: "brauneck-bergbahn.de",
    status: "ok",
    lastUpdated: new Date().toISOString()
  };
}
