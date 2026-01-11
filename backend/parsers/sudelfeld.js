import { fetchHtml, createResult } from "../utils/parserUtils.js";

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

  const lifts = [];
  const slopes = [];

  // Intermaps structure for Sudelfeld:
  // Usually 2 .row.infra elements. 
  // 1st = Lifts
  // 2nd = Slopes
  const infraRows = $(".row.infra");

  if (infraRows.length === 0) {
    throw new Error("No lift rows found in Intermaps iframe");
  }

  // Helper to process a container and add to target array
  const processItems = (container, TypeEnum, targetArray) => {
    // The items are direct divs inside .col-xs-12 inside the row, OR just deep find divs with img inside main row
    // Based on debug HTML: <div class="col-xs-12 cols-3"> <div>...</div> </div>
    // Let's select the inner divs.
    const items = $(container).find(".col-xs-12 > div");

    items.each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim(); // clean name
      const name = text.replace(/\s+/g, " ").trim();

      const imgs = $el.find("img").map((_, img) => $(img).attr("src")).get();
      // Check status icons
      const isOpen = imgs.some(src => src.includes("169.png"));
      const isClosed = imgs.some(src => src.includes("94.png")); // Red X
      // Sometimes 162.png (yellow?) -> check later. For now open/closed.

      let status = "unknown";
      if (isOpen) status = "open";
      else if (isClosed) status = "closed";

      if (name) {
        targetArray.push({
          name: name,
          status: status
        });
      }
    });
  };

  // Process Lifts (Row 0)
  if (infraRows.length > 0) processItems(infraRows.eq(0), "lift", lifts);

  // Process Slopes (Row 1) - If it exists and looks like slopes
  if (infraRows.length > 1) processItems(infraRows.eq(1), "slope", slopes);

  // Stats
  const liftsOpen = lifts.filter(l => l.status === "open").length;
  const liftsTotal = lifts.length;

  if (liftsTotal === 0) {
    throw new Error("Sudelfeld parsing returned zero lifts");
  }

  return createResult(details, { liftsOpen, liftsTotal, lifts, slopes }, "sudelfeld.de (Intermaps)");
}
