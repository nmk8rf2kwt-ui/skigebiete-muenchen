# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-01-06

### Added
- **Historical Weather Integration**: 
  - Backend service `historicalWeather.js` integrating Open-Meteo Archive API.
  - Automated one-time backfill of 30 days history on startup.
  - New API endpoint `/api/historical-weather/:resortId`.
- **Frontend Enhancements**:
  - Integrated Chart.js for visualizing weather trends (Temperature & Snowfall).
  - Added "Wetter" (Weather) tab to the history modal.
  - Implemented responsive tab navigation with horizontal scrolling on mobile.
  - Added internal scrolling to modals for better mobile experience.
- **System Reliability**:
  - Implemented internal **System Status Dashboard** (`frontend`).
  - Added Backend Event Logging Engine (`statusLogger.js`).
  - Added Real-time Health Checks (Database, Weather API).
  - Fixed `scheduler.js` import error affecting startup.

### Changed
- **Data Access Refactor**: Refactored `backend/routes/history.js` to delegate data access to `backend/history.js`, enforcing separation of concerns.
- **UI Logic**: Consolidated tab switching logic for Lifts, Weather, and Traffic history.

### Fixed
- **Critical**: Resolved `ReferenceError` and `SyntaxError` in `backend/parsers/index.js` due to missing/incorrect imports.
- **Startup**: Fixed `tomtom.js` syntax error preventing service initialization.
- **Startup**: Fixed `scheduler.js` circular import error (`syncCitiesToDatabase`).
