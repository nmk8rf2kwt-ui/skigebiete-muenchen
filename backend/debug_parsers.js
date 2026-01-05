
import { spitzingsee } from "./parsers/spitzingsee.js";
import { brauneck } from "./parsers/brauneck.js";
import { sudelfeld } from "./parsers/sudelfeld.js";
import { garmisch } from "./parsers/garmisch.js";
import { zugspitze } from "./parsers/zugspitze.js";

const PARSERS = {
    spitzingsee,
    brauneck,
    sudelfeld,
    garmisch,
    zugspitze
};

const target = process.argv[2];

if (!target) {
    console.log("Usage: node debug_parsers.js <parser_name>");
    process.exit(1);
}

const parser = PARSERS[target];

if (!parser) {
    console.error(`Parser '${target}' not found.`);
    process.exit(1);
}

console.log(`Running parser: ${target}...`);

parser()
    .then(data => {
        console.log("✅ Success:");
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
        console.error("❌ Error:");
        console.error(err);
    });
