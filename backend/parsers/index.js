// Re-export all parsers from a single entry point
import { spitzingsee } from "./spitzingsee.js";
import { brauneck } from "./brauneck.js";
import { parse as sudelfeld } from "./sudelfeld.js";
import { garmisch } from "./garmisch.js";
import { zugspitze } from "./zugspitze.js";
import { parse as wilderKaiser } from "./wilder-kaiser.js";
import { steinplatte } from "./steinplatte.js";
import { parse as kitzbuehel } from "./kitzbuehel.js";
import { parse as hochkoessen } from "./hochkoessen.js";
import { winklmoos } from "./winklmoos.js";
import { parse as ehrwalderAlmbahn } from "./ehrwald.js";
import parseLermoos from "./lermoos.js";
import parseStJohann from "./stjohann.js";
import parseSkiJuwel from "./skijuwel.js";
import { berwang } from "./berwang.js";
import { hoernerbahn } from "./bolsterlang.js";
import { ofterschwang } from "./ofterschwang.js";
import { lofer } from "./lofer.js";
import { seefeld } from "./seefeld.js";
import { hahnenkamm } from "./hahnenkamm.js";
import { oberaudorf } from "./oberaudorf.js";
import { kampenwand } from "./kampenwand.js";
import { balderschwang } from "./balderschwang.js";
import { oberstdorf } from "./oberstdorf.js";
import { oberjoch } from "./oberjoch.js";
import { wendelstein } from "./wendelstein.js";

export const PARSERS = {
    spitzingsee,
    brauneck,
    sudelfeld,
    garmisch,
    zugspitze,
    "wilder-kaiser": wilderKaiser,
    steinplatte,
    kitzbuehel,
    hochkoessen,
    winklmoos,
    ehrwald: ehrwalderAlmbahn,
    lermoos: parseLermoos,
    st_johann: parseStJohann,
    ski_juwel: parseSkiJuwel,
    berwang,
    bolsterlang: hoernerbahn,
    ofterschwang,
    lofer,
    seefeld,
    hahnenkamm,
    oberaudorf,
    kampenwand,
    balderschwang,
    oberstdorf,
    oberjoch,
    wendelstein,
};
