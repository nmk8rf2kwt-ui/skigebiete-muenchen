# Features & UI Reference

Complete reference for all table columns, data sources, and frontend display logic.

> **Related Documentation:**
> - [README.md](../README.md) - Project overview and features
> - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and data flow
> - [DATABASE.md](DATABASE.md) - Database schema and management
> - [API.md](API.md) - API endpoint reference

## Spaltenübersicht

| Nr. | Spalte | Datentyp | Darstellung | Datenquelle | Status |
|-----|--------|----------|-------------|-------------|--------|
| 1 | Abfragestatus | Enum | Icon (🟢/🟡/🔴) | Live (Parser Status) | ✅ |
| 2 | Skigebiet | String | Text + Link | Statisch (`resorts.json` → `name`, `website`) | ✅ |
| 3 | Distanz | Float | Zahl + "km" | Live (TomTom Matrix API → `traffic.distanceKm`) | ✅ |
| 4 | Fahrzeit (ohne Verkehrslage) | Integer | Zahl + "min" + Link | Statisch (`resorts.json` → `distance`) | ✅ |
| 5 | Fahrzeit (mit Verkehrslage) | Integer | Zahl + "min" (farbig) | Live (TomTom Matrix API → `traffic.duration`) | ✅ |
| 6 | Größe des Skigebiets | Integer | Zahl + "km" | Statisch (`resorts.json` → `piste_km`) | ✅ |
| 7 | Geöffnete Lifte | Fraction | "X/Y" (farbig) | Live (Parser → `liftsOpen`/`liftsTotal`) | ✅ |
| 8 | Preis | Float | "€XX.XX" + Info-Icon | Statisch (`resorts.json` → `price`, `priceDetail`) | ✅ |
| 9 | Schwierigkeitsgrad | Enum | Icon + Text | Statisch (`resorts.json` → `classification`) | ✅ |
| 10 | Schneehöhe | Integer | Zahl + "cm" | Live (Parser/Weather API → `forecast[0].snowDepth`) | ✅ |
| 11 | Letzter Schneefall | Date | Relativer Text | Live (Parser → `lastSnowfall`) | ⚠️ |
| 12 | Wetter (3 Tage) | Array | 3× Icon | Live (Weather API → `forecast[0-2]`) | ✅ |
| 13 | Webcam | URL | Icon (📷) + Link | Statisch (`resorts.json` → `webcam`) | ✅ |
| 14 | Details | Button | Icon (📋) + Modal | Live (Parser → `lifts[]`, `slopes[]`) | ✅ |
| 15 | Historie | Button | Icon (📊) + Modal | Historische DB | ✅ |
| 16 | Score | Integer | Zahl (fett) | Berechnet (Formel in `render.js`) | ✅ |

## Detaillierte Spaltenbeschreibung

### 1. Abfragestatus
- **Datentyp**: Enum (`"live"`, `"static_only"`, `"error"`)
- **Darstellung**: Icon mit Tooltip
  - 🟢 `"live"` = "Live-Daten verfügbar - Aktuelle Informationen vom Skigebiet"
  - 🟡 `"static_only"` = "Nur Basisdaten - Live-Daten werden geladen"
  - 🔴 `"error"` = "Fehler beim Laden - Daten möglicherweise veraltet"
- **Datenquelle**: Parser-Status aus Backend
- **Implementierung**: `render.js` - Zeilen 284-292

### 2. Skigebiet
- **Datentyp**: String
- **Darstellung**: Klickbarer Link (fett formatiert)
  - Format: `<a href="{website}">{name}</a>`
- **Datenquelle**: `resorts.json`
  - `name`: Skigebiet-Name
  - `website`: Offizielle Website-URL
- **Implementierung**: `render.js` - Zeile 345

### 3. Distanz
- **Datentyp**: Float (Kilometer)
- **Darstellung**: Zahl + "km"
  - Format: `XX km` oder `XX.X km`
- **Datenquelle**: TomTom Matrix API
  - Feld: `traffic.distanceKm` oder `distanceKm`
- **Fallback**: "-" wenn keine Daten
- **Implementierung**: `render.js` - Zeilen 396-398

