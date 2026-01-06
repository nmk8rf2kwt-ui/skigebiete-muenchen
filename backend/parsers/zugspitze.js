import { parseZugspitzeCommon } from "./zugspitzeCommon.js";

export async function zugspitze(options = {}) {
    return parseZugspitzeCommon("zugspitze", "Zugspitze", options);
}
