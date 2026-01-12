# Changelog

## [1.9.7] - 2026-01-12
### 🧹 Cleanup
- **Conditional Logging**: Diagnostic logs are now hidden by default to keep the console clean. Use `?debug=true` in the URL to see verbose "Offensive Debugging" logs.
- **Security Check**: Verified that CI/CD pipelines use GitHub Secrets correctly.

## [1.9.6] - 2026-01-12
### 🩹 Hotfix
- **Map Visibility**: Fixed a bug where the map was not initializing because the `initMap` function was not being called in the rendering loop. Accessing the map view now correctly displays tiles and markers.

## [1.9.5] - 2026-01-12
### 🐛 Bug Fixes
- **Static Deployment**: Fixed a duplicate variable declaration in `app.js`.

## [1.9.4] - 2026-01-12
### 🩹 Hotfix
- **CSP & Fallback**: Added `unsafe-inline` for styles and implemented static JSON fallback for API failures (GitHub Pages support).

## [1.9.3-debug] - 2026-01-11

### 🔍 Diagnostic
- **Offensive Debugging**: Injected extensive logging into `load()` and `render()` pipelines to isolate the "blank screen" issue. Look for console groups starting with `🔍 DIAGNOSTIC`.

## [1.9.2] - 2026-01-11

### 🩹 Hotfix
- **Syntax Error Fix**: Fixed a critical `SyntaxError` caused by a misplaced `import` statement in `js/app.js`, which prevented the application from initializing on some devices/browsers.

## [1.9.1] - 2026-01-11

### 🩹 Hotfix
- **Debug Mode Fix**: Resolved an issue where using `?debug=true` or loading from a saved session failed to trigger data fetch `load()`, resulting in an empty view. Added explicit `load()` trigger on initialization.

## [1.9.0] - 2026-01-11

### 🚀 Multi-Domain Expansion
- **Rodeln (Sledding)**: Added dedicated activity with 3 initial sledding spots (Wallberg, Firstalm, Blomberg).
    - Features: Custom reasoning (e.g., "Extra lange Bahn"), specific metrics (Length, Snow), and "SmartScore" adjustments.
- **Skitour**: Added skimo support with new data points (Avalanche Level, Elevation Gain, New Snow).
- **Eislaufen (Skate)**: Added support for Ice Skating rinks (Indoor) and natural lakes (Outdoor).
- **Winterwandern (Walk)**: Added scenic winter walks with difficulty levels and duration metrics.

### 🎨 Wizard & UX
- **Dynamic 3-Step Wizard**:
    - **Step 1 (Location)**: Standard start point.
    - **Step 2 (Activity)**: New picker for 5 activities (Ski, Sled, Tour, Skate, Walk).
    - **Step 3 (Preferences)**: Context-aware preferences (e.g., "Sicher" for Tour, "Indoor" for Skate, "Family" for Sled).
- **State Persistence**: The wizard now remembers your last step and inputs (Location, Activity) if you reload the page.
- **SmartScore 2.0**: The scoring algorithm now adapts to the selected domain (e.g., prioritizing avalanche safety for tours or lift status for skiing).

### 🛠️ Backend
- **New Routes**:
    - `/api/sledding`
    - `/api/skitours`
    - `/api/ice-skating`
    - `/api/winter-walks`
- **Architecture**: Modularized `domainConfigs.js` on frontend to drive UI rendering dynamically.

## [1.7.29] - 2026-01-09

### 🗑️ Removed
- **History Feature**: Removed the "History" column and modal tabs (Lifts/Weather history) from the frontend. The feature was collecting data but rarely used.
- **Backend Cleanup**: Disabled daily snapshot jobs and weather backfill in the scheduler.

### 🚀 Features
- **Traffic Analysis Access**: The congestion trend cell (🟢 5 min) in the "Stau-Trend" column is now **clickable** and opens the Traffic Histogram directly.
- **Parser Type Tooltip**: Hovering over the 🚠 lift icon in the first column now shows which parser type is used (Intermaps JSON, Micado, Bayern-API, etc.).
- **Parser Refresh Fix**: Fixed critical bug where scheduled parser refreshes were passive (read-only). Implemented `refreshAllResorts()` for active data fetching.

### 🎨 UI Improvements
- **Headline**: Simplified to "Skigebiets-Finder" (removed " - Live Ranking").
- **Meta Line**: Removed "Auto-Refresh alle 30 min", replaced "System Status" with 📊 icon.
- **Filter Controls**: Replaced single "Top 3" button with **Top 3 / Top 5 / Top 10** buttons, added "ODER" label, compact radius slider.
- **Sort Controls**: Added dedicated sort row with Score, Schnee, Nähe, Offen, Pisten buttons.
- **Spacing**: Increased gap between controls and table.

### 🛡️ Admin Dashboard
- **Auth Visibility**: Dashboard content is now hidden until authentication succeeds (fixes content showing behind login prompt).
- **API Boxes**: Separated TomTom (with limit tracking) and ORS Geocoding into distinct monitoring cards.
- **Sentry Status**: Fixed missing `monitoring.sentry` field in `/api/status` response.

