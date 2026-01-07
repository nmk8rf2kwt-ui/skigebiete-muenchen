# Changelog

All notable changes to this project will be documented in this file.

## [1.6.1] - 2026-01-07

### Security & Monitoring

### Added
- **Admin Security**: Added Basic Authentication for `/admin/dashboard.html` and related APIs.
  - Default credentials can be configured via `.env`.
- **API Alerting**: Implemented automated console warnings when API usage reaches 80% and 100%.

### Changed
- **Documentation**: Added `docs/ops/ADMIN_DASHBOARD.md` usage guide.


### API Optimization & Cost Control

### Added
- **Smart Radius Filter**: New slider (50-500km) in the frontend toolbar.
  - Dynamically filters resorts by air distance before requesting traffic data.
  - Defaults to 150km to significantly reduce API calls (75% reduction).
  - Resorts outside the radius are hidden from the list.
- **Admin Dashboard**: New dashboard at `/admin/dashboard.html` for monitoring TomTom API usage.
  - Real-time request tracking (Total, Today, Breakdown).
  - Visualization of usage vs. daily limit (2500 calls).
  - 30-day history chart.
- **API Optimization**: Refactored `/api/traffic/calculate` to accept `resortIds` for targeted calculation.
- **Backend Usage Tracking**: Internal service to track and log every API call to a local JSON database.

### Changed
- **Performance**: Significant reduction in "Matrix API" calls due to client-side pre-filtering.
- **UI**: Added `Radius` control group to the search toolbar.


### Traffic & UI Overhaul

### Added
- **Traffic Precision**: Switched traffic duration and delay handling to seconds (TomTom source) for 100% accuracy.
- **Sentry Session Replay**: Integrated Session Replay for enhanced error debugging with user interaction recordings.
  - Privacy-first configuration with automatic input masking
  - Test button in System Status modal for verification
  - Comprehensive GDPR-compliant documentation
- **Sentry Monitoring**: Integrated Sentry status check into the frontend System Dashboard.
- **Release Guard**: Implemented CI pipeline check (`verify-release.js`) to enforce versioning and changelog updates.
- **Dependabot**: Automated security updates for dependencies.
- **New Columns**: Separate columns for "Weather", "Snow", "Webcam", and "Traffic Delay" (sortable).

### Changed
- **UI Layout**: Reordered table groups (Resort -> Data -> Journey -> Conditions).
- **Difficulty Display**: Moved difficulty classification to the start of the "Resort Data" section.
- **Linting**: Fixed 50+ ESLint issues in frontend and backend code to ensure clean builds.
- **Status Messages**: Deduped and refined loading/traffic status messages for better UX.
- **Scrolling**: Fixed horizontal scrolling issue for wide tables on desktop.

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
