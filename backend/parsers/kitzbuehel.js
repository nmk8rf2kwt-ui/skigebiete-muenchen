import { fetchWithHeaders } from "../utils/fetcher.js";
import * as cheerio from "cheerio";

export const details = {
  id: "kitzbuehel",
  name: "Kitzbühel",
  url: "https://www.kitzski.at/de/aktuelle-info/kitzski-liftstatus.html",
  district: "Kitzbühel",
};

export async function parse() {
  const URL = details.url;
  const res = await fetchWithHeaders(URL);
  if (!res.ok) throw new Error("Failed to fetch KitzSki");

  const html = await res.text();
  const $ = cheerio.load(html);

  const lifts = {};

  // Generic table parser for KitzSki
  // Look for rows in tables that likely contain lift info
  $("tbody tr").each((i, row) => {
    const name = $(row).find("td").first().text().trim();
    const statusHtml = $(row).html() || "";
    
    // Check key phrases or classes in the row
    // Open: usually indicated by checkmarks, 'open' class, or 'In Betrieb' text if visible
    // Closed: 'closed' class, 'Nicht in Betrieb'
    
    // Heuristic: If we find a green check or specific open class
    const isOpen = statusHtml.includes("icon-check") || statusHtml.includes("open") || statusHtml.includes("status_1") ||  $(row).find(".open").length > 0;
    const isClosed = statusHtml.includes("icon-close") || statusHtml.includes("closed") || statusHtml.includes("status_2") || $(row).find(".closed").length > 0;

    if (name && (isOpen || isClosed)) {
      lifts[name] = isOpen ? "open" : "closed";
    }
  });

  const liftsTotal = Object.keys(lifts).length;
  const liftsOpen = Object.values(lifts).filter((s) => s === "open").length;

  if (liftsTotal === 0) {
    throw new Error("KitzSki parsing returned zero lifts. DOM structure might have changed.");
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
