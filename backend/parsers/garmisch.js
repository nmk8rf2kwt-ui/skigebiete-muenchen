import { parseZugspitzeCommon } from "./zugspitzeCommon.js";

export async function garmisch(options = {}) {
  return parseZugspitzeCommon("garmisch", "Garmisch-Classic", options);
}
