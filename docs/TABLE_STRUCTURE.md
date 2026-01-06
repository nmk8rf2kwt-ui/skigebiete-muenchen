# Tabellenstruktur - Skigebiete München

Dieses Dokument beschreibt die vollständige Struktur der Skigebiete-Tabelle, einschließlich aller Spalten, deren Datenquellen und Darstellungslogik.

## Spaltenübersicht

| Nr. | Spalte | Datenquelle | Status | Beschreibung |
|-----|--------|-------------|--------|--------------|
| 1 | Abfragestatus | Live (Parser) | ✅ Implementiert | Zeigt den Status der Datenabfrage (Erfolg/Fehler) |
| 2 | Skigebiet | Statisch (`resorts.json`) | ✅ Implementiert | Name des Skigebiets |
| 3 | Fahrzeit (ohne Verkehrslage) | Live (Google Maps API) | ✅ Implementiert | Standardfahrzeit ohne Verkehr |
| 4 | Fahrzeit (Aktuell) | Live (Google Maps API) | ✅ Implementiert | Aktuelle Fahrzeit mit Verkehrslage |
| 5 | Distanz in km | Live (Google Maps API) | ✅ Implementiert | Entfernung vom Standort |
| 6 | Größe des Skigebiets (in km) | Statisch (`resorts.json`) | ✅ Implementiert | Gesamte Pistenlänge |
| 7 | Geöffnete Lifte | Live (Parser) | ✅ Implementiert | Anzahl geöffneter/geschlossener Lifte |
| 8 | Preis | Statisch (`resorts.json`) | ✅ Implementiert | Ticketpreis mit Details (Erwachsene/Jugend/Kinder) |
| 9 | Schwierigkeitsgrad | Statisch (`resorts.json`) | ✅ Implementiert | Klassifizierung des Skigebiets |
| 10 | Schneehöhe (Berg/Tal) | Live (Parser) | ✅ Implementiert | Schneehöhe am Berg und im Tal |
| 11 | Letzter Schneefall | Live (Parser/Weather API) | ⚠️ Teilweise | Datum des letzten Schneefalls |
| 12 | Aktuelles Wetter | Live (Weather API) | ✅ Implementiert | Aktuelle Wetterbedingungen mit Symbolen |
| 13 | Webcam | Statisch (`resorts.json`) | ✅ Implementiert | Link zur Webcam |
| 14 | Historie | Historische Daten | ✅ Implementiert | Historische Daten zu Liften, Schnee, etc. |
| 15 | Score | Berechnet | 🔄 In Planung | Bewertungs-Score basierend auf verschiedenen Faktoren |

## Detaillierte Spaltenbeschreibung

### 1. Abfragestatus
- **Typ**: Status-Indikator
- **Datenquelle**: Live-Parser-Ergebnis
- **Darstellung**: Icon (✅ Erfolg, ⚠️ Warnung, ❌ Fehler)
- **Implementierung**: `render.js` - `renderStatusCell()`

### 2. Skigebiet
- **Typ**: Text mit Link
- **Datenquelle**: `resorts.json` - `name`
- **Darstellung**: Klickbarer Name, öffnet offizielle Website
- **Implementierung**: `render.js` - `renderNameCell()`

### 3. Fahrzeit (ohne Verkehrslage)
- **Typ**: Zeit in Minuten
- **Datenquelle**: Google Maps Distance Matrix API (ohne Traffic)
- **Darstellung**: "XX min" mit Link zu Google Maps Navigation
- **Tooltip**: Zeigt Talstation-Adresse
- **Implementierung**: `render.js` - `renderTravelTimeCell()`

### 4. Fahrzeit (Aktuell)
- **Typ**: Zeit in Minuten mit Verkehrslage
- **Datenquelle**: Google Maps Distance Matrix API (mit Traffic)
- **Darstellung**: "XX min" mit farblicher Kennzeichnung
  - Grün: Keine Verzögerung
  - Gelb: 1-15 min Verzögerung
  - Orange: 16-30 min Verzögerung
  - Rot: >30 min Verzögerung
- **Implementierung**: `render.js` - `renderTravelTimeCell()`

### 5. Distanz in km (ab Standort)
- **Typ**: Entfernung in Kilometern
- **Datenquelle**: Google Maps Distance Matrix API
- **Darstellung**: "XX km"
- **Implementierung**: `render.js` - `renderDistanceCell()`

### 6. Größe des Skigebiets (in km)
- **Typ**: Numerisch
- **Datenquelle**: `resorts.json` - `slopeKm`
- **Darstellung**: "XX km Pisten"
- **Implementierung**: `render.js` - `renderSlopeKmCell()`

### 7. Geöffnete Lifte (Stand: heute)
- **Typ**: Bruch (geöffnet/gesamt)
- **Datenquelle**: Live-Parser
- **Darstellung**: "X/Y" mit farblicher Kennzeichnung
  - Grün: >75% geöffnet
  - Gelb: 50-75% geöffnet
  - Orange: 25-50% geöffnet
  - Rot: <25% geöffnet