### 🗂️ New Files
- `backend/parsers/parserTypes.js`: Mapping of resort IDs to parser implementation types.

## [1.7.28] - 2026-01-08

### 🛡️ Features
- **API Limit Monitoring**: Enhanced backend to explicitly detect "Quota Exceeded" (403) errors from TomTom.
- **Admin Dashboard**: The "API Usage" widget now displays a **CRITICAL** alert if the API reports it is blocked, regardless of the local request counter. This prevents false "Normal Usage" reports when limits are hit unexpectedly.

## [1.7.27] - 2026-01-08

### 🩹 Bug Fixes
- **Traffic Data Display**: Fixed an issue where "Air Distance" (km) was overwriting "Travel Time" (min) data when the Traffic API failed.
- **Smart Fallbacks**:
    - **Distance**: Now gracefully falls back to "Luftlinie" (Air Distance) with a unique icon (✈️) if road data is unavailable.
    - **Time**: Static Munich travel times are now strictly hidden when searching from other locations (e.g. Stuttgart) to prevent misleading data.

## [1.7.26] - 2026-01-08

### 🩹 Bug Fixes
- **Geocoding**: Fixed a parameter mismatch where the frontend sent `query` but the backend expected `q`. Geocoding now works correctly for searches like "Stuttgart".
- **Backend Robustness**: Updated geocoding endpoint to accept both `q` and `query` parameters to prevent future regressions.

## [1.7.25] - 2026-01-08

### 📡 System Fixes (Hotfix)
- **TomTom Usage Tracking**: Fixed a critical bug in usage accounting. The system now correctly counts **transactions** (Destinations × Origins) instead of single requests. This ensures the dashboard accurately reflects consumption against the 2500 credit limit.
- **Dashboard Layout**: 
    - Moved "Server Logs" section to the top left.
    - Moved "System & Cache" section to the top right.

## [1.7.23] - 2026-01-08

### 🚦 API Usage Tracking
- **Explicit Differentiation**: Dashboard now clearly separates API usage by provider:
    - **TomTom Matrix**: Traffic background checks.
    - **TomTom Routing**: Direct routing requests.
    - **OpenRouteService**: Geocoding and directions.
    - **Zero Usage**: Providers with 0 requests are now explicitly shown as 0 instead of hidden.

## [1.7.22] - 2026-01-08

### 🚀 Features
- **Admin Dashboard**: Enhanced "Live Data Status" table with:
    - **Country Column**: Automatically inferred (🇩🇪/🇦🇹) and sortable.
    - **Lift Diff Tracking**: Shows difference in open lifts compared to previous run (e.g., `(+1)` or `(-2)`).
    - **Schedule Info**: Displays "Last Run" timestamp and calculated "Next Run".
- **Backend**: Implemented basic in-memory tracking for lift count history to support diff calculation.

### 🎨 UI Improvements
- **Dashboard Layout**: Reorganized to group related metrics:
    - **Usage Group**: API Usage + 30-Day Trend Chart.
    - **Webcam Group**: Webcam Counter + Broken Webcams List.
    - **Parser Group**: Main table + Server Logs on the left.

### 💄 UI Improvements
- **Admin Dashboard**: Renamed "Scrapers" to "Active Parsers" and added tooltips to clarify that this metric tracks active live-data connections versus static fallback data.

### 🩹 Debugging
- **Admin Dashboard**: Added explicit error reporting to the "System & Cache" widget to identify why it fails to load (e.g., Auth vs Network error).

### 🩹 Bug Fixes
- **Admin Dashboard**: Fixed authentication issue where "System & Cache" widget failed to load on startup. Now correctly uses authenticated requests.

### 🩹 Bug Fixes
- **Admin Dashboard**: Fixed layout issue where the "30-Day API Trend" chart expanded infinitely vertically. Constrained height to 250px.

### 🩹 Bug Fixes
- **Frontend**: Fixed "Distanz" column displaying as "-" when traffic data is unavailable. It now correctly falls back to linear distance.

### 📡 System & Admin
- **API Usage Tracking**: Fixed backend counting logic and standardized provider keys ('tomtom', 'ors').
- **Dashboard**: Added granular breakdown of API requests (TomTom vs ORS) to the Admin Dashboard.
- **Data Persistence**: Verified storage path for usage stats.

## [1.7.15] - 2026-01-08

### 🩹 Bug Fixes
- **Admin Dashboard**: Fixed connectivity issues on GitHub Pages by injecting environment-aware `API_BASE_URL`.
- **Authentication**: Verified and fixed admin authentication flow; dashboard now correctly challenges for credentials.
- **Bug Fix**: Fixed relative API paths causing 404 errors in production context.

## [1.7.14] - 2026-01-08

