import { fetchHtml, createResult, STATUS } from "../utils/parserUtils.js";

export const details = {
  id: "sudelfeld",
  name: "Sudelfeld",
  url: "https://www.sudelfeld.de/schneebericht/",
  iframeUrl: "https://sdds4.intermaps.com/alpenplus/detail_sudelfeld.aspx",
  district: "Miesbach",
};

export async function parse(options = {}) {
  // Use the iframe directly as it contains the data server-side rendered
  const $ = await fetchHtml(details.iframeUrl, options);

  let liftsTotal = 0;
  let liftsOpen = 0;

  // Intermaps structure for Sudelfeld (AlpenPlus)
  const rows = $(".row.infra");

  if (rows.length === 0) {
    throw new Error("No lift rows found in Intermaps iframe");
  }

  rows.each((i, row) => {
    const text = $(row).text().trim();
    const img = $(row).find("img").attr("src") || "";

    // 169.png = Open (Green check)
    // 94.png = Closed (Red X)
    // There might be others like 'scheduled'
    const isOpen = img.includes("169.png");
    const isClosed = img.includes("94.png");

    // Only count if status is clear or text implies lift (to avoid headers)
    // Usually .row.infra IS a facility.
    if (isOpen) {
      liftsOpen++;
      liftsTotal++;
    } else if (isClosed) {
      liftsTotal++;
    }
  });

  if (liftsTotal === 0) {
    throw new Error("Sudelfeld parsing returned zero lifts");
  }

  return createResult(details.id, { liftsOpen, liftsTotal }, "sudelfeld.de (Intermaps)");
}
