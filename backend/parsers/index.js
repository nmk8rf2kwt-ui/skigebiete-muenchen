// New Resorts
import { parse as winterberg } from "./winterberg.js";
import { parse as todtnauberg } from "./todtnauberg.js";
import { parse as feldberg } from "./feldberg.js";
import { parse as arber } from "./arber.js";
import { parse as fichtelberg } from "./fichtelberg.js";
import { parse as wurmberg } from "./wurmberg.js";

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
};
