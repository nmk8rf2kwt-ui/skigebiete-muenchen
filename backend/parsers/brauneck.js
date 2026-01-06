import * as cheerio from "cheerio";
import { fetchWithHeaders } from "../utils/fetcher.js";

export async function brauneck() {
  const url = "https://www.brauneck-bergbahn.de/de/lift-pistenstatus.html";
  try {
    const res = await fetchWithHeaders(url);
    if (!res.ok) throw new Error("Status " + res.status);

    const html = await res.text();
    const $ = cheerio.load(html);

    const lifts = [];

    // The container has a flat list of divs: 5 headers, then 5 divs per lift
    // Structure: Status, Lift Name, Time, Length, Height
    const $container = $("[class*='Content_list__']"); // Use wildcard for partial match if hash changes
    const $children = $container.children("div");

    // The first few are headers. We can identify headers by class or just skip known count.
    // Headers have class "Header_column__..."
    // Let's iterate and skip headers dynamically
    let startIndex = 0;
    $children.each((i, el) => {
      if ($(el).attr("class")?.includes("Header_column__")) {
        startIndex = i + 1;
      }
    });

    // Loop through the rest in chunks of 5
    // 0: Status
    // 1: Name
    // 2: Time
    // 3: Length
    // 4: Height
    for (let i = startIndex; i < $children.length; i += 5) {
      const $statusDiv = $($children[i]);
      const $nameDiv = $($children[i + 1]);

      if (!$statusDiv.length || !$nameDiv.length) break;

      const name = $nameDiv.find("span").text().trim();
      const statusText = $statusDiv.find("[class*='State_label__']").text().trim();

      let status = "closed";
      if (statusText === "Geöffnet") {
        status = "open";
      } else if (statusText === "Geschlossen") {
        status = "closed";
      }

      if (name) {
        lifts.push({
          name: name,
          status: status
        });
      }
    }

    const liftsOpen = lifts.filter(l => l.status === "open").length;
    const liftsTotal = lifts.length;

    if (liftsTotal === 0) {
      return {
        liftsOpen: 0,
        liftsTotal: 0,
        status: "parse_error"
      };
    }

    return {
      liftsOpen,
      liftsTotal,
      status: "open",
      lifts: lifts
    };

  } catch (e) {
    console.error("Brauneck parser error:", e);
    return {
      liftsOpen: 0,
      liftsTotal: 0,
      status: "error"
    };
  }
}
