# 🏔️ Skigebiet-Finder v1.6.6

![CI/CD Pipeline](https://github.com/nmk8rf2kwt-ui/skigebiete-muenchen/actions/workflows/ci.yml/badge.svg)

Live-Ranking der besten Skigebiete rund um München mit Echtzeit-Daten, Verkehrs-Check und detailliertem Tracking.

## ✨ Features

### Live-Daten & Tracking
- ✅ **Live-Daten**: Aktuelle Lift-Status und Schneehöhen für 34+ Skigebiete (DE, AT, IT)
- 🚡 **Detailliertes Lift-Tracking**: 350+ Lifte mit Status, Typ, Länge und Höhe
- ⛷️ **Pisten-Details**: 600+ Pisten mit Schwierigkeitsgrad und Metadata
- 📋 **Details-Modal**: Vollständige Übersicht aller Lifte und Pisten pro Skigebiet
- 📊 **Historische Trends**: Persistente 30-Tage Historie (Supabase DB)
- 💾 **Hybrid-Architektur**: Statische Config (Git) -> Automatischer Sync zu DB (SQL)

### Navigation & Verkehr
- ⏰ **HH:mm Zeitformat**: Fahrzeiten übersichtlich als Stunden:Minuten (z.B. "01:15 h")
- 🔄 **Erweiterte Sortierung**: Alle Verkehrsspalten (Distanz, Standard, Live) sortierbar
- 🚦 **Verkehrs-Check**: Split zwischen Standard-Fahrzeit und aktueller Verkehrslage (Live Traffic)
- 🚗 **Personalisierte Fahrzeiten**: Berechnung von Ihrem Standort (via TomTom Matrix API)
- 🧭 **Direkte Navigation**: One-Click Google Maps Routing zu Talstationen
- 🎯 **Smart Radius**: 150km Radius-Filter (Standard) für kosteneffiziente API-Nutzung.

### Wetter & Bedingungen
- 🌤️ **Wetter & Schnee Kombi**: 3-Tage Vorhersage und detaillierte Schneehöhen (Berg/Tal)
- ❄️ **Daten-Fallback**: Automatische Wetter-API Daten wenn Skigebiet-Infos fehlen
- 📷 **Webcams**: Direktlinks zu Live-Webcams & Health Monitoring.

### Visualisierung & UI
- 🗺️ **Interaktive Karte**: Leaflet-basierte Visualisierung aller Skigebiete
- 📈 **Trend-Charts**: Chart.js Visualisierung der historischen Daten
- 📱 **Mobile Responsive**: Optimiert für alle Geräte (iOS/Android)
- 🎯 **Smart Scoring**: Intelligentes Ranking basierend auf Distanz, Pisten, Liften und Preis
- 📊 **Admin Dashboard**: Zentrale Steuerung (Logs, Cache, Webcams) unter `/admin/dashboard.html`
- 🎥 **Sentry Replay**: Session-Aufzeichnung zur Fehleranalyse (Privacy-konform)

## 🛠️ Tech Stack & Versionen

Eine vollständige Übersicht aller verwendeten Komponenten und Versionen finden Sie in [**docs/TECH_STACK.md**](./docs/TECH_STACK.md).

### Kern-Komponenten
| Komponente | Version | Beschreibung |
|------------|---------|--------------|
| **Node.js** | `v20 (LTS)` | Runtime Environment (Iron) |
| **Express** | `^5.0.0` | Backend Framework (Modernes Error Handling) |
| **Supabase** | `v2.x` | PostgreSQL Datenbank & Realtime Features |
| **GitHub Actions**| `v4` | CI/CD Pipeline (Checkout & Setup-Node v4) |

### Frontend
- **Vanilla JS (ES6+)**: Keine Frameworks, maximale Performance.
- **Leaflet (v1.9.4)**: Kartenintegration.
- **Chart.js (v4.x)**: Datenvisualisierung.
- **Bootstrap (v5.3)**: Styling & Grid System.

## 📚 Documentation & Operations

- [**System Architecture**](./docs/ARCHITECTURE.md)
- [**Tech Stack Details**](./docs/TECH_STACK.md) (✨ Neu)
- [**Implementation Status**](./docs/IMPLEMENTATION_STATUS.md)
- [**Monitoring Concept**](./docs/ops/MONITORING_CONCEPT.md)
- [**API Documentation**](./docs/API.md)

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
# Unit Tests (Jest)
cd backend
npm test

# Release Verification
node scripts/verify-release.js
```

## Deployment & Release

- Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für detaillierte Anweisungen.
- Siehe [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) für QA-Workflow vor jedem Release.

## License

MIT
