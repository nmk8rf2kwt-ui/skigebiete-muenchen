import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resortsPath = path.join(__dirname, 'resorts.json');
const resorts = JSON.parse(fs.readFileSync(resortsPath, 'utf8'));

const updates = {
    // Corrected IDs
    "ski_juwel": "https://www.skijuwel.com/de/winter/webcams",
    "skijuwel": "https://www.skijuwel.com/de/winter/webcams", // Backup

    // Errors
    "steinplatte": "https://www.steinplatte.tirol/de/webcams-steinplatte-waidring-tirol.html",
    "kitzbuehel": "https://www.kitzski.at/de/aktuelle-info/webcams.html",
    "hahnenkamm": "https://bergwelt-hahnenkamm.at/webcam/",
    "lofer": "https://www.skialm-lofer.com/de/wetter/webcams",
    "bolsterlang": "https://www.hoernerbahn.de/webcams/",
    "winterberg": "https://www.skiliftkarussell.de/aktuelles/webcams/",
    "feldberg": "https://www.feldberg-erlebnis.de/webcams",
    "todtnauberg": "https://www.skilifte-todtnauberg.de/webcams/",
    "fichtelberg": "https://fichtelberg-ski.de/wetter-webcams/",

    // Missing
    "wurmberg": "https://www.wurmberg-seilbahn.de/webcams",
    "wendelstein": "https://www.wendelsteinbahn.de/webcams",
    "willingen": "https://www.ettelsberg-seilbahn.de/webcam.php",
    "zillertal_arena": "https://www.zillertalarena.com/info-service/livecams-wetter/livecams/",
    "mayrhofen": "https://www.mayrhofen.at/de/pages/livecams",
    "hintertux": "https://www.hintertuxergletscher.at/webcams",
    "soelden": "https://www.soelden.com/de/live-information/livecams",
    "obertauern": "https://www.obertauern.com/de/webcams.html",
    "ischgl": "https://www.ischgl.com/de/Active/Active-Winter/Webcams",
    "st_anton": "https://www.stantonamarlberg.com/de/service/webcams",
    "serfaus_fiss_ladis": "https://www.serfaus-fiss-ladis.at/de/live-info/webcams",
    "saalbach": "https://www.saalbach.com/de/service/webcams",
    "schladming": "https://www.planai.at/de/aktuelles/webcams",
    "hochzillertal_hochfuegen": "https://www.hochzillertal.com/de/service/webcams",
    "kitzsteinhorn": "https://www.kitzsteinhorn.at/de/service/webcams",
    "nassfeld": "https://www.nassfeld.at/de/Service/Live-aus-der-Region/Webcam",
    "obergurgl_hochgurgl": "https://www.gurgl.com/de/live-information/livecams",
    "axamer_lizum": "https://www.axamer-lizum.at/webcams",
    "kuehtai": "https://www.kuehtai.info/livecams",
    "stubaier_gletscher": "https://www.stubaier-gletscher.com/de/service/webcams",
    "snow_space_salzburg": "https://www.snow-space.com/de/winter/informationen-skigebiet/live/webcams",
    "hochkoenig": "https://www.hochkoenig.at/de/winter/skigebiet/webcams.html",
    "silvretta_montafon": "https://www.silvretta-montafon.at/de/service/webcams",
    "damuels_mellau": "https://www.damuels-mellau.at/de/webcams-damuels-mellau.html",
    "turracher_hoehe": "https://www.turracherhoehe.at/de/aktuelles/wetterbericht",
    "bad_kleinkirchheim": "https://www.badkleinkirchheim.com/de/webcams/",
    "kronplatz": "https://www.kronplatz.com/de/service/webcams",
    "dolomitisuperski": "https://www.dolomitisuperski.com/de/live-info/webcams",
    "sella_ronda": "https://www.valgardena.it/de/webcams/"
};

let updatedCount = 0;
const newResorts = resorts.map(r => {
    if (updates[r.id]) {
        if (r.webcam !== updates[r.id]) {
            console.log(`Updating ${r.id}: ${updates[r.id]}`);
            updatedCount++;
            return { ...r, webcam: updates[r.id] };
        }
    }
    return r;
});

if (updatedCount > 0) {
    fs.writeFileSync(resortsPath, JSON.stringify(newResorts, null, 4));
    console.log(`✅ Updated ${updatedCount} webcam links in resorts.json`);
} else {
    console.log(`Feature up to date. No changes needed.`);
}
