# Product Backlog - Skigebiete München

Dieses Dokument enthält alle geplanten Features, Verbesserungen und Ideen für die Weiterentwicklung des Skigebiet-Finders.

> **Letzte Aktualisierung:** 2026-01-06  
> **Version:** 1.0

---

## 🎯 Priorisierung

- **P0 (Critical)**: Muss implementiert werden
- **P1 (High)**: Sollte bald implementiert werden
- **P2 (Medium)**: Nice-to-have, mittelfristig
- **P3 (Low)**: Ideen für die Zukunft

---

## 📋 Backlog Items

### 🔴 P0 - Critical

#### BACK-001: Letzter Schneefall für alle Resorts
**Status:** 🟡 Teilweise implementiert  
**Beschreibung:** Nicht alle Parser liefern aktuell `lastSnowfall` Daten. Dies sollte für alle Skigebiete verfügbar sein.

**Betroffene Resorts:**
- Mehrere Parser fehlen noch

**Technische Details:**
- Parser müssen erweitert werden
- Fallback auf Weather API wenn Website-Daten fehlen
- Datenformat: ISO 8601 String

**Aufwand:** 3-5 Tage  
**Abhängigkeiten:** Parser-Updates

---

### 🟠 P1 - High Priority

#### BACK-002: Erweiterte Filter-Optionen
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Benutzer sollen die Tabelle nach verschiedenen Kriterien filtern können.

**Geplante Filter:**
- Schwierigkeitsgrad (Familie, Genuss, Sportlich, Großraum, Gletscher)
- Preis-Range (€0-50, €50-60, €60-70, €70+)
- Entfernung (<60 min, 60-90 min, 90-120 min, >120 min)
- Pistenkilometer (<30 km, 30-100 km, 100-200 km, >200 km)
- Nur geöffnete Skigebiete (bereits implementiert als "open")

**UI-Design:**
- Dropdown-Menüs oder Checkboxen
- Multi-Select möglich
- Filter kombinierbar
- "Filter zurücksetzen" Button

**Aufwand:** 2-3 Tage  
**Dateien:** `index.html`, `js/app.js`, `css/style.css`

---

#### BACK-003: Favoriten-Funktion mit LocalStorage
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Benutzer können Skigebiete als Favoriten markieren.

**Features:**
- ⭐ Icon zum Markieren/Entfernen von Favoriten
- Favoriten werden in LocalStorage gespeichert
- Filter "Nur Favoriten anzeigen"
- Favoriten bleiben über Sessions erhalten

**Technische Details:**
```javascript
// LocalStorage Schema
{
  "favorites": ["spitzingsee", "wilder-kaiser", "kitzbuehel"]
}
```

**Aufwand:** 1-2 Tage  
**Dateien:** `js/app.js`, `js/render.js`, `css/style.css`

---

#### BACK-004: Score-Algorithmus Verbesserungen
**Status:** 🟡 Basis implementiert  
**Beschreibung:** Den Score-Algorithmus um weitere Faktoren erweitern.

**Neue Faktoren:**
1. **Wetter-Faktor** (+10 bis -10)
   - Sonnig: +10
   - Bewölkt: +5
   - Schneefall: +8
   - Regen: -10
   - Nebel: -5

2. **Schneehöhe-Faktor** (+0 bis +20)
   - < 30 cm: +0
   - 30-60 cm: +5
   - 60-100 cm: +10
   - > 100 cm: +20

3. **Verkehrslage-Faktor** (-20 bis +5)
   - Keine Verzögerung: +5
   - 1-10 min: 0
   - 11-20 min: -5
   - 21-30 min: -10
   - > 30 min: -20

4. **Historische Performance** (+0 bis +15)
   - Durchschnittliche Öffnungsrate der letzten 7 Tage
   - 100%: +15
   - 75-99%: +10
   - 50-74%: +5
   - < 50%: +0

