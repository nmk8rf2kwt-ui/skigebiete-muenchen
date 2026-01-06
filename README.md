# 🏔️ Skigebiet-Finder v1.0

![CI/CD](https://github.com/YOUR_USERNAME/skigebiete-muenchen/workflows/CI%2FCD%20Pipeline/badge.svg)

Live-Ranking der besten Skigebiete rund um München mit Echtzeit-Daten.

## Features

- ✅ **Live-Daten**: Aktuelle Lift-Status und Schneehöhen
- 🚦 **Verkehrs-Check**: Split zwischen Standard-Fahrzeit und aktueller Verkehrslage (Live Traffic)
- 💶 **Preis-Details**: Detaillierte Preise für Erwachsene, Jugendliche und Kinder (Tooltip)
- 🚗 **Personalisierte Fahrzeiten**: Berechnung von Ihrem Standort
- 🧭 **Direkte Navigation**: One-Click Google Maps Routing zu Talstationen
- ℹ️ **Schwierigkeitsgrad-Legende**: Interaktiver Tooltip erklärt die Klassifizierungen (Familie, Genuss, Sportlich, etc.)
- 🗺️ **Interaktive Karte**: Leaflet-basierte Visualisierung
- 🌤️ **3-Tage Wettervorhersage**: Detaillierte Wettericons
- 📊 **Historische Trends**: 7-Tage Verlauf
- 🔒 **Rate Limiting**: Schutz vor API-Missbrauch

## Tech Stack

- **Frontend**: Vanilla JS, Leaflet.js, Chart.js
- **Backend**: Node.js, Express
- **APIs**: OpenRouteService, Open-Meteo
- **Deployment**: GitHub Pages + Render.com
- **CI/CD**: GitHub Actions

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

## Deployment

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für detaillierte Anweisungen.

## CI/CD Pipeline

Jeder Push auf `main` triggert:
1. ✅ Unit Tests
2. ✅ Linting
3. ✅ Server Startup Test
4. 🚀 Auto-Deploy (Render + GitHub Pages)

## License

MIT
