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
- **Live-Status:** Zeigt die Anzahl der heutigen Requests an.
- **Fortschrittsbalken:** Visualisiert die Auslastung (Grün < 75%, Gelb > 75%, Rot > 90%).
- **Historie:** Balkendiagramm der letzten 30 Tage.
- **Breakdown:** Aufschlüsselung nach Request-Typ:
  - `routing_sync`: Einzelne Routenberechnungen
  - `matrix_batch`: Optimierte Matrix-Abfragen (1 Request = bis zu 100 Ziele!)
  - `geocode`: Adresssuche

### 2. Monitoring Alerts
Das Backend überwacht jeden API-Call und gibt Warnungen in den Server-Logs aus:

- **⚠️ WARNING (80%):** Bei 2.000 Requests/Tag.
- **🚨 CRITICAL (100%):** Bei 2.500 Requests/Tag.

### 3. API Optimization (Smart Radius)
Seit v1.6.0 wird client-seitig ein **Radius-Filter** (Slider) eingesetzt.
- **Funktion:** Vor der Abfrage an TomTom wird die Luftlinie geprüft.
- **Effekt:** Nur Skigebiete im Radius (Standard 150km) erzeugen API-Last.
- **Ersparnis:** Reduziert die API-Calls um ca. 75% pro User-Suche.

---

## 🛠️ Troubleshooting

### Login funktioniert nicht
- Überprüfen Sie die `.env` Datei im `backend/` Verzeichnis.
- Starten Sie den Server neu (`npm restart`).

### Dashboard zeigt "ERROR"
- Stellen Sie sicher, dass das Backend läuft.
- Prüfen Sie die Netzwerkkonsole auf 401 Unauthorized Fehler.
- Prüfen Sie die Logs auf Fehler im `usageTracker.js`.

### API Limit erreicht
1. Prüfen Sie im Dashboard, ob es sich um einen einmaligen Spike handelt.
2. Wenn das Limit regelmäßig erreicht wird (siehe "Kostenanalyse 2026"), sollte auf einen Paid-Plan (Pay-As-You-Grow) gewechselt werden.
