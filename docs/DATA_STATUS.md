# Data & Parser Registry

This document tracks the technical implementation details of all ski resort parsers.
**Policy:** When adding a parser, you MUST update this table.

**Last Updated**: 2026-01-10

## 📊 Summary
-   **Total Resorts**: 60
-   **Active**: 39 (Live Data)
-   **Placeholders**: 21 (Needs Implementation)

---

## 🟢 Type A: JSON APIs (Gold Standard)
*Robust, machine-readable data. Low maintenance.*

| Resort | Parser File | Source URL (Endpoint) |
|:-------|:------------|:----------------------|
| **Arber** | `arber.js` | `winter.intermaps.com/arber` |
| **Axamer Lizum** | `axamer_lizum.js` | `winter.intermaps.com/axamer_lizum` |
| **Berwang** | `berwang.js` | `winter.intermaps.com/berwang` |
| **Bolsterlang** | `bolsterlang.js` | `winter.intermaps.com/bolsterlang` |
| **Damüls Mellau** | `damuels_mellau.js` | `winter.intermaps.com/damuels_mellau_faschina` |
| **Feldberg** | `feldberg.js` | `liftverbund-feldberg.de` (Liftstars) |
| **Fichtelberg** | `fichtelberg.js` | `winter.intermaps.com/fichtelberg` |
| **Garmisch** | `garmisch.js` | `winter.intermaps.com/zugspitzbahn_garmisch` |
| **Hintertux** | `hintertux.js` | `winter.intermaps.com/tux_finkenberg` |
| **Hochzillertal** | `hochzillertal_hochfuegen.js` | `winter.intermaps.com/hochzillertal` |
| **Hörnerbahn** | `hoerner.js` | `winter.intermaps.com/hoernerbahn` |
| **Ischgl** | `ischgl.js` | `winter.intermaps.com/silvretta_arena` |
| **Kitzsteinhorn** | `kitzsteinhorn.js` | `winter.intermaps.com/kitzsteinhorn` |
| **Kronplatz** | `kronplatz.js` | `winter.intermaps.com/kronplatz` |
| **Kühtai** | `kuehtai.js` | `winter.intermaps.com/innsbruck` (Filtered) |
| **Mayrhofen** | `mayrhofen.js` | `winter.intermaps.com/mayrhofen` |
| **Nassfeld** | `nassfeld.js` | `winter.intermaps.com/nassfeld` |
| **Obergurgl** | `obergurgl_hochgurgl.js` | `winter.intermaps.com/obergurgl_hochgurgl` |
| **Obertauern** | `obertauern.js` | `winter.intermaps.com/obertauern` |
| **Ofterschwang** | `ofterschwang.js` | `winter.intermaps.com/ofterschwang` |
| **Saalbach** | `saalbach.js` | `winter.intermaps.com/saalbach_hinterglemm...` |
| **Schladming** | `schladming.js` | `winter.intermaps.com/schladming` |
| **Silvretta Montafon** | `silvretta_montafon.js` | `winter.intermaps.com/montafon` |
| **Sölden** | `soelden.js` | `winter.intermaps.com/soelden` |
| **Spitzingsee** | `spitzingsee.js` | `winter.intermaps.com/alpenbahnen_spitzingsee` |
| **St. Anton** | `st_anton.js` | `winter.intermaps.com/skiarlberg` |
| **Stubaier Gletscher** | `stubaier_gletscher.js` | `winter.intermaps.com/stubaier_gletscher` |
| **Sudelfeld** | `sudelfeld.js` | `winter.intermaps.com/sudelfeld` |
| **Zillertal Arena** | `zillertal_arena.js` | `winter.intermaps.com/zillertal_arena` |
| **Zugspitze** | `zugspitze.js` | `winter.intermaps.com/zugspitzbahn_garmisch` |
| **Brauneck** | `brauneck.js` | `brauneck-bergbahn.de` |
| **Steinplatte** | `steinplatte.js` | `steinplatte.tirol` |
| **Winklmoos** | `winklmoos.js` | `winklmoosalm.de` |

---

## 🟡 Type B: HTML Scrapers (Silver Standard)
*Extracts data from website DOM. Needs monitoring for layout changes.*

| Resort | Parser File | Source URL (Web) |
|:-------|:------------|:-----------------|
| **Balderschwang** | `balderschwang.js` | `hoernerbahn.de` (Scraped via Proxy) |
| **Ehrwald** | `ehrwald.js` | `almbahn.at` |
| **Hahnenkamm** | `hahnenkamm.js` | `hahnenkamm.com` |
| **Hochkössen** | `hochkoessen.js` | `skikoessen.at` |
| **Kampenwand** | `kampenwand.js` | `kampenwand.de` |
| **Kitzbühel** | `kitzbuehel.js` | `kitzski.at` |
| **Lermoos** | `lermoos.js` | `bergbahnen-langes.at` |
| **Lofer** | `lofer.js` | `skialm-lofer.com` |
| **Oberaudorf** | `oberaudorf.js` | `hocheck.com` |
| **Oberjoch** | `oberjoch.js` | `bergbahnen-hindelang-oberjoch.de` |
| **Oberstdorf** | `oberstdorf.js` | `ok-bergbahnen.com` |
| **Seefeld** | `seefeld.js` | `seefeld.com` |
| **Ski Juwel** | `skijuwel.js` | `skijuwel.com` |
| **Wendelstein** | `wendelstein.js` | `wendelsteinbahn.de` |
| **Zugspitze** | `zugspitze.js` | `zugspitze.de` |

---

## 🔴 Type C: Placeholders (Bronze / To-Do)
*Static stub data. Must be replaced.*

| Priority | Resort | Parser File | Target API / Strategy |
|:---------|:-------|:------------|:----------------------|
| **4** | **Sella Ronda** | `sella_ronda.js` | Dolomiti Superski API |
| **5** | **Dolomiti Superski** | `dolomiti_superski.js` | Dolomiti Superski API |
| - | Bad Kleinkirchheim | `bad_kleinkirchheim.js` | - |
| - | Hochkönig | `hochkoenig.js` | Ski Amade API? |
| - | Serfaus-Fiss-Ladis | `serfaus_fiss_ladis.js` | - |
| - | Snow Space SBG | `snow_space_salzburg.js` | - |
| - | Turracher Höhe | `turracher_hoehe.js` | - |
| - | Winterberg (DE) | `winterberg.js` | Liftstars API? |
| - | Willingen (DE) | `willingen.js` | - |
| - | Wurmberg (DE) | `wurmberg.js` | - |
| - | St. Johann (AT) | `stjohann.js` | - |
| - | Todtnauberg (DE) | `todtnauberg.js` | - |
| - | Winklmoos (DE) | `winklmoos.js` | - |