- **Implementierung**: `render.js` - `renderLiftsCell()`

### 8. Preis
- **Typ**: Währung (EUR)
- **Datenquelle**: `resorts.json` - `price`, `priceDetail`
- **Darstellung**: "XX €" mit Info-Icon
- **Tooltip**: Zeigt Details (Erwachsene, Jugend, Kinder)
- **Implementierung**: `render.js` - `renderPriceCell()`

### 9. Schwierigkeitsgrad
- **Typ**: Kategorisierung
- **Datenquelle**: `resorts.json` - `classification`
- **Werte**:
  - 👨‍👩‍👧‍👦 Familie: Ideal für Familien
  - 🎿 Genuss: Genussskifahren
  - 🏔️ Sportlich: Sportliche Herausforderung
  - 🏙️ Großraum: Großes Skigebiet
  - ❄️ Gletscher: Gletscherskigebiet
- **Implementierung**: `render.js` - `renderClassificationCell()`

### 10. Schneehöhe (Berg/Tal)
- **Typ**: Numerisch (cm)
- **Datenquelle**: Live-Parser
- **Darstellung**: "Berg: XX cm / Tal: YY cm"
- **Implementierung**: `render.js` - `renderSnowCell()`

### 11. Letzter Schneefall
- **Typ**: Datum
- **Datenquelle**: Live-Parser oder Weather API
- **Darstellung**: "vor X Tagen" oder Datum
- **Status**: Teilweise implementiert, nicht alle Parser liefern diese Daten
- **Implementierung**: `render.js` - `renderLastSnowfallCell()`

### 12. Aktuelles Wetter
- **Typ**: Wetter-Symbol mit Beschreibung
- **Datenquelle**: Weather API (Open-Meteo)
- **Darstellung**: Symbol (☀️, ⛅, ☁️, 🌧️, 🌨️, etc.)
- **Tooltip**: Wetterbeschreibung + Datum der Vorhersage
- **Implementierung**: `render.js` - `renderWeatherCell()`

### 13. Webcam
- **Typ**: Link
- **Datenquelle**: `resorts.json` - `webcamUrl`
- **Darstellung**: 📷 Icon, öffnet Webcam in neuem Tab
- **Implementierung**: `render.js` - `renderWebcamCell()`

### 14. Historie
- **Typ**: Link/Button
- **Datenquelle**: Historische Datenbank
- **Darstellung**: 📊 Icon, öffnet historische Ansicht
- **Daten**: Lift-Status, Schneehöhe, Verkehrslage (täglich 6-22 Uhr)
- **Implementierung**: `render.js` - `renderHistoryCell()`

### 15. Score
- **Typ**: Numerisch (0-100)
- **Datenquelle**: Berechnet aus verschiedenen Faktoren
- **Faktoren** (geplant):
  - Anzahl geöffneter Lifte
  - Schneehöhe
  - Wetterbedingungen
  - Fahrzeit
  - Preis-Leistungs-Verhältnis
- **Darstellung**: Zahl mit farblicher Kennzeichnung
- **Status**: In Planung
- **Implementierung**: Noch nicht implementiert

## Sortierung

Die Sortierlogik ist in `render.js` implementiert und ermöglicht es, die Tabelle nach verschiedenen Kriterien zu ordnen.

### Sortierbare Spalten

| Spalte | Sort-Key | Sortierlogik | Bemerkung |
|--------|----------|--------------|-----------|
| Fahrzeit (Standard) | `distance` | Numerisch | ✅ Sortierbar |
| Größe des Skigebiets | `piste_km` | Numerisch | ✅ Sortierbar |
| Preis | `price` | Numerisch | ✅ Sortierbar |
| Schneehöhe | `snow` | Numerisch (extrahiert aus Text) | ✅ Sortierbar |
| Score | `score` | Numerisch | ✅ Sortierbar (Standard) |

### Nicht-sortierbare Spalten

Die folgenden Spalten sind **nicht sortierbar**, da sie entweder Status-Indikatoren, Links oder komplexe Daten enthalten:
- Abfragestatus
- Skigebiet (Name)
- Fahrzeit (Aktuell)
- Distanz in km
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

- [ ] Score-Berechnung implementieren
- [ ] Letzter Schneefall für alle Resorts
- [ ] Erweiterte Filter-Optionen
- [ ] Favoriten-Funktion
- [ ] Push-Benachrichtigungen bei Änderungen
- [ ] Detailansicht pro Skigebiet

## Verwandte Dateien

- **Frontend**: `js/render.js`, `index.html`, `css/style.css`
- **Backend**: `backend/index.js`, `backend/resorts.json`, `backend/parsers/*.js`
- **Datenquellen**: Google Maps API, Open-Meteo API, Resort-spezifische APIs