**Benutzer-Gewichtung:**
- UI für individuelle Gewichtung der Faktoren
- Presets: "Schnäppchenjäger", "Pistenkilometer-Jäger", "Nähe bevorzugt"

**Aufwand:** 3-4 Tage  
**Dateien:** `js/render.js`, `js/app.js`, `index.html`

---

#### BACK-016: Datumsbasiertes Scoring (Geplanter Skitag)
**Status:** 🔴 Nicht implementiert  
**Priorität:** P1 (High)  
**Beschreibung:** Benutzer können ein Datum für ihren geplanten Skitag eingeben. Das Scoring berücksichtigt dann die Wetter- und Schneevorhersage für diesen spezifischen Tag.

**Features:**
- Datumswahl-UI (Datepicker)
- Wettervorhersage für gewähltes Datum abrufen
- Schneevorhersage für gewähltes Datum abrufen
- Score-Berechnung anpassen basierend auf:
  - Erwartetes Wetter (Sonnig = höherer Score)
  - Erwarteter Schneefall (Neuschnee = höherer Score)
  - Schneehöhe am gewählten Tag
  - Temperatur (zu warm = niedrigerer Score)

**Score-Anpassungen:**
```javascript
// Wetter-Bonus für geplantes Datum
if (plannedDate) {
  const forecast = getForecastForDate(plannedDate);
  
  // Wetter-Faktor
  if (forecast.weather === 'sunny') score += 15;
  else if (forecast.weather === 'cloudy') score += 5;
  else if (forecast.weather === 'snow') score += 10;
  else if (forecast.weather === 'rain') score -= 15;
  
  // Neuschnee-Faktor
  if (forecast.newSnow > 10) score += 20;
  else if (forecast.newSnow > 5) score += 10;
  
  // Temperatur-Faktor
  if (forecast.tempMax > 5) score -= 10; // Zu warm
  if (forecast.tempMin < -15) score -= 5; // Zu kalt
}
```

**UI-Design:**
- Datepicker oben in der Tabelle
- "Heute" als Standard
- Bis zu 7 Tage im Voraus wählbar
- Anzeige: "Scoring für: [Datum]"

**Technische Details:**
- Forecast-Daten von Open-Meteo API (bereits vorhanden)
- Erweiterte Forecast-Felder: `newSnow`, `precipitation`
- Score-Berechnung in `render.js` erweitern

**Aufwand:** 2-3 Tage  
**Dateien:** `index.html`, `js/app.js`, `js/render.js`, `css/style.css`  
**Abhängigkeiten:** Open-Meteo API erweiterte Forecast-Daten

---

#### BACK-017: Historische Verkehrslage im Scoring
**Status:** 🔴 Nicht implementiert  
**Priorität:** P1 (High)  
**Beschreibung:** Statt nur aktuelle Verkehrslage zu zeigen, sollen historische Verkehrsdaten (gemittelt) ins Scoring einfließen, um vorhersagbare Staus zu berücksichtigen.

**Features:**
- Historische Traffic-Daten sammeln (täglich, stündlich)
- Durchschnittliche Fahrzeiten berechnen nach:
  - Wochentag (Mo-So)
  - Uhrzeit (6-22 Uhr)
  - Saison (Hauptsaison vs. Nebensaison)
- Vorhersage für geplantes Datum/Uhrzeit
- Score-Anpassung basierend auf erwarteter Verkehrslage

**Datensammlung:**
```javascript
// Historische Daten-Struktur
{
  "resortId": "spitzingsee",
  "origin": "munich",
  "history": [
    {
      "date": "2026-01-05",
      "dayOfWeek": "Sunday",
      "hour": 8,
      "duration": 75,  // Minuten
      "delay": 15      // vs. Standard
    }
  ]
}
```

**Score-Anpassung:**
```javascript
// Erwartete Verkehrslage für geplantes Datum
const expectedTraffic = getHistoricalTrafficAverage(
  resort.id,
  plannedDate.dayOfWeek,
  plannedDate.hour
);

// Stau-Penalty
if (expectedTraffic.avgDelay > 30) score -= 20;
else if (expectedTraffic.avgDelay > 20) score -= 15;
else if (expectedTraffic.avgDelay > 10) score -= 10;
else if (expectedTraffic.avgDelay > 5) score -= 5;
```

