import { parse as kronplatz } from "./parsers/kronplatz.js";

async function test() {
    console.log("--- Testing Kronplatz ---");
    try {
        const res = await kronplatz();
        console.log(`Kronplatz: Open ${res.liftsOpen}/${res.liftsTotal}`);
    } catch (e) {
        console.error("Kronplatz Failed:", e.message);
    }
}

test();
