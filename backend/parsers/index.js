// New Resorts
import { parse as winterberg } from "./winterberg.js";
import { parse as todtnauberg } from "./todtnauberg.js";
import { parse as feldberg } from "./feldberg.js";
import { parse as arber } from "./arber.js";
import { parse as fichtelberg } from "./fichtelberg.js";
import { parse as wurmberg } from "./wurmberg.js";
import { parse as zillertal_arena } from "./zillertal_arena.js";
import { parse as mayrhofen } from "./mayrhofen.js";
import { parse as hintertux } from "./hintertux.js";
import { parse as willingen } from "./willingen.js";

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
    winterberg,
    todtnauberg,
    feldberg,
    arber,
    fichtelberg,
    wurmberg,
    zillertal_arena,
    mayrhofen,
    hintertux,
    willingen,
};