### 4. Fahrzeit (ohne Verkehrslage)
- **Datentyp**: Integer (Minuten)
- **Darstellung**: Zahl + "min" als klickbarer Link
  - Format: `<a href="https://google.com/maps/dir/...">XX min</a>`
  - Link öffnet Google Maps Navigation
- **Tooltip**: Zeigt Talstation-Adresse
- **Datenquelle**: Statisch (`resorts.json`)
  - Feld: `distance` (Standard-Fahrzeit von München)
- **Fallback**: "-" wenn keine Daten verfügbar
- **Implementierung**: `render.js` - Zeilen 156-169

### 5. Fahrzeit (mit Verkehrslage)
- **Datentyp**: Integer (Minuten)
- **Darstellung**: Zahl + "min" mit farblicher Kennzeichnung
  - 🟢 Grün: Keine Verzögerung (delay = 0)
  - 🟡 Gelb: 1-10 min Verzögerung
  - 🟠 Orange: 11-20 min Verzögerung
  - 🔴 Rot: >20 min Verzögerung
- **Tooltip**: "Aktuell: XX min (+Y)" (Y = Verzögerung)
- **Datenquelle**: TomTom Matrix API
  - Feld: `traffic.duration` (Fahrzeit mit Live-Traffic)
- **Berechnung**: `delay = traffic.duration - distance`
- **Fallback**: "n.a." (grau) wenn keine Traffic-Daten
- **Implementierung**: `render.js` - Zeilen 172-195

### 6. Größe des Skigebiets (in km)
- **Datentyp**: Integer (Pistenkilometer)
- **Darstellung**: Zahl + "km"
  - Format: `XX km`
- **Datenquelle**: `resorts.json`
  - Feld: `piste_km`
- **Fallback**: "-" wenn nicht angegeben
- **Implementierung**: `render.js` - Zeile 349

### 7. Geöffnete Lifte (Stand: heute)
- **Datentyp**: Fraction (geöffnet/gesamt)
- **Darstellung**: "X/Y" mit farblicher Kennzeichnung
  - 🟢 Grün: >75% geöffnet
  - 🟡 Gelb: 50-75% geöffnet
  - 🟠 Orange: 25-50% geöffnet
  - 🔴 Rot: <25% geöffnet
- **Spezialfälle**:
  - `"⏳ / Y"` = Daten werden geladen (static_only)
  - `"n.a. ⚠️"` = Fehler beim Laden
- **Datenquelle**: Live-Parser
  - `liftsOpen`: Anzahl geöffneter Lifte
  - `liftsTotal` oder `lifts`: Gesamtanzahl
- **Implementierung**: `render.js` - Zeilen 140-153

### 8. Preis
- **Datentyp**: Float (EUR)
- **Darstellung**: Währung + Info-Icon
  - Format: `€XX.XX ℹ️`
  - Info-Icon zeigt Tooltip mit Details
- **Tooltip-Inhalt** (wenn `priceDetail` vorhanden):
  ```
  Erwachsene: €XX.XX
  Jugend: €XX.XX
  Kinder: €XX.XX
  [Zusatzinfo]
  ```
- **Datenquelle**: `resorts.json`
  - `price`: Hauptpreis (Erwachsene)
  - `priceDetail`: Objekt mit `adult`, `youth`, `child`, `currency`, `info`
- **Fallback**: "-" wenn kein Preis angegeben
- **Implementierung**: `render.js` - Zeilen 127-137

### 9. Schwierigkeitsgrad
- **Datentyp**: Enum
- **Darstellung**: Icon + Text mit Tooltip
- **Mögliche Werte**:
  - 🟢 **Familie**: "Ideal für Anfänger und Familien - breite, flache Pisten"
  - 🟡 **Genuss**: "Landschaftlich reizvoll, entspanntes Skifahren"
  - 🔴 **Sportlich**: "Anspruchsvollere Pisten für Fortgeschrittene und Könner"
  - 🔴 **Großraum**: "Sehr großes Skigebiet mit vielen Pistenkilometern"
  - ⚫ **Gletscher**: "Hochalpines Gletscherskigebiet, absolut schneesicher"
- **Datenquelle**: `resorts.json`
  - Feld: `classification`
- **Implementierung**: `render.js` - Zeilen 294-326

