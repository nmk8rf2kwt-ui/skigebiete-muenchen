import { spitzingsee } from "./spitzingsee.js";
import { brauneck } from "./brauneck.js";
import { parse as sudelfeld } from "./sudelfeld.js";
import { parse as garmisch } from "./garmisch.js";
import { parse as zugspitze } from "./zugspitze.js";
import { parse as wilderKaiser } from "./wilder-kaiser.js";
import { steinplatte } from "./steinplatte.js";
import { parse as kitzbuehel } from "./kitzbuehel.js";
import { parse as hochkoessen } from "./hochkoessen.js";
import { winklmoos } from "./winklmoos.js";
import { parse as ehrwalderAlmbahn } from "./ehrwald.js";
import { parse as parseLermoos } from "./lermoos.js";
import { parse as parseStJohann } from "./stjohann.js";
import { parse as parseSkiJuwel } from "./skijuwel.js";
import { parse as berwang } from "./berwang.js";
import { parse as bolsterlang } from "./bolsterlang.js";
import { parse as ofterschwang } from "./ofterschwang.js";
import { lofer } from "./lofer.js";
import { seefeld } from "./seefeld.js";
import { hahnenkamm } from "./hahnenkamm.js";
import { oberaudorf } from "./oberaudorf.js";
import { kampenwand } from "./kampenwand.js";
import { balderschwang } from "./balderschwang.js";
import { oberstdorf } from "./oberstdorf.js";
import { oberjoch } from "./oberjoch.js";
import { wendelstein } from "./wendelstein.js";

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
import { parse as soelden } from "./soelden.js";
import { parse as obertauern } from "./obertauern.js";
import { parse as ischgl } from "./ischgl.js";
import { parse as st_anton } from "./st_anton.js";
import { parse as serfaus_fiss_ladis } from "./serfaus_fiss_ladis.js";
import { parse as saalbach } from "./saalbach.js";
import { parse as schladming } from "./schladming.js";
import { parse as hochzillertal_hochfuegen } from "./hochzillertal_hochfuegen.js";
import { parse as kitzsteinhorn } from "./kitzsteinhorn.js";
import { parse as nassfeld } from "./nassfeld.js";
import { parse as obergurgl_hochgurgl } from "./obergurgl_hochgurgl.js";
import { parse as axamer_lizum } from "./axamer_lizum.js";
import { parse as kuehtai } from "./kuehtai.js";
import { parse as stubaier_gletscher } from "./stubaier_gletscher.js";
import { parse as snow_space_salzburg } from "./snow_space_salzburg.js";
import { parse as hochkoenig } from "./hochkoenig.js";
import { parse as silvretta_montafon } from "./silvretta_montafon.js";
import { parse as damuels_mellau } from "./damuels_mellau.js";
import { parse as turracher_hoehe } from "./turracher_hoehe.js";
import { parse as bad_kleinkirchheim } from "./bad_kleinkirchheim.js";
import { parse as kronplatz } from "./kronplatz.js";
import { parse as dolomiti_superski } from "./dolomiti_superski.js";
import { parse as sella_ronda } from "./sella_ronda.js";

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
    bolsterlang,
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
    soelden,
    obertauern,
    ischgl,
    st_anton,
    serfaus_fiss_ladis,
    saalbach,
    schladming,
    hochzillertal_hochfuegen,
    kitzsteinhorn,
    nassfeld,
    obergurgl_hochgurgl,
    axamer_lizum,
    kuehtai,
    stubaier_gletscher,
    snow_space_salzburg,
    hochkoenig,
    silvretta_montafon,
    damuels_mellau,
    turracher_hoehe,
    bad_kleinkirchheim,
    kronplatz,
    dolomiti_superski,
    sella_ronda,
};
