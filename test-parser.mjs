
import { steinplatte } from "./backend/parsers/steinplatte.js";

async function test() {
    console.log("Testing Steinplatte Parser...");
    try {
        const result = await steinplatte();
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