**Aktuelle Einschränkung:**
- ⚠️ Aktuell wird immer ab München gerechnet
- Siehe BACK-018 für Verbesserung

**Aufwand:** 4-5 Tage  
**Dateien:** `backend/services/traffic.js`, `backend/services/history.js`, `js/render.js`  
**Abhängigkeiten:** Historische Datenbank erweitern

---

#### BACK-018: Multi-City Traffic Data Collection
**Status:** 🔴 Nicht implementiert  
**Priorität:** P2 (Medium)  
**Beschreibung:** Verkehrslage von mehreren Großstädten in Süddeutschland erfassen, um bessere Näherungswerte für Benutzerstandorte zu liefern.

**Ziel:**
Statt nur München als Ausgangspunkt zu verwenden, sollen Verkehrsdaten von mehreren Städten gesammelt werden. Basierend auf dem Benutzerstandort wird dann die nächstgelegene Stadt als Referenz verwendet.

**Städte-Liste:**
- München (bereits implementiert)
- Augsburg
- Nürnberg
- Stuttgart
- Ulm
- Regensburg
- Rosenheim
- Innsbruck (AT)

**Datensammlung:**
- Stündliche Traffic-Abfragen (6-22 Uhr)
- Zu allen Skigebieten
- Speicherung in historischer Datenbank
- Keine UI-Ausgabe (nur Backend)

**Technische Details:**
```javascript
// Städte-Konfiguration
const REFERENCE_CITIES = [
  { id: 'munich', name: 'München', lat: 48.1351, lon: 11.5820 },
  { id: 'augsburg', name: 'Augsburg', lat: 48.3705, lon: 10.8978 },
  { id: 'nuremberg', name: 'Nürnberg', lat: 49.4521, lon: 11.0767 },
  { id: 'stuttgart', name: 'Stuttgart', lat: 48.7758, lon: 9.1829 },
  { id: 'ulm', name: 'Ulm', lat: 48.4011, lon: 9.9876 },
  { id: 'regensburg', name: 'Regensburg', lat: 49.0134, lon: 12.1016 },
  { id: 'rosenheim', name: 'Rosenheim', lat: 47.8561, lon: 12.1239 },
  { id: 'innsbruck', name: 'Innsbruck', lat: 47.2692, lon: 11.4041 }
];

// Nächste Stadt finden
function findNearestReferenceCity(userLocation) {
  return REFERENCE_CITIES.reduce((nearest, city) => {
    const distance = calculateDistance(userLocation, city);
    return distance < nearest.distance 
      ? { city, distance } 
      : nearest;
  }, { city: REFERENCE_CITIES[0], distance: Infinity });
}

// Historische Daten abrufen
function getHistoricalTraffic(resortId, userLocation, plannedDate) {
  const nearestCity = findNearestReferenceCity(userLocation);
  return getHistoricalTrafficData(
    resortId, 
    nearestCity.city.id, 
    plannedDate
  );
}
```

**API-Kosten:**
- ⚠️ 8 Städte × 20 Resorts × 16 Stunden = 2,560 Requests/Tag
- OpenRouteService Free Tier: 2,000 Requests/Tag
- **Lösung:** Paid Plan erforderlich oder Sampling (z.B. nur alle 2 Stunden)

**Optimierung:**
- Nur Hauptverkehrszeiten: 6-10 Uhr, 15-19 Uhr
- Reduziert auf: 8 × 20 × 8 = 1,280 Requests/Tag ✅

**Aufwand:** 5-7 Tage  
**Dateien:** `backend/services/traffic.js`, `backend/scheduler.js`, `backend/services/history.js`  
**Abhängigkeiten:** 
- Erweiterte Datenbank-Schema
- Ggf. OpenRouteService Paid Plan

