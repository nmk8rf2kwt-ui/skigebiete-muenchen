import * as cheerio from "cheerio";

export async function spitzingsee() {
  const res = await fetch("https://www.alpenbahnen-spitzingsee.de/de/liftstatus.html", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
  });
  if (!res.ok) throw new Error("Failed to fetch Spitzingsee");
  const html = await res.text();

  // Extract JSON from Next.js hydration script
  // Looking for: self.__next_f.push([1,"..."])
  // The data often comes in chunks. We need to find the chunk containing the list of lifts.
  // Based on analysis, the JSON strings are inside `self.__next_f.push` functions.

  const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
  let matches;
  let liftsTotal = 0;
  let liftsOpen = 0;
  let foundData = false;

  while ((matches = regex.exec(html)) !== null) {
    const content = matches[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

    // Look for lift objects in the string content
    // Pattern: {"disableAggregation": ... "status":1 ... "typename":"..."}

    // We can try to parse chunks that look like JSON arrays or use regex on the dirty string if it's fragmented.
    // Given the fragmentation, regex over the raw string might be safer than trying to reconstruct the full JSON object unless we're careful.

    // Let's look for objects that specifically look like lift definitions
    // "typename":"Schlepplift" or "typename":"4er Sesselbahn" etc.
    // and "status":1 (Open) or "status":2 (Closed)

    // Simplified regex to find lift objects within the big string
    // Note: This is a heuristic.
    const liftRegex = /"id":\d+,"identifier":"[A-Z0-9]+".*?"status":(\d+).*?"typename":"[^"]+"/g;

    let liftMatch;
    while ((liftMatch = liftRegex.exec(content)) !== null) {
      foundData = true;
      const status = parseInt(liftMatch[1], 10);

      liftsTotal++;
      if (status === 1) { // 1 appears to be 'Open' based on previous analysis
        liftsOpen++;
      }
    }
  }

  if (!foundData) {
    // Fallback: try different regex or method if the above fails to find anything.
    // The raw HTML showed the data inside `self.__next_f.push`.
    // It might be encoded.

    // Let's try a simpler approach if the above 0 results:
    // Just search the entire HTML for the pattern since it's inside a script tag anyway.
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
    throw new Error("Spitzingsee parsing returned zero lifts");
  }

  // Extract snow data
  let snow = null;
  const snowRegex = /"snow[^"]*"\s*:\s*"?(\d+)/i;
  const snowMatch = html.match(snowRegex);
  if (snowMatch) {
    snow = `${snowMatch[1]}cm`;
  }

  return {
    resort: "Spitzingsee",
    liftsOpen,
    liftsTotal,
    snow,
    source: "alpenbahnen-spitzingsee.de",
    status: "ok",
    lastUpdated: new Date().toISOString()
  };
}
