import { brauneck } from '../parsers/brauneck.js';

async function debug() {
  try {
    console.log("Fetching Brauneck...");
    // We need to modify brauneck.js temporarily to return HTML or log it, 
    // OR we just fetch the URL directly here to see what we're dealing with.

    const URL = "https://www.brauneck-bergbahn.de/de/lift-pistenstatus.html";
    const res = await fetch(URL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res.text();

    console.log("HTML length:", html.length);

    // Test the regex
    const snowRegex = /"snow[^"]*"\s*:\s*"?(\d+)/i;
    const match = html.match(snowRegex);
    console.log("Regex match:", match);

    // Find where "snow" appears in the text
    const snowIndices = [];
    let regex = /snow/gi;
    let result;
    while ((result = regex.exec(html))) {
      snowIndices.push(result.index);
    }

    console.log(`Found 'snow' at ${snowIndices.length} locations`);

    // Print context around first few matches
    snowIndices.slice(0, 5).forEach(index => {
      const start = Math.max(0, index - 50);
      const end = Math.min(html.length, index + 100);
      console.log(`Context at ${index}:`, html.substring(start, end));
    });

  } catch (err) {
    console.error(err);
  }
}

debug();
