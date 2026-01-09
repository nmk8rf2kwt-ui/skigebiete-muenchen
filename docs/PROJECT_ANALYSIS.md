# Projekt-Retrospektive & Analyse

Basierend auf der Code-Analyse wurden folgende Stärken, Schwächen und Hürden identifiziert.

## ✅ Was am besten funktioniert hat (Keep)

1.  **Frontend-Performance (Vanilla JS)**: Der Verzicht auf Frameworks (React/Vue) sorgt für extrem schnelle Ladezeiten und geringe Komplexität. Die App fühlt sich "snappy" an.
2.  **Hybride Architektur**: Das Prinzip "Statische Config (Basisdaten) + Dynamischer Overlay (Live-Daten)" ist exzellent. Es garantiert, dass die App immer *etwas* anzeigt, auch wenn Scraper ausfallen oder das Backend langsam ist.
3.  **Fallback-Strategien**: Das automatische Einspringen von Wetter-API-Daten (Open-Meteo), wenn modellspezifische Resort-Daten fehlen, sorgt für eine hohe Datenverfügbarkeit und verhindert "leere" Karten.
4.  **Admin Dashboard**: Die Existenz eines operativen Dashboards zur Überwachung der Scraper ist für diese Art von Projekt (hohe Fehleranfälligkeit externer Quellen) überlebenswichtig.

## 🗑️ Was wir verwerfen/refactoring sollten (Discard/Change)

1.  **Fragmentierte Scraper-Landschaft**: Die Datei `parsers/index.js` importiert über 50 individuelle Parser-Dateien. Das ist ein **Wartungs-Albtraum**.
    *   *Empfehlung*: Konsolidierung auf wenige "Provider-Parser" (z.B. Intermaps, Sitour API), die generisch für viele Gebiete funktionieren, statt maßgeschneidertem HTML-Scraping für jedes Resort.
2.  **In-Memory Caching (`Map`)**: `backend/services/cache.js` nutzt lokalen Arbeitsspeicher.
    *   *Problem*: Bei Deployment von >1 Instanz (Skalierung) sind die Caches asynchron. Neustarts leeren den Cache sofort, was zu Lastspitzen beim Wiederanlauf führt.
    *   *Empfehlung*: Ersatz durch Redis (oder Supabase Cache), um Zustand unabhängig vom App-Server zu halten.
3.  **Hardcodierte `resorts.json`**: Die Stammdaten (Namen, Koordinaten) liegen im Code.
    *   *Problem*: Änderungen (z.B. Tippfehler, neue URL) erfordern einen Git-Commit & Deploy.
    *   *Empfehlung*: Verlagerung der Stammdaten in die Postgres-DB (Supabase), editierbar via Admin-UI.

## 🚧 Die größten Hürden

### 1. Wartung (Höchstes Risiko)
Das Projekt steht und fällt mit der Datenqualität. Da HTML-Scraping genutzt wird, bricht das System, sobald Skigebiete ihre Webseiten ändern.
*   **Lösung**: Stärkere Entkopplung, Monitoring auf "Stale Data" (nicht nur Error), und aggressive Suche nach stabilen JSON-APIs statt HTML-Parsing.

### 2. Skalierbarkeit
Der aktuelle Scheduler (`pLimit(5)`) und der lokale Cache begrenzen die Skalierbarkeit.
*   **Engpass**: Wenn wir auf 200+ Gebiete erweitern, dauert ein kompletter Durchlauf zu lange.
*   **Lösung**: "Queue-Worker-Pattern". Der Scheduler pushed Jobs (z.B. "Update Zugspitze") in eine Queue (Redis/Supabase), und Worker arbeiten diese parallel ab.

### 3. Sicherheit
*   **Auth**: `basic-auth` mit *einem* globalen Passwort ist unsicher für Kollaboration.
*   **Lösung**: Umstellung auf JWT oder Supabase Auth für den Admin-Bereich.

### 4. Performance
*   **API Limits**: Die Abhängigkeit von externen APIs (TomTom) führt schnell zu Quota-Problemen (wie bereits erlebt).
*   **Lösung**: Intelligenteres Caching der Verkehrsdaten (z.B. nur bei Nutzer-Interaktion oder seltener für entfernte Gebiete) und serverseitiges Caching der TomTom-Antworten (schon teilweise implementiert, aber ausbaubar).