### 10. Schneehöhe (Berg/Tal)
- **Datentyp**: Integer (Zentimeter)
- **Darstellung**: Zahl + "cm"
  - Format: `XX cm` (heute's Schneehöhe am Berg)
- **Datenquelle**: 
  - Primär: Weather API → `forecast[0].snowDepth`
  - Fallback: Parser → `snow`
- **Fallback**: "-" wenn keine Daten oder "n.a." bei Fehler
- **Implementierung**: `render.js` - Zeilen 198-208

### 11. Letzter Schneefall
- **Datentyp**: Date (ISO 8601)
- **Darstellung**: Relativer Text (deutsch)
  - `"heute"` = 0 Tage
  - `"gestern"` = 1 Tag
  - `"vor X Tagen"` = 2-7 Tage
  - `"DD.MM"` = >7 Tage
- **Datenquelle**: Parser
  - Feld: `lastSnowfall` (ISO Date String)
- **Berechnung**: Differenz zwischen heute und `lastSnowfall`
- **Fallback**: "-" wenn keine Daten
- **Status**: ⚠️ Nicht alle Parser liefern diese Daten
- **Implementierung**: `render.js` - Zeilen 211-226

### 12. Aktuelles Wetter (3-Tage-Vorhersage)
- **Datentyp**: Array von Forecast-Objekten
- **Darstellung**: 3 Wetter-Icons nebeneinander
  - Icons: ☀️ 🌤️ ⛅ ☁️ 🌧️ ❄️ 🌫️ ⛈️
- **Tooltip pro Icon**: "Wochentag, DD.MM: Beschreibung, XX°C / YY°C"
  - Beispiel: "Mo, 06.01: Leicht bewölkt, 5°C / -2°C"
- **Datenquelle**: Weather API (Open-Meteo)
  - `forecast[0-2]`: Array mit 3 Tagesprognosen
  - Felder pro Tag: `date`, `weatherEmoji`, `weatherDesc`, `tempMax`, `tempMin`
- **Icon-Ableitung**: Wenn `weatherEmoji` fehlt oder Text enthält, wird Icon aus `weatherDesc` abgeleitet
- **Fallback**: "n.a." bei Fehler, "⏳" wenn Daten laden
- **Implementierung**: `render.js` - Zeilen 229-266

### 13. Webcam
- **Datentyp**: URL
- **Darstellung**: Klickbares Kamera-Icon
  - Format: `<a href="{webcam}">📷</a>`
  - Öffnet in neuem Tab
- **Tooltip**: "Webcam öffnen"
- **Datenquelle**: `resorts.json`
  - Feld: `webcam`
- **Fallback**: "-" wenn keine Webcam verfügbar
- **Implementierung**: `render.js` - Zeilen 335-337

### 14. Details (Lifte & Pisten)
- **Datentyp**: Button (öffnet Modal)
- **Darstellung**: Klickbares Icon
  - Format: `<button>📋</button>`
  - Öffnet Modal mit detaillierter Lift- und Pistenliste
- **Tooltip**: "Lifte & Pisten Details anzeigen"
- **Datenquelle**: Live-Parser
  - `lifts[]`: Array von Lift-Objekten
  - `slopes[]`: Array von Pisten-Objekten
- **Verfügbarkeit**: Nur wenn `lifts` oder `slopes` vorhanden
- **Fallback**: "-" wenn keine Details verfügbar
- **Implementierung**: `render.js` - Zeilen 271-274

### 15. Historie (7-Tage-Verlauf)
- **Datentyp**: Button (öffnet Modal)
- **Darstellung**: Klickbares Icon
  - Format: `<button>📊</button>`
  - Öffnet Modal mit Chart.js-Diagramm
- **Tooltip**: "7-Tage Verlauf anzeigen"
- **Datenquelle**: Historische Datenbank
  - Täglich gespeicherte Daten (6-22 Uhr)
  - Metriken: Lift-Status, Schneehöhe, Verkehrslage
- **Verfügbarkeit**: Nur wenn Koordinaten vorhanden
- **Fallback**: "-" wenn keine Verlaufsdaten
- **Implementierung**: `render.js` - Zeilen 277-279

### 16. Score
- **Datentyp**: Integer (berechnet)
- **Darstellung**: Fett formatierte Zahl
  - Format: `<strong>XX</strong>`
- **Berechnungsformel**:
  ```javascript
  score = (piste_km × 2) + (distance × -0.5) + (price × -0.5) + (liftsOpen × 3)
  ```
- **Gewichtung**:
  - Pistenkilometer: +2 (mehr ist besser)
  - Entfernung: -0.5 (näher ist besser)
  - Preis: -0.5 (günstiger ist besser)
  - Geöffnete Lifte: +3 (mehr ist besser)
- **Datenquelle**: Berechnet aus mehreren Feldern
- **Beispielwerte**: 50-150 (typischer Bereich)
- **Fallback**: "-" wenn Berechnung nicht möglich
- **Implementierung**: `render.js` - Zeilen 2-25, 282
- **Status**: ✅ Vollständig implementiert

## Score-Berechnung

Der Score ist ein berechneter Wert, der die Attraktivität eines Skigebiets basierend auf mehreren Faktoren bewertet.

### Formel

```javascript
score = (piste_km × 2) + (distance × -0.5) + (price × -0.5) + (liftsOpen × 3)
```

### Gewichtungsfaktoren

| Faktor | Gewicht | Begründung |
|--------|---------|------------|
| `piste_km` | **+2** | Mehr Pistenkilometer = besseres Angebot |
| `distance` | **-0.5** | Kürzere Fahrzeit = attraktiver |
| `price` | **-0.5** | Günstigerer Preis = attraktiver |
| `liftsOpen` | **+3** | Mehr geöffnete Lifte = höchste Priorität |

### Berechnungsbeispiele

#### Beispiel 1: Spitzingsee (guter Tag)
```javascript
piste_km = 20
distance = 60 min
price = 49.50 €
liftsOpen = 8

score = (20 × 2) + (60 × -0.5) + (49.50 × -0.5) + (8 × 3)
      = 40 + (-30) + (-24.75) + 24
      = 9.25
      ≈ 9
```

#### Beispiel 2: Wilder Kaiser (großes Gebiet, viele Lifte)
```javascript
piste_km = 270
distance = 80 min
price = 69.00 €
liftsOpen = 65

score = (270 × 2) + (80 × -0.5) + (69.00 × -0.5) + (65 × 3)
      = 540 + (-40) + (-34.5) + 195
      = 660.5
      ≈ 661
```

#### Beispiel 3: Skigebiet geschlossen
```javascript
piste_km = 40
distance = 75 min
price = 64.00 €
liftsOpen = 0  // Alle Lifte geschlossen!

score = (40 × 2) + (75 × -0.5) + (64.00 × -0.5) + (0 × 3)
      = 80 + (-37.5) + (-32) + 0
      = 10.5
      ≈ 11
```

### Typische Score-Bereiche

| Score-Bereich | Interpretation |
|---------------|----------------|
| < 0 | Sehr ungünstig (weit, teuer, wenig offen) |
| 0 - 50 | Unterdurchschnittlich |
| 50 - 150 | Durchschnittlich |
| 150 - 300 | Gut (mittlere bis große Gebiete) |
| 300 - 500 | Sehr gut (große Gebiete mit vielen Liften) |
| > 500 | Exzellent (Großraumgebiete wie Wilder Kaiser, Kitzbühel) |

### Implementierung

**Datei:** `js/render.js`

**Funktion:** `calculateScore(resort)`

```javascript
export function calculateScore(resort) {
  const piste = resort.piste_km || 0;
  const dist = resort.distance || SCORE_WEIGHTS.DEFAULT_DISTANCE;
  const price = resort.price || SCORE_WEIGHTS.DEFAULT_PRICE;
  const openLifts = resort.liftsOpen || 0;

  const score =
    (piste * SCORE_WEIGHTS.PISTE_KM) +
    (dist * SCORE_WEIGHTS.DISTANCE) +
    (price * SCORE_WEIGHTS.PRICE) +
    (openLifts * SCORE_WEIGHTS.OPEN_LIFTS);

  return Math.round(score);
}
```

**Konstanten:**
```javascript
const SCORE_WEIGHTS = {
  PISTE_KM: 2,
  DISTANCE: -0.5,
  PRICE: -0.5,
  OPEN_LIFTS: 3,
  DEFAULT_DISTANCE: 100,
  DEFAULT_PRICE: 50
};
```

### Fallback-Werte

Wenn Daten fehlen, werden folgende Standardwerte verwendet:
- `distance`: 100 Minuten (durchschnittliche Entfernung)
- `price`: 50 € (durchschnittlicher Preis)
- `piste_km`: 0 (keine Annahme)
- `liftsOpen`: 0 (konservativ, da geschlossen = unattraktiv)

### Zukünftige Verbesserungen

- [ ] **Wetter-Faktor**: Sonniges Wetter erhöht Score
- [ ] **Schneehöhe-Faktor**: Mehr Schnee = höherer Score
- [ ] **Verkehrslage**: Aktuelle Staus reduzieren Score
- [ ] **Benutzer-Gewichtung**: Individuelle Präferenzen (z.B. Preis wichtiger als Größe)
- [ ] **Historische Performance**: Durchschnittliche Öffnungsrate der letzten Tage

## Sortierung


Die Sortierlogik ist in `render.js` implementiert und ermöglicht es, die Tabelle nach verschiedenen Kriterien zu ordnen.

### Sortierbare Spalten

| Spalte | Sort-Key | Sortierlogik | Bemerkung |
|--------|----------|--------------|-----------|
| Distanz | `distanceKm` | Numerisch | ⚠️ Aktuell nicht sortierbar |
| Fahrzeit (ohne Verkehrslage) | `distance` | Numerisch | ✅ Sortierbar |
| Größe des Skigebiets | `piste_km` | Numerisch | ✅ Sortierbar |
| Preis | `price` | Numerisch | ✅ Sortierbar |
| Schneehöhe | `snow` | Numerisch (extrahiert aus Text) | ✅ Sortierbar |
| Score | `score` | Numerisch | ✅ Sortierbar (Standard) |

### Nicht-sortierbare Spalten

Die folgenden Spalten sind **nicht sortierbar**, da sie entweder Status-Indikatoren, Links oder komplexe Daten enthalten:
- Abfragestatus
- Skigebiet (Name)
- Distanz (aktuell nicht sortierbar)
- Fahrzeit (mit Verkehrslage)
- Geöffnete Lifte
- Schwierigkeitsgrad
- Letzter Schneefall
- Aktuelles Wetter
- Webcam
- Details
- Historie

### Sortierverhalten

- **Klick auf Spaltenüberschrift**: Sortierung umschalten zwischen aufsteigend (↑) und absteigend (↓)
- **Visuelle Indikatoren**: 
  - ↕️ = Spalte ist sortierbar, aber nicht aktiv
  - ↑ = Aufsteigende Sortierung aktiv
  - ↓ = Absteigende Sortierung aktiv
- **Standard-Sortierung**: Nach Score (absteigend)
- **Null-Werte**: Werden als 0 behandelt
- **Text-zu-Zahl-Konvertierung**: Bei Spalten wie "Schneehöhe" werden Zahlen aus Text extrahiert (z.B. "> 10 cm" → 10)

### Mobile Sortierung

Auf mobilen Geräten gibt es zusätzliche Quick-Sort-Buttons:
- 🏆 Score
- ❄️ Schnee
- 📍 Nähe (Distanz)
- 🎿 Pisten (Pistenkilometer)

### Implementierung

Die Sortierlogik befindet sich in `render.js`:
- Funktion: `renderTable(data, sortKey, filter, sortDirection)`
- Event-Handler: Attached an alle `th[data-sort]` Elemente
- Sortieralgorithmus: Unterstützt numerische und String-Sortierung mit Richtungsumkehr

## Responsive Design

### Desktop
- Alle Spalten sichtbar
- Horizontales Scrollen bei Bedarf

### Mobile
- Umstellung auf Card-Layout
- Alle Informationen bleiben zugänglich
- Optimierte Darstellung für Touch-Bedienung

## Datenvalidierung

### Statische Daten (`resorts.json`)

**Pflichtfelder:**
- `id` (String, unique, lowercase)
- `name` (String)
- `distance` (Integer, Minuten)
- `piste_km` (Integer, Kilometer)
- `lifts` (Integer)
- `price` (Float, EUR)
- `classification` (Enum: "Familie", "Genuss", "Sportlich", "Großraum", "Gletscher")
- `website` (URL)
- `latitude` (Float, -90 bis 90)
- `longitude` (Float, -180 bis 180)

**Optionale Felder:**
- `address` (String) - Talstation-Adresse für präzise Navigation
- `webcam` (URL)
- `priceDetail` (Object):
  - `adult` (Float)
  - `youth` (Float)
  - `child` (Float)
  - `currency` (String, default: "€")
  - `info` (String) - Zusatzinformationen

### Live-Daten (Parser-Output)

**Erwartete Felder:**
- `status` (Enum: "live", "static_only", "error")
- `liftsOpen` (Integer, >= 0)
- `liftsTotal` (Integer, >= liftsOpen)
- `snow` (String oder Integer)
- `weather` (String)
- `forecast` (Array von Objekten):
  - `date` (ISO 8601 String)
  - `weatherEmoji` (String, Emoji)
  - `weatherDesc` (String)
  - `tempMax` (Integer, °C)
  - `tempMin` (Integer, °C)
  - `snowDepth` (Integer, cm)
- `lastSnowfall` (ISO 8601 String, optional)
- `lifts[]` (Array, optional) - Detaillierte Lift-Daten
- `slopes[]` (Array, optional) - Detaillierte Pisten-Daten

### Traffic-Daten (TomTom Matrix API)

**Felder:**
- `traffic.duration` (Integer, Minuten)
- `traffic.distance` (Float, Kilometer)
- `traffic.delay` (Integer, Minuten)

**Note**: OpenRouteService (ORS) is used for geocoding only (`/api/locating/geocode`).

## API-Endpunkte

Die Tabellendaten werden von folgenden Backend-Endpunkten bezogen:

### `GET /api/resorts`
Liefert alle Skigebiete mit merged Static + Live-Daten.

**Response-Format:**
```json
[
  {
    "id": "spitzingsee",
    "name": "Spitzingsee - Tegernsee",
    "status": "live",
    "distance": 60,
    "piste_km": 20,
    "lifts": 10,
    "liftsOpen": 8,
    "liftsTotal": 10,
    "price": 49.50,
    "classification": "Familie",
    "snow": "45 cm",
    "forecast": [...],
    "website": "https://...",
    "latitude": 47.6667,
    "longitude": 11.8833,
    "webcam": "https://..."
  }
]
```

### `POST /api/traffic/calculate`
Berechnet Fahrzeiten und Distanzen von einem Standort zu allen Skigebieten.

**Request-Body:**
```json
{
  "origin": {
    "lat": 48.1351,
    "lon": 11.5820
  }
}
```

**Response-Format:**
```json
{
  "spitzingsee": {
    "duration": 65,
    "distance": 75.3
  },
  ...
}
```

### `GET /api/history/:resortId`
Liefert historische Daten für ein Skigebiet (7 Tage).

**Response-Format:**
```json
[
  {
    "date": "2026-01-05",
    "liftsOpen": 8,
    "liftsTotal": 10,
    "snow": 45,
    "trafficDuration": 68
  },
  ...
]
```

## Datenfluss

```
1. Statische Daten (resorts.json)
   ↓
2. Frontend lädt statische Daten sofort
   ↓
3. Backend-Parser holen Live-Daten
   ↓
4. Frontend merged statische + Live-Daten
   ↓
5. Tabelle wird gerendert
   ↓
6. Historische Daten werden täglich gespeichert
```

## Zukünftige Erweiterungen

Alle geplanten Features und Verbesserungen sind im **[BACKLOG.md](../BACKLOG.md)** dokumentiert.

**Highlights:**
- Letzter Schneefall für alle Resorts
- Erweiterte Filter-Optionen
- Favoriten-Funktion
- Verbesserter Score-Algorithmus
- Detailansicht pro Skigebiet
- Push-Benachrichtigungen
- Schneevorhersage & Lawinenwarnungen

→ Siehe [BACKLOG.md](../BACKLOG.md) für vollständige Liste mit Priorisierung und Aufwandsschätzungen.

## Verwandte Dateien

- **Frontend**: `js/render.js`, `index.html`, `css/style.css`
- **Backend**: `backend/index.js`, `backend/resorts.json`, `backend/parsers/*.js`
- **Datenquellen**: TomTom Matrix API (traffic), OpenRouteService API (geocoding), Open-Meteo API (weather), Resort-spezifische APIs (lifts/slopes)