---

#### BACK-019: Alternative APIs und Parser-Fallbacks
**Status:** 🔴 Nicht implementiert  
**Priorität:** P1 (High)  
**Beschreibung:** Implementierung von Fallback-Mechanismen für Parser, um Datenverfügbarkeit zu erhöhen und Ausfälle zu kompensieren.

**Problem:**
Wenn ein Parser fehlschlägt (Website-Änderung, Server-Ausfall), gibt es keine Daten für das Skigebiet.

**Lösungsansätze:**

1. **Primär/Sekundär API-Strategie**
   ```javascript
   async function fetchResortData(resortId) {
     try {
       // Primär: Offizielle Website
       return await primaryParser(resortId);
     } catch (error) {
       console.warn(`Primary parser failed for ${resortId}, trying fallback`);
       try {
         // Fallback 1: Bergfex API
         return await bergfexParser(resortId);
       } catch (error2) {
         // Fallback 2: Skiresort.info
         return await skiresortInfoParser(resortId);
       }
     }
   }
   ```

2. **Cached Data Fallback**
   - Letzte erfolgreiche Daten cachen (mit Timestamp)
   - Bei Parser-Fehler: Cached Data verwenden
   - UI-Hinweis: "Daten von [Datum/Uhrzeit]"
   ```javascript
   if (parserFailed) {
     const cached = await getCachedData(resortId);
     if (cached && isRecentEnough(cached.timestamp, 24)) { // 24h
       return { ...cached.data, status: 'cached' };
     }
   }
   ```

3. **Alternative Datenquellen**
   - **Bergfex**: Aggregator mit API-Zugang
   - **Skiresort.info**: Umfassende Datenbank
   - **OnTheSnow**: Internationale Plattform
   - **Snowplaza**: Europäische Skigebiete

4. **Parser Health Monitoring**
   ```javascript
   const PARSER_HEALTH = {
     'spitzingsee': {
       lastSuccess: '2026-01-06T10:00:00Z',
       successRate: 0.95,  // 95% in letzten 7 Tagen
       avgResponseTime: 1200,  // ms
       status: 'healthy'
     }
   };
   ```

5. **Automatische Fallback-Aktivierung**
   - Bei 3 aufeinanderfolgenden Fehlern: Fallback aktivieren
   - Bei Success-Rate < 80%: Warnung an Admin
   - Bei Success-Rate < 50%: Automatisch Fallback verwenden

**Implementierung:**
- Parser-Wrapper mit Try-Catch-Kaskade
- Health-Check-Endpoint: `GET /api/parser-health`
- Admin-Benachrichtigung bei kritischen Ausfällen
- Metrics-Dashboard für Parser-Performance

**Aufwand:** 5-7 Tage  
**Dateien:** `backend/services/parserManager.js`, `backend/parsers/*`, `backend/services/cache.js`  
**Abhängigkeiten:** 
- Ggf. API-Zugang zu Bergfex/Skiresort.info
- Redis oder File-basierter Cache

---

#### BACK-020: Human-in-the-Loop Validierungs-Interface
**Status:** 🔴 Nicht implementiert  
**Priorität:** P1 (High)  
**Beschreibung:** Admin-Interface zur manuellen Validierung der Parser-Daten gegen die Original-Websites.

**Ziel:**
Regelmäßige Qualitätsprüfung durch Menschen, um Parser-Fehler frühzeitig zu erkennen.

**UI-Design:**
```
+------------------+------------------+------------------+
|  Original-Site   | Erfasste Daten   | Alt. Quellen     |
|                  |                  |                  |
|  [iframe]        | Lifts: 8/10      | Bergfex: 8/10    |
|  Website des     | Snow: 45cm       | Skiresort: 9/10  |
|  Skigebiets      | Weather: Sunny   | OnTheSnow: 8/10  |
|                  | Status: ✅ Live   | Snowplaza: 8/10  |
|                  |                  |                  |
|                  | [✅ Korrekt]     | [📋 Details]     |
|                  | [❌ Fehler]      |                  |
|                  | [📝 Notiz]      |                  |
+------------------+------------------+------------------+
| < Prev | Next >  | [Skip] [Report] | [Use Alt Source] |
+------------------+------------------+------------------+
```

