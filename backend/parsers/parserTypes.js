
/**
 * Manual mapping of resorts to their parser implementation type.
 * Categories:
 * - 'Intermaps JSON API'
 * - 'SkiWelt Micado API'
 * - 'Zugspitze Common (Bayern-API)'
 * - 'Intermaps HTML Scraping'
 * - 'Individuelles HTML Scraping'
 */

export const PARSER_TYPES = {
    // Intermaps JSON API
    "saalbach": "Intermaps JSON API",
    "schladming": "Intermaps JSON API",
    "obertauern": "Intermaps JSON API",
    "soelden": "Intermaps JSON API",
    "ischgl": "Intermaps JSON API",
    "st_anton": "Intermaps JSON API",
    "serfaus_fiss_ladis": "Intermaps JSON API",
    "kitzsteinhorn": "Intermaps JSON API",
    "obergurgl_hochgurgl": "Intermaps JSON API",
    "hochkoenig": "Intermaps JSON API",
    "snow_space_salzburg": "Intermaps JSON API",
    "hochzillertal_hochfuegen": "Intermaps JSON API",
    "zillertal_arena": "Intermaps JSON API",
    "mayrhofen": "Intermaps JSON API",
    "hintertux": "Intermaps JSON API",
    "nassfeld": "Intermaps JSON API",
    "turracher_hoehe": "Intermaps JSON API",
    "bad_kleinkirchheim": "Intermaps JSON API",
    "kronplatz": "Intermaps JSON API",
    "dolomiti_superski": "Intermaps JSON API",
    "sella_ronda": "Intermaps JSON API",
    "silvretta_montafon": "Intermaps JSON API",
    "damuels_mellau": "Intermaps JSON API",
    "kuehtai": "Intermaps JSON API",
    "axamer_lizum": "Intermaps JSON API",
    "hochoetz": "Intermaps JSON API",
    "st_johann": "Intermaps JSON API",
    "lermoos": "Intermaps JSON API",
    "berwang": "Intermaps JSON API",
    "ehrwald": "Intermaps JSON API",
    "lofer": "Intermaps JSON API", // Might be HTML, check? Usually Intermaps if listed there
    "ofterschwang": "Intermaps JSON API",
    "bolsterlang": "Intermaps JSON API",

    // SkiWelt Micado API
    "wilder-kaiser": "SkiWelt Micado API",
    "kitzbuehel": "SkiWelt Micado API", // Assuming similar platform? Or Intermaps? Kitzbuehel is often Micado/Sitour. Grep said micado.

    // Zugspitze Common (Bayern-API)
    "zugspitze": "Zugspitze Common (Bayern-API)",
    "garmisch": "Zugspitze Common (Bayern-API)",

    // Intermaps HTML Scraping 
    // (Guessing based on common Austrian systems that don't have new JSON yet or we parse HTML)
    "ski_juwel": "Intermaps HTML Scraping",
    "steinplatte": "Intermaps HTML Scraping",
    "hochkoessen": "Intermaps HTML Scraping",
    "winklmoos": "Intermaps HTML Scraping", // Shared with Steinplatte often

    // Individuelles HTML Scraping (Default)
    "brauneck": "Individuelles HTML Scraping",
    "spitzingsee": "Individuelles HTML Scraping",
    "sudelfeld": "Individuelles HTML Scraping",
    "oberaudorf": "Individuelles HTML Scraping",
    "kampenwand": "Individuelles HTML Scraping",
    "wendelstein": "Individuelles HTML Scraping",
    "balderschwang": "Individuelles HTML Scraping",
    "oberstdorf": "Individuelles HTML Scraping",
    "oberjoch": "Individuelles HTML Scraping",
    "feldberg": "Individuelles HTML Scraping",
    "arber": "Individuelles HTML Scraping",
    "willingen": "Individuelles HTML Scraping",
    "winterberg": "Individuelles HTML Scraping",
    "fichtelberg": "Individuelles HTML Scraping",
    "wurmberg": "Individuelles HTML Scraping",

    // Placeholder / Misc
    "stubaier_gletscher": "Not Implemented (Placeholder)"
};

export function getParserType(resortId) {
    return PARSER_TYPES[resortId] || "Individuelles HTML Scraping";
}
