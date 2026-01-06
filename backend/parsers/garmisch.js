import { fetchHtml, createResult } from "../utils/parserUtils.js";

export async function garmisch(options = {}) {
  const $ = await fetchHtml("https://zugspitze.de/anlagen", options);

  let liftsTotal = 0;
  let liftsOpen = 0;

  // Find the header for Garmisch-Classic
  const header = $("h2").filter((i, el) => $(el).text().trim() === "Garmisch-Classic").first();

  if (header.length === 0) {
    throw new Error("Garmisch section not found");
  }

  const section = header.closest("section.facilities-item");
  const container = section.find(".facilities-item__container").filter((i, el) => {
    return $(el).find(".facilities-item__title").text().includes("Lifte");
  }).first();

  const rows = container.length > 0 ? container.find(".facilities-item__row") : section.find(".facilities-item__row");

  if (rows.length === 0) {
    throw new Error("No facilities rows found for Garmisch");
  }

  rows.each((_, row) => {
    const statusEl = $(row).find(".facilities-item__state");
    const statusTitle = statusEl.attr("title")?.toLowerCase() || "";
    const statusText = statusEl.text().toLowerCase();

    // Check if it's open
    if (statusTitle.includes("geöffnet") || statusTitle.includes("offen") || statusText.includes("geöffnet")) {
      liftsOpen++;
    }
    liftsTotal++;
  });

  if (liftsTotal === 0) {
    throw new Error("Garmisch parsing returned zero lifts");
  }

  // Snow: Try to find a structured element first, fallback to regex
  // Looking at source, snow might be in a different section or loaded via JS.
  // The original regex `/"snow[^"]*"\s*:\s*"?(\d+)/i` suggests it was parsing a JS object.
  // We'll keep the regex as it likely targets a specific script tag.
  let snow = null;
  const scriptContent = $("script").map((i, el) => $(el).html()).get().join(" ");
  const snowMatch = scriptContent.match(/"snow[^"]*"\s*:\s*"?(\d+)/i);

  if (snowMatch) {
    snow = `${snowMatch[1]}cm`;
  }

  return createResult("garmisch", { liftsOpen, liftsTotal, snow }, "zugspitze.de");
}