**Features:**

1. **Triple-Screen Ansicht**
   - Links: iframe mit Original-Website
   - Mitte: Unsere geparsten Daten
   - Rechts: Alternative Datenquellen zum Vergleich
   - Alle nebeneinander zum direkten Vergleich

2. **Alternative Datenquellen-Panel**
   - Zeigt Daten von Bergfex, Skiresort.info, OnTheSnow, Snowplaza
   - Farbcodierung bei Abweichungen:
     - 🟢 Grün: Stimmt mit unseren Daten überein
     - 🟡 Gelb: Leichte Abweichung (±1)
     - 🔴 Rot: Große Abweichung (>1)
   - Klickbar für Details
   
   ```
   Alternative Quellen:
   ┌─────────────────────────┐
   │ Bergfex:     8/10  🟢   │
   │ Skiresort:   9/10  🟡   │
   │ OnTheSnow:   8/10  🟢   │
   │ Snowplaza:   8/10  🟢   │
   │                         │
   │ Konsens: 8/10           │
   │ Unsere: 8/10 ✅         │
   └─────────────────────────┘
   ```

3. **Konsens-Berechnung**
   - Automatische Berechnung des Median/Modus aus alternativen Quellen
   - Vergleich mit unseren Daten
   - Warnung bei starker Abweichung vom Konsens

2. **Quick-Navigation**
   - Tastaturkürzel: ←/→ für Prev/Next
   - Space: Als "Korrekt" markieren
   - E: Fehler melden
   - S: Überspringen

3. **Validierungs-Optionen**
   - ✅ **Korrekt**: Daten stimmen überein
   - ❌ **Fehler**: Diskrepanz gefunden
   - 📝 **Notiz**: Kommentar hinzufügen
   - ⚠️ **Website geändert**: Layout-Änderung erkannt

4. **Fehler-Details erfassen**
   ```javascript
   {
     "resortId": "spitzingsee",
     "validatedAt": "2026-01-06T12:00:00Z",
     "validator": "admin@example.com",
     "status": "error",
     "issues": [
       {
         "field": "liftsOpen",
         "expected": 8,
         "actual": 10,
         "note": "Parser zählt geschlossene Lifte mit"
       }
     ]
   }
   ```

5. **Validierungs-Schedule**
   - Täglich: Stichprobe (5 zufällige Resorts)
   - Wöchentlich: Alle Resorts
   - Bei Parser-Update: Betroffene Resorts
   - Bei niedriger Success-Rate: Sofortige Prüfung

6. **Reporting & Analytics**
   - Validierungs-Historie
   - Fehlerquote pro Resort
   - Häufigste Fehlertypen
   - Parser-Zuverlässigkeit-Trend

7. **Auto-Disable bei kritischen Fehlern**
   - Bei 3 aufeinanderfolgenden Fehler-Validierungen:
     - Parser automatisch deaktivieren
     - Fallback aktivieren (siehe BACK-019)
     - Admin-Benachrichtigung

**Technische Implementierung:**

```javascript
// Backend: Validation API
app.get('/admin/validation/next', async (req, res) => {
  const resort = await getNextResortForValidation();
  const parsedData = await parseResort(resort.id);
  res.json({
    resort,
    parsedData,
    websiteUrl: resort.website
  });
});

app.post('/admin/validation/submit', async (req, res) => {
  const { resortId, status, issues, notes } = req.body;
  await saveValidation({
    resortId,
    status,
    issues,
    notes,
    validatedAt: new Date(),
    validator: req.user.email
  });
  
  // Auto-disable bei kritischen Fehlern
  if (status === 'error') {
    const recentValidations = await getRecentValidations(resortId, 3);
    if (recentValidations.every(v => v.status === 'error')) {
      await disableParser(resortId);
      await notifyAdmin(`Parser ${resortId} auto-disabled`);
    }
  }
});
```

