import * as cheerio from "cheerio";

export async function garmisch() {
  const res = await fetch("https://zugspitze.de/anlagen", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
  });
  if (!res.ok) throw new Error("Failed to fetch Garmisch");
  const html = await res.text();
  const $ = cheerio.load(html);

  let liftsTotal = 0;
  let liftsOpen = 0;

  // Find the header for Garmisch-Classic
  const header = $("h2").filter((i, el) => $(el).text().trim() === "Garmisch-Classic").first();

  if (header.length === 0) {
    throw new Error("Garmisch section not found");
  }

  // Find the parent section
  const section = header.closest("section.facilities-item");

  // Find the container for Lifts
  // There might be multiple containers (Lifte, Pisten, etc.)
  // We look for the one with title "Lifte & Bahnen"
  const container = section.find(".facilities-item__container").filter((i, el) => {
    return $(el).find(".facilities-item__title").text().includes("Lifte");
  }).first();

  if (container.length === 0) {
    // Fallback: take the first container if explicit title match fails
    const rows = section.find(".facilities-item__row");
    if (rows.length === 0) throw new Error("No facilities found for Garmisch");
    // Use these row, hoping they are lifts
  }

  const rows = container.length > 0 ? container.find(".facilities-item__row") : section.find(".facilities-item__row");

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

  // Extract snow data
  let snow = null;
  const snowRegex = /"snow[^"]*"\s*:\s*"?(\d+)/i;
  const snowMatch = html.match(snowRegex);
  if (snowMatch) {
    snow = `${snowMatch[1]}cm`;
  }

  return {
    resort: "Garmisch-Classic",
    liftsOpen,
    liftsTotal,
    snow,
    source: "zugspitze.de",
    status: "ok",
    lastUpdated: new Date().toISOString()
  };
}
