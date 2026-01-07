# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-01-07

### Infrastructure & Monitoring Update

### Added
- **Traffic Analysis**: Congestion forecasting based on historical data.
- **Database Health**: Automated monitoring and cleanup of Supabase storage.
- **Improved Logging**: Unified Winston logger replacing legacy file logging.
- **Smoke Tests**: Automated GitHub Action for production API verification.
- **Frontend Diagnostics**: Detailed error messages for Rate Limit and CORS issues.

### Changed
- **Rate Limit**: Increased to 1000 req/15min for better user experience.
- **CORS**: Stabilized configuration for GitHub Pages integration.
- **Logging**: Refactored all services to use structured logging.

### Previous 1.4.0 Updates (2026-01-06)
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