```html
<!-- Frontend: Validation Interface -->
<div class="validation-container">
  <div class="split-view">
    <div class="original-site">
      <h3>Original-Website</h3>
      <iframe :src="currentResort.website"></iframe>
    </div>
    <div class="parsed-data">
      <h3>Erfasste Daten</h3>
      <table>
        <tr><td>Lifts</td><td>{{ parsedData.liftsOpen }}/{{ parsedData.liftsTotal }}</td></tr>
        <tr><td>Schnee</td><td>{{ parsedData.snow }}</td></tr>
        <tr><td>Wetter</td><td>{{ parsedData.weather }}</td></tr>
      </table>
      <div class="actions">
        <button @click="markCorrect()">✅ Korrekt</button>
        <button @click="reportError()">❌ Fehler</button>
        <button @click="addNote()">📝 Notiz</button>
      </div>
    </div>
  </div>
  <div class="navigation">
    <button @click="prev()">&lt; Prev</button>
    <button @click="skip()">Skip</button>
    <button @click="next()">Next &gt;</button>
  </div>
</div>
```

**Zugriffskontrolle:**
- Nur für Admins zugänglich
- Route: `/admin/validation`
- Basic Auth oder OAuth

**Aufwand:** 4-5 Tage  
**Dateien:** 
- `admin/validation.html` (neu)
- `admin/js/validation.js` (neu)
- `admin/css/validation.css` (neu)
- `backend/routes/admin.js` (neu)
- `backend/services/validation.js` (neu)

**Abhängigkeiten:** 
- Authentication-System
- Datenbank für Validierungs-Historie

---

### 🟡 P2 - Medium Priority

#### BACK-005: Detailansicht pro Skigebiet
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Erweiterte Detailseite für jedes Skigebiet.

**Inhalte:**
- Pistenplan (falls verfügbar)
- Detaillierte Lift-Liste mit Status
- Detaillierte Pisten-Liste mit Schwierigkeitsgrad
- Öffnungszeiten
- Saisonzeiten
- Höhenangaben (Tal/Berg)
- Parkmöglichkeiten
- Restaurants/Hütten
- Skischulen/Skiverleih

**UI:**
- Modal oder separate Seite
- Tabs für verschiedene Bereiche
- Responsive Design

**Aufwand:** 5-7 Tage  
**Dateien:** Neue Dateien + `js/app.js`, `css/style.css`

---

#### BACK-006: Export-Funktion für historische Daten
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Historische Daten als CSV/JSON exportieren.

**Features:**
- Export für einzelnes Skigebiet oder alle
- Zeitraum wählbar (7 Tage, 30 Tage, Saison)
- Formate: CSV, JSON
- Download-Button im History-Modal

**Aufwand:** 1-2 Tage  
**Dateien:** `js/app.js`

---

#### BACK-007: Push-Benachrichtigungen
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Benutzer über wichtige Änderungen informieren.

**Benachrichtigungen für:**
- Favoriten-Skigebiet öffnet
- Neuschnee in Favoriten-Gebiet
- Preis-Änderungen
- Neue Lifte geöffnet

**Technische Details:**
- Web Push API
- Service Worker erforderlich
- Opt-in durch Benutzer
- Einstellungen für Benachrichtigungstypen

**Aufwand:** 4-5 Tage  
**Abhängigkeiten:** Service Worker Setup

---

#### BACK-008: Schneevorhersage (7 Tage)
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Schneevorhersage für die nächsten 7 Tage anzeigen.

**Datenquelle:**
- Open-Meteo API (bereits verwendet)
- Feld: `snowfall` in forecast

**UI:**
- Zusätzliche Spalte oder im Wetter-Tooltip
- Icon für erwarteten Schneefall
- Menge in cm

