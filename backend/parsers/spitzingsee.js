import { parseIntermapsHtml } from "./intermapsHtml.js";

const URL = "https://sdds4.intermaps.com/alpenplus/detail_spitzingsee.aspx";

export const details = {
  id: "spitzingsee",
  name: "Spitzingsee-Tegernsee",
  url: "https://www.alpenplus.de/spitzingsee/",
};

export async function spitzingsee() {
  return parseIntermapsHtml(details, URL);
}
