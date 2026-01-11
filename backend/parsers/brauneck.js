import { fetchHtml, createResult } from "../utils/parserUtils.js";

export const details = {
  id: "brauneck",
  name: "Brauneck-Wegscheid",
  url: "https://www.brauneck-bergbahn.de/de/lift-pistenstatus.html",
};

export async function parse(_options = {}) {
  try {
    const $ = await fetchHtml(details.url);

    const lifts = [];

    // The container has a flat list of divs: 5 headers, then 5 divs per lift
    const $container = $("[class*='Content_list__']");
    const $children = $container.children("div");

    let startIndex = 0;
    $children.each((i, el) => {
      if ($(el).attr("class")?.includes("Header_column__")) {
        startIndex = i + 1;
      }
    });

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
      throw new Error("No lifts found for Brauneck");
    }

    return createResult(details, {
      liftsOpen,
      liftsTotal,
      lifts: lifts,
      slopes: []
    }, "brauneck-bergbahn.de");

  } catch (e) {
    console.error("Brauneck parser error:", e);
    return null; // createResult fallback handled by service
  }
}
