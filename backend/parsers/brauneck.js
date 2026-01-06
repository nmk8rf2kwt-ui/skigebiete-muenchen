import { parseIntermapsHtml } from "./intermapsHtml.js";

// New Intermaps URL found via manual verification
const URL = "https://sdds4.intermaps.com/alpenplus/detail_brauneck.aspx";

export async function brauneck() {
  return parseIntermapsHtml("brauneck", URL);
}
// Keep default export for compatibility if needed, but parser index imports named export 'brauneck'?
// Actually parse index imports `brauneck` from `./brauneck.js`.
// But wait, `parsers/index.js` likely does `import { brauneck } from './brauneck.js';`
// Check `utils/parserUtils` or `resortManager`?
// `resortManager` calls `PARSERS[id]`.
// Let's verify `brauneck.js` export. It had `export async function brauneck()`.
// So that matches.
