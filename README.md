# 🏔️ Skigebiet-Finder v1.3

![CI/CD](https://github.com/YOUR_USERNAME/skigebiete-muenchen/workflows/CI%2FCD%20Pipeline/badge.svg)

Live-Ranking der besten Skigebiete rund um München mit Echtzeit-Daten und detailliertem Tracking.

## ✨ Features

### Live-Daten & Tracking
- ✅ **Live-Daten**: Aktuelle Lift-Status und Schneehöhen für 16+ Skigebiete
- 🚡 **Detailliertes Lift-Tracking**: 350+ Lifte mit Status, Typ, Länge und Höhe
- ⛷️ **Pisten-Details**: 600+ Pisten mit Schwierigkeitsgrad und Metadata
- 📋 **Details-Modal**: Vollständige Übersicht aller Lifte und Pisten pro Skigebiet
- 📊 **Historische Trends**: 7-Tage Verlauf der Lift-Verfügbarkeit

### Navigation & Verkehr
- 🚦 **Verkehrs-Check**: Split zwischen Standard-Fahrzeit und aktueller Verkehrslage (Live Traffic)
- 🚗 **Personalisierte Fahrzeiten**: Berechnung von Ihrem Standort
- 🧭 **Direkte Navigation**: One-Click Google Maps Routing zu Talstationen

### Wetter & Bedingungen
- 🌤️ **Wetter & Schnee Kombi**: 3-Tage Vorhersage und detaillierte Schneehöhen (Berg/Tal)
- ❄️ **Daten-Fallback**: Automatische Wetter-API Daten wenn Skigebiet-Infos fehlen
- 📷 **Webcams**: Direktlinks zu Live-Webcams

### Preise & Klassifizierung
- 💶 **Preis-Details**: Detaillierte Preise für Erwachsene, Jugendliche und Kinder (Tooltip)
- ℹ️ **Schwierigkeitsgrad-Legende**: Interaktiver Tooltip erklärt die Klassifizierungen (Familie, Genuss, Sportlich, etc.)
- 📋 **Kategorien**: Gruppierte Tabellen-Header für bessere Übersicht

### Visualisierung
- 🗺️ **Interaktive Karte**: Leaflet-basierte Visualisierung aller Skigebiete
- 📈 **Trend-Charts**: Chart.js Visualisierung der historischen Daten

### Technisch
- 🔒 **Rate Limiting**: Schutz vor API-Missbrauch
- 📱 **Mobile Responsive**: Optimiert für alle Geräte
- 🎯 **Smart Scoring**: Intelligentes Ranking basierend auf Distanz, Pisten, Liften und Preis
- 📡 **Status Logging**: Detailliertes Update-Log im Frontend

## 📊 Daten-Abdeckung

- **16 Skigebiete** mit detailliertem Tracking
- **350+ Lifte** mit Status und Metadata
- **600+ Pisten** mit Schwierigkeitsgrad
- **8 Skigebiete** mit vollständigen Metadata (Länge, Höhe, Betriebszeiten)

## Tech Stack

- **Frontend**: Vanilla JS, Leaflet.js, Chart.js
- **Backend**: Node.js, Express
- **APIs**: OpenRouteService, Open-Meteo, Micado, Intermaps
- **Deployment**: GitHub Pages + Render.com
- **CI/CD**: GitHub Actions
- **Testing**: Jest (34 Tests)

## Development

```bash
# Backend starten
cd backend
npm install
npm start

# Frontend
# index.html mit Live Server öffnen
```

## Testing

```bash
# Unit Tests
cd backend
npm test

# Parser Tests
npm run test:parsers
```

## Deployment & Release

- Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für detaillierte Anweisungen.
- Siehe [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) für QA-Workflow vor jedem Release.

## Roadmap

Geplante Features und Verbesserungen sind im [BACKLOG.md](./BACKLOG.md) dokumentiert.

## CI/CD Pipeline

Jeder Push auf `main` triggert:
1. ✅ Unit Tests (34/34 passing)
2. ✅ Linting
3. ✅ Server Startup Test
4. 🚀 Auto-Deploy (Render + GitHub Pages)

## License

MIT
