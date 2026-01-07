# 🎯 Zielbild: Skigebiete Master-Datenbank (MDM)

Dieses Dokument beschreibt die zukünftige, skalierbare Datenbank-Architektur ("Zielbild"), um hunderte Skigebiete in DACH (Deutschland, Österreich, Schweiz) und Italien zu verwalten.

## Vision
Weg von einer flachen JSON-Datei (`resorts.json`) hin zu einem **relationalen Modell**, das komplexe Strukturen (Skiverbünde, Teilgebiete) und historische Preisschwankungen abbilden kann.

---

## 🏗️ Entity-Relationship-Modell (ERD)

### 1. `ski_resorts` (Master-Tabelle)
Repräsentiert die logische Einheit / "Marke" eines Skigebiets (z.B. "Ski Juwel", "Zugspitze").

| Spalte | Typ | Beschreibung | Beispiel |
|bbox|---|---|---|
| `id` | TEXT (PK) | Eindeutige ID (slug) | `at_tirol_ski_juwel` |
| `name` | TEXT | Name des Gebiets | "Ski Juwel Alpbachtal Wildschönau" |
| `country_code` | TEXT | ISO 3166-1 alpha-2 | `AT` |
| `region` | TEXT | Bundesland/Kanton | `Tirol` |
| `website` | TEXT | Haupt-Webseite | `https://skijuwel.com` |
| `logo_url` | TEXT | URL zum Logo | |

### 2. `ski_areas` (Physische Teilgebiete)
Ein Skigebiet kann aus mehreren physischen Bergen/Einstiegen bestehen, die geographisch getrennt sind.

| Spalte | Typ | Beschreibung | Beispiel |
|---|---|---|---|
| `id` | TEXT (PK) | Eindeutige ID | `at_alpbach_wiedersbergerhorn` |
| `resort_id` | TEXT (FK) | Verweis auf Resort | `at_tirol_ski_juwel` |
| `name` | TEXT | Name des Teilgebiets | "Wiedersberger Horn" |
| `geo_lat` | NUMERIC | Latitude (Talstation) | `47.398` |
| `geo_lng` | NUMERIC | Longitude (Talstation) | `11.944` |
| `elevation_bottom`| INT | Höhe Tal (m) | `830` |
| `elevation_top` | INT | Höhe Berg (m) | `2025` |
| `piste_km` | NUMERIC | Pistenlänge in diesem Teil | `45.5` |

### 3. `ticket_prices` (Preis-Historie & Varianten)
Ermöglicht komplexe Preismodelle (Saisonzeiten, Altersgruppen) und Analyse der Preisentwicklung über Jahre.

| Spalte | Typ | Beschreibung | Beispiel |
|---|---|---|---|
| `id` | BIGINT (PK) | | |
| `resort_id` | TEXT (FK) | Verweis auf Resort | `at_tirol_ski_juwel` |
| `season_year` | INT | Saison-Jahr (Start) | `2025` (für 25/26) |
| `season_type` | TEXT | Haupt/Neben/Vor | `peak` |
| `category` | TEXT | Adult, Youth, Child | `adult` |
| `price` | NUMERIC | Preis in Währung | `65.50` |
| `currency` | TEXT | Währung | `EUR` |
| `valid_from` | DATE | Gültig ab | `2025-12-20` |
| `valid_to` | DATE | Gültig bis | `2026-03-15` |

---

## 🚀 Migrations-Strategie

### Phase 1: Vorbereitung (Aktuell)
- [x] Bestehende `resorts` Tabelle nutzen (Flat structure).
- [ ] Neue Tabellen (`ski_resorts`, `ski_areas`, `ticket_prices`) in `schema.sql` anlegen (parallel).

### Phase 2: Daten-Anreicherung
- Skripte schreiben, um `resorts.json` in die neuen Tabellen zu migrieren.
- Manuelle Pflege / Import von zusätzlichen Daten (Regionen, Teilgebiete) für die Top 50 Resorts.

### Phase 3: Backend-Umstellung
- Backend liest primär aus `ski_resorts` statt `resorts.json`.
- `resorts.json` wird nur noch als "Seeding-Quelle" oder gar nicht mehr genutzt.
- APIs liefern aggregierte Daten (z.B. Summe der Pistenkilometer aller `ski_areas` eines Resorts).

---

## Skalierungs-Potenzial
Mit diesem Modell können wir problemlos:
- **1000+ Resorts** verwalten.
- **Komplexe Verbünde** abbilden (z.B. Dolomiti Superski als "Meta-Resort" mit vielen Child-Resorts).
- **Preisentwicklung** analysieren (Inflation, dynamische Preise).
- **Geo-Features** (Karten-Suche) präziser machen (Einstiegspunkte statt nur 1 Punkt).
