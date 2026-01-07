# Changelog

All notable changes to this project will be documented in this file.


## [1.7.3] - 2026-01-08

### Fixed
- **Sentry Integration**: Fixed Sentry SDK initialization errors that prevented error tracking from working correctly.
  - Updated `js/sentry-config.js` to use the Sentry loader's `onLoad` callback instead of polling, ensuring the SDK is fully loaded before initialization.
  - Added `browser.sentry-cdn.com` to the Content Security Policy (CSP) `script-src` directive in `backend/index.js` to allow the full SDK bundle to load.
  - Resolved `TypeError: window.Sentry.setUser is not a function` error that appeared on page load.
- **Error Handling**: Application now properly initializes Sentry Session Replay for enhanced debugging capabilities.

## [1.7.2] - 2026-01-08

### Austrian Resort Expansion

### Added
- **4 Major Austrian Resorts** (Intermaps API):
  - ✅ **Saalbach Hinterglemm Leogang Fieberbrunn** (72 lifts) - One of Austria's largest ski areas
  - ✅ **Schladming-Dachstein** (83 lifts) - Home of the Nightrace
  - ✅ **Obertauern** (26 lifts) - High-altitude snow-sure resort
  - ✅ **Sölden** (31 lifts) - Glacier skiing paradise
- **+212 tracked lifts** across these 4 resorts
- **Intermaps JSON API integration** - Reusable helper for future resorts

### Changed
- **Coverage**: 38/60 resorts now live (63%, up from 56%)
- **Austria**: 17/37 Austrian resorts implemented (46%, up from 35%)

## [1.7.1] - 2026-01-07

### Traffic Tracker & Workflow Fix
- **Workflow**: Migrated the "Traffic Tracker" GitHub Action from legacy CSV logging to **Supabase persistence**.
- **Automation**: Updated `scripts/update_travel_times.mjs` to fetch the full TomTom Matrix (5 Cities x 34+ Resorts) and sync results to the database synchronously.
- **Consistency**: The workflow now automatically keeps the local `backend/resorts.json` in sync with the latest Munich-base travel times to ensure high performance for initial client loads.
- **Stability**: Fixed broken references to non-existent scripts and removed redundant CSV commit steps.

## [1.7.0] - 2026-01-07
- **Architecture**: Implemented a **Service Layer Pattern** with hierarchical folders (`weather/`, `resorts/`, `system/`) to improve separation of concerns and maintainability.
- **Consolidation**: Reduced redundant and fragmented route files from 10 to 6, grouping related endpoints into unified controllers (e.g., Resorts + Lifts, Weather Forecast + Historical Weather).
- **Monitoring**: Unified system status, database health, and webcam monitoring into a single `system/monitoring.js` service.
- **Compatibility**: Preserved 100% backward compatibility for all API endpoints through a multi-router strategy in consolidated files.
- **Stability**: Refactored internal dependencies and updated the full test suite to align with the new directory structure.

### Frontend Modularization
- **Organization**: Refactored the monolithic `js/app.js` into a modular structure with dedicated files for event handling (`js/events.js`) and modal management (`js/modals.js`).
- **Readability**: Reduced `js/app.js` complexity significantly, focusing it on core data orchestration and state synchronization.
- **Maintainability**: Centralized event listeners and modal logic to simplify future feature additions and debugging.

## [1.6.6] - 2026-01-07

### Security & Hardening (ISO 25010 Audit)
- **Security**: Closed broken access control on `/api/db-health` by adding Basic Auth protection.
- **Security**: Hardened static file serving via explicit whitelist to prevent source code exposure.
- **Performance**: Refactored `usageTracker` to use non-blocking buffered Async I/O for better responsiveness.
- **Architecture**: Decoupled routing into `lifts.js`, `resorts.js`, `traffic.js`, and `locating.js` (SRP).
- **Geocoding**: Reverted geocoding to **OpenRouteService (ORS)** to protect TomTom quota as requested.
- **Testing**: Enable root `npm test` for unified CI/CD workflow.

### Fixed
- **package.json**: Updated repository username from `YOUR_USERNAME` to `nmk8rf2kwt-ui`.
- **package.json**: Corrected entry point from `eslint.config.js` to `eslint.config.mjs`.
- **Admin Dashboard**: Updated webcam monitoring API endpoints from `/api/admin/webcams` to `/api/status/webcams`.

## [1.6.5] - 2026-01-07

### Fixes & Backlog Cleanups

### Corrected
- **Webcams**: Fixed faulty webcam URL for **Ski Juwel Alpbachtal**.
- **Resort Manager**: Improved "Force Update" logic for better error handling.

### Confirmed (Backlog Audit)
- **Multi-City Traffic**: Verified backend implementation (collecting data for 8 cities).
- **Traffic Analysis**: Verified background service implementation.
- **Resort Status**: Update Implementation Status to 34 implemented / 26 pending.

## [1.6.5] - 2026-01-07

### Improvements
- **UX**: Added subtle admin dashboard link (gear icon) to the header.

## [1.6.4] - 2026-01-07

### Admin Dashboard Extended

### Added
- **Webcam Monitor Dashboard**: Visual overview of webcam health in `/admin/dashboard.html` with error details and check trigger.
- **Scraper Control Center**: Status table for all data fetchers with "Force Refresh" capability per resort.
- **Log Viewer**: Integrated server log viewer (Live-Tail) directly in the admin interface.
- **System Stats**: Cache size visualization and "Clear Cache" buttons for Parser, Weather, and Traffic data.
- **Webcam Integrity**: Comprehensive audit and fixing of all 60 webcam links.
- **Monitoring Service**: Backend service checking webcam availability every 6 hours, utilizing anti-blocking techniques to ensure reliability. Status visible in Admin Dashboard.

### Changed
- **Admin API**: Added endpoints `/api/admin/system`, `/api/admin/logs`, and `/api/admin/parsers/refresh`.


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
