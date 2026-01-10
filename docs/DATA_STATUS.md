# Data & Parser Status

This document tracks the integration status of ski resort data sources.

**Last Updated**: 2026-01-10

## 📊 Summary
-   **Total Resorts Configured**: 60
-   **Active Parsers**: 38
-   **Placeholder / Stubbed**: 22

---

## ✅ Active Parsers (Live Data)

These resorts fetch real-time data from external APIs (mostly Intermaps) or Website scraping.

### 🇩🇪 Germany
-   **Alps**: Brauneck, Garmisch, Kampenwand, Oberaudorf, Oberstdorf/Kleinwalsertal, Ofterschwang/Bolsterlang, Spitzingsee, Sudelfeld, Wendelstein, Zugspitze.
-   **Mittelgebirge**: Arber, Feldberg, Fichtelberg, Willingen, Winterberg, Wurmberg.

### 🇦🇹 Austria
-   **Tyrol**: Berwang, Ehrwald, Hahnenkamm, Hochkössen, Hochzillertal, Ischgl, Kitzbühel, Lermoos, Saalbach, Seefeld, Sölden, St. Johann, Steinplatte, Zillertal Arena.
-   **Salzburg**: Lofer, Obertauern, Schladming (Planai).

### 🇮🇹 Italy
-   Kronplatz.

---

## 🚧 Placeholders (No Live Data)

These resorts are configured in the system but currently return **static/empty data** ("0/0 Lifts"). Real parsers need to be implemented for these.

**Priority for Implementation**:
1.  **Stubaier Gletscher** (`stubaier_gletscher.js`)
3.  **Hintertuxer Gletscher** (`hintertux.js`)
4.  **St. Anton am Arlberg** (`st_anton.js`)

**Other Placeholders**:
Axamer Lizum, Bad Kleinkirchheim, Damüls Mellau, Dolomiti Superski, Hochkönig, Kühtai, Mayrhofen, Nassfeld, Obergurgl, Sella Ronda, Serfaus-Fiss-Ladis, Silvretta Montafon, Snow Space Salzburg, Turracher Höhe.

---

## 🛠 Adding a New Parser

1.  Check `backend/parsers/intermaps.js`. Many resorts use the Intermaps JSON API.
2.  Create `backend/parsers/[resort].js`.
3.  Implement `parse()` function returning standard `ResortStatus` object.
4.  Export `details` object.
5.  Register in `backend/parsers/index.js`.
