import { fetchWithHeaders } from "../utils/fetcher.js";
import * as cheerio from "cheerio";

export const details = {
  id: "sudelfeld",
  name: "Sudelfeld",
  url: "https://www.sudelfeld.de/schneebericht/",
  district: "Miesbach",
};

export async function parse() {
  const URL = details.url;
  const res = await fetchWithHeaders(URL);
  if (!res.ok) throw new Error("Failed to fetch Sudelfeld");

  const html = await res.text();
  const $ = cheerio.load(html);

  const lifts = {};

  // Sudelfeld / AlpenPlus Schneebericht structure
  // Look for the table under "Anlagen Sudelfeld"
  // Usually rows with name and status icon

  $("tr").each((i, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 2) {
      const name = $(cells[0]).text().trim();
      const statusHtml = $(cells[1]).html() || "";

      // Status detection based on icons/images
      const isOpen = statusHtml.includes("l_gr.png") || statusHtml.includes("ampel_gruen") || statusHtml.includes("open");
      const isClosed = statusHtml.includes("l_rt.png") || statusHtml.includes("ampel_rot") || statusHtml.includes("closed");

      if (name && (isOpen || isClosed)) {
        // Filter to ensure it's a lift and not just a text row
        // Most lifts have "bahn", "lift", "sessel" in name, but not always.
        // Length check helps avoid empty rows
        if (name.length > 2) {
          lifts[name] = isOpen ? "open" : "closed";
        }
      }
    }
  });

  const liftsTotal = Object.keys(lifts).length;
  const liftsOpen = Object.values(lifts).filter((s) => s === "open").length;

  if (liftsTotal === 0) {
    throw new Error("Sudelfeld parsing returned zero lifts");
  }

  return {
    lifts: {
      total: liftsTotal,
      open: liftsOpen,
      status: liftsOpen === 0 ? "closed" : liftsOpen === liftsTotal ? "open" : "scheduled",
    },
    lastUpdated: new Date().toISOString(),
  };
}
