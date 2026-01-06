import { parse as winterberg } from "./parsers/winterberg.js";
import { parse as todtnauberg } from "./parsers/todtnauberg.js";
import { parse as feldberg } from "./parsers/feldberg.js";

async function test() {
    console.log("--- Testing Winterberg ---");
    try {
        const res = await winterberg();
        console.log(`Winterberg: Open ${res.liftsOpen}/${res.liftsTotal}`);
        console.log("Sample Lift:", res.lifts[0]);
    } catch (e) {
        console.error("Winterberg Failed:", e.message);
    }

    console.log("\n--- Testing Todtnauberg ---");
    try {
        const res = await todtnauberg();
        console.log(`Todtnauberg: Open ${res.liftsOpen}/${res.liftsTotal}`);
        console.log("Sample Lift:", res.lifts[0]);
    } catch (e) {
        console.error("Todtnauberg Failed:", e.message);
    }

    console.log("\n--- Testing Feldberg ---");
    try {
        const res = await feldberg();
        console.log(`Feldberg: Open ${res.liftsOpen}/${res.liftsTotal}`);
        console.log("Sample Lift:", res.lifts[0]);
    } catch (e) {
        console.error("Feldberg Failed:", e.message);
    }
}

test();
