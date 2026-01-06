import { parseIntermapsHtml } from "./intermapsHtml.js";

const URL = "https://sdds4.intermaps.com/alpenplus/detail_spitzingsee.aspx";

export async function spitzingsee() {
  return parseIntermapsHtml("spitzingsee", URL);
}