### 🩹 Bug Fixes
- **Traffic Display**: Fixed an issue where distance and travel time were not displayed (or displayed incorrectly) due to a unit mismatch (seconds vs minutes) and property name mismatch in the API response.
- **Backend Logging**: Standardized traffic logging to database in minutes while keeping frontend cache in seconds for precision.

### ⚡ Performance
- **Admin Dashboard**: Optimized initial load by replacing the full-scrape status check with a fast cache-lookup mechanism. This eliminates the 20-30s delay on startup.

### 🩹 Bug Fixes
- **Authentication**: Fixed "empty dashboard" issue on GitHub Pages by implementing client-side Basic Auth handling. The dashboard now correctly prompts for credentials when accessing the protected backend APIs.

### 🩹 Bug Fixes
- **Sentry Initialization**: Fixed `TypeError: window.Sentry.setUser is not a function` by adding defensive checks for Sentry methods.

## [1.7.17] - 2026-01-08

### 📡 System Fixes
- **Accurate API Accounting**: Fixed TomTom API usage tracking to count **transactions** (Destinations × Origins) instead of single requests. This ensures the usage counter accurately reflects the consumption against the daily quota (2500 transactions).
- **Dashboard**: Breakdown panel will populate as soon as new traffic data is collected.

## [1.7.16] - 2026-01-08

### 📡 System & Admin
- **API Usage Tracking**: Fixed backend counting logic and standardized provider keys ('tomtom', 'ors').
- **Dashboard**: Added granular breakdown of API requests (TomTom vs ORS) to the Admin Dashboard.
- **Data Persistence**: Verified storage path for usage stats.

## [1.7.11] - 2026-01-08

### 💄 UI Improvements
- **Typography**: Increased font size of main table headers ("Skigebiet", "Daten", "Anreise") for better readability.

## [1.7.10] - 2026-01-08

### ⚡ Performance
- **Instant Loading**: Implemented "Stale-While-Revalidate" caching. The app now loads cached data instantly while fetching fresh updates in the background, eliminating the initial blank table.

## [1.7.9] - 2026-01-08

### 🩹 Bug Fixes
- **Map View**: Fixed critical issue where the map was not initializing (black/gray screen) when switching to map mode.
- **Rendering**: Improved map container resizing behavior when toggling views.

## [1.7.8] - 2026-01-08

### 💄 UI/UX Improvements
- **Mobile Layout**: Added "SORTIEREN" label to sorting buttons and increased spacing below them.
- **Desktop Layout**: Moved "Mein Standort" button next to "Suchen" for better accessibility.
- **Terminology**: Renamed "History" to "Historie" for consistency.
- **Details Modal**: Removed redundant "7-Tage Verlauf" chart from the details view (it remains available in the dedicated Historie view).

## [1.7.7] - 2026-01-08

### 🩹 Bug Fixes
- **Radius Filter**: Fixed issue where the distance slider was not applied on initial load.
- **Performance**: Optimized radius filtering to happen purely client-side without triggering redundant API calls.

## [1.7.6] - 2026-01-08

### 🩹 Bug Fixes
- **Traffic API**: Fixed critical "Matrix API failed" error by updating frontend to use correct POST `/api/routing/calculate` endpoint.
- **Backend Stability**: Fixed potential crash in traffic analysis when Supabase credentials are missing (Local Dev).
- **Frontend Robustness**: Added null checks for traffic data processing.

## [1.7.5] - 2026-01-08

### 🩹 Bug Fixes
- **Frontend Sorting**: Fixed a regression where sorting parameters (key, direction) were not passed to the rendering function, causing the table to reset on every click.
- **Mobile Layout**: Corrected misalignment in responsive card view where labels (e.g., "Distanz") were showing data from incorrect columns like "Schwierigkeit".

### 🧹 Refactoring
- **CSS Architecture**: Major cleanup of `style.css`. Introduced CSS variables for colors and spacing, consolidated media queries, and removed legacy/unused CSS classes.
- **Loading UI**: Added explicit styling for the loading banner and spinner.

## [1.7.4] - 2026-01-08


### 🔒 Security
- **CRITICAL**: Added HTTP Basic Authentication to all `/api/admin/*` endpoints
- **CRITICAL**: Removed hardcoded default credentials from source code
- Fixed admin dashboard link in frontend (now uses correct relative path for GitHub Pages)
- Enhanced security warnings and error handling for missing credentials
- Created comprehensive admin dashboard documentation
- Application now requires `ADMIN_USER` and `ADMIN_PASS` environment variables to be set

### 📝 Documentation
- Added `docs/ADMIN_DASHBOARD.md` with complete admin dashboard guide
- Updated `DEPLOYMENT.md` with admin credentials setup instructions
- Documented authentication mechanism and security best practices
- Removed all references to default credentials

### ⚠️ Breaking Changes
- Admin dashboard now requires authentication (username/password prompt)
- **Action Required**: Set `ADMIN_USER` and `ADMIN_PASS` environment variables in Render.com and local `.env`
- Application will not start in production without these environment variables set

---

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