**Aufwand:** 1-2 Tage  
**Dateien:** `backend/services/weather.js`, `js/render.js`

---

#### BACK-009: Lawinenwarnungen Integration
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Aktuelle Lawinenwarnungen anzeigen.

**Datenquelle:**
- Lawinenwarndienste (Bayern, Tirol, Salzburg)
- APIs oder Web-Scraping

**UI:**
- Warnstufen-Icon (1-5)
- Tooltip mit Details
- Farbcodierung (Grün bis Rot)

**Aufwand:** 3-4 Tage  
**Abhängigkeiten:** API-Zugang oder Scraping-Logik

---

### 🔵 P3 - Low Priority / Ideen

#### BACK-010: Mobile App (PWA)
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Progressive Web App für bessere Mobile Experience.

**Features:**
- Offline-Funktionalität
- App-Installation
- Native-ähnliches UI
- Push-Benachrichtigungen

**Aufwand:** 10-15 Tage

---

#### BACK-011: Routenplanung mit Zwischenstopps
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Mehrere Skigebiete in einer Tour besuchen.

**Features:**
- Multi-Destination Routing
- Optimale Reihenfolge berechnen
- Zeitplanung
- Tankstellen/Raststätten einblenden

**Aufwand:** 5-7 Tage

---

#### BACK-012: Social Features
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Community-Features für Skifahrer.

**Features:**
- Bewertungen/Reviews
- Fotos hochladen
- Tipps & Tricks
- "Wer ist heute wo?"
- Gruppen-Planung

**Aufwand:** 15-20 Tage  
**Abhängigkeiten:** Backend-Erweiterung, Datenbank, Authentication

---

#### BACK-013: Skipass-Preisvergleich
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Verschiedene Skipass-Optionen vergleichen.

**Features:**
- Tages-, Mehrtages-, Saisonkarten
- Online-Rabatte
- Kombi-Angebote
- Preis-Historie

**Aufwand:** 3-5 Tage

---

#### BACK-014: Live-Webcam-Integration
**Status:** 🟡 Links vorhanden  
**Beschreibung:** Webcams direkt in der App anzeigen.

**Features:**
- Webcam-Vorschau in Tabelle
- Vollbild-Ansicht
- Mehrere Cams pro Resort
- Zeitraffer-Funktion

**Aufwand:** 2-3 Tage

---

#### BACK-015: KI-basierte Empfehlungen
**Status:** 🔴 Nicht implementiert  
**Beschreibung:** Personalisierte Skigebiet-Empfehlungen.

**Features:**
- Lernender Algorithmus basierend auf Benutzerverhalten
- "Ähnliche Skigebiete"
- "Beste Zeit zum Besuchen"
- Wettervorhersage-Integration

**Aufwand:** 10-15 Tage  
**Abhängigkeiten:** ML-Modell, Tracking

---

## 📊 Statistik

**Gesamt:** 20 Backlog Items

**Nach Priorität:**
- P0 (Critical): 1
- P1 (High): 8
- P2 (Medium): 6
- P3 (Low): 5

**Nach Status:**
- 🔴 Nicht implementiert: 17
- 🟡 Teilweise implementiert: 3
- 🟢 Implementiert: 0

**Geschätzter Gesamtaufwand:** 95-137 Tage

---

## 🔄 Changelog

### 2026-01-06 (Update 3)
- BACK-019 hinzugefügt: Alternative APIs und Parser-Fallbacks
- BACK-020 hinzugefügt: Human-in-the-Loop Validierungs-Interface
- Gesamt: 20 Items

### 2026-01-06 (Update 2)
- BACK-016 hinzugefügt: Datumsbasiertes Scoring (Geplanter Skitag)
- BACK-017 hinzugefügt: Historische Verkehrslage im Scoring
- BACK-018 hinzugefügt: Multi-City Traffic Data Collection
- Gesamt: 18 Items

### 2026-01-06 (Initial)
- Initial Backlog erstellt
- 15 Items definiert
- Priorisierung vorgenommen
