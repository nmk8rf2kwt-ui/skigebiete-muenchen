const URL = "https://www.sudelfeld.de/de/liftstatus.html";

import { fetchWithHeaders } from "../utils/fetcher.js";

export async function sudelfeld() {
  const res = await fetchWithHeaders(URL);
  if (!res.ok) throw new Error("Failed to fetch Sudelfeld");

  const html = await res.text();

  // Next.js hydration parsing (Reuse logic)
  const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
  let matches;
  let liftsTotal = 0;
  let liftsOpen = 0;
  let foundData = false;

  while ((matches = regex.exec(html)) !== null) {
    const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    // Sudelfeld uses similar structure
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
    throw new Error("Sudelfeld parsing returned zero lifts");
  }

  // Try to extract snow data
  let snow = null;
  const snowRegex = /"snow[^"]*":\s*"?(\d+)/i;
  const snowMatch = html.match(snowRegex);
  if (snowMatch) {
    snow = `${snowMatch[1]}cm`;
  }

  return {
    resort: "Sudelfeld",
    liftsOpen,
    liftsTotal,
    snow,
    source: "sudelfeld.de",
    status: "ok",
    lastUpdated: new Date().toISOString()
  };
}
