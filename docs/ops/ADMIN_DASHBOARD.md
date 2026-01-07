# 📡 Admin Dashboard & API Monitoring

**Version:** 1.0 (Skigebiete München v1.6.1)
**URL:** `/admin/dashboard.html`

Das Admin Dashboard dient zur Überwachung der **TomTom API Auslastung** und stellt sicher, dass das tägliche Kostenlimit (2.500 Requests) nicht unbemerkt überschritten wird.

---

## 🔐 Zugriff

Der Bereich `/admin` ist per **Basic Authentication** geschützt.

**Standard-Zugangsdaten:**
- **User:** `admin`
- **Password:** `skigebiete2026`

**Konfiguration:**
Sie können die Zugangsdaten in der `.env` Datei ändern:
```bash
ADMIN_USER=meinUser
ADMIN_PASS=meinSicheresPasswort
```

---

## 📊 Features

### 1. Dashboard (`/admin/dashboard.html`)
Eine zentrale Kommandozentrale für den Betrieb der Anwendung.

**Komponenten:**

#### 🚦 API Usage (TomTom)
- **Live-Status:** Zeigt die Anzahl der heutigen Requests an.
- **Limit-Warnung:** Visueller Alarm bei > 75% Auslastung.
- **Historie:** 30-Tage Trendanalyse.
- **Breakdown:** Detailansicht der Request-Typen.

#### 📷 Webcam Monitor
- **Status:** Zeigt sofort, wie viele Webcams erreichbar sind.
- **Fehler-Liste:** Listet defekte Webcams mit HTTP-Statuscode (z.B. 404, 500).
- **Check-Button:** `Check Now` prüft alle URLs in Echtzeit.

#### 🕷️ Scraper Status (Parser)
- **Status-Matrix:** Zeigt für jedes Skigebiet:
  - **Status:** Live (🟢), Error (🔴) oder Static (🔵).
  - **Lifts:** Anzahl offener Lifte.
  - **Source:** Letztes Update (Cache vs. Fresh).
- **Action:** `🔄` Button erzwingt ein sofortiges Neuladen der Daten für ein spezifisches Skigebiet ("Force Refresh").

#### ⚙️ System & Cache
- **Cache Stats:** Zeigt die Größe der In-Memory Caches (Parser, Weather, Traffic).
- **Maintenance:** Buttons zum Leeren der Caches (`Clear Cache`).
- **CSV Status:** Überwacht die Größe der `traffic_history.csv`.

#### 📜 Server Logs
- **Live Tail:** Zeigt die letzten 100 Zeilen der Server-Logs (`combined` oder `error`).
- Kann direkt im Browser eingesehen werden, ohne SSH-Zugriff.

---

### 2. Monitoring Alerts & Sicherheit
- **Logs:** Automatische Warnungen in `backend/logs/` bei API-Limit Annäherung (80%/100%).
- **Auth:** Basic Auth Schutz für alle Admin-Bereiche.
- **Security Check:** Warnung beim Start, falls Default-Passwort genutzt wird.

### 3. API Optimization (Smart Radius)
(Unverändert)

