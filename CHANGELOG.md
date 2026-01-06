# Changelog

All notable changes to this project will be documented in this file.

## [1.3.3] - 2026-01-06

### 🚀 Features
- **Time Format**: Travel times now displayed in HH:mm format (e.g., "01:15 h" instead of "75 min")
- **Enhanced Sorting**: All three traffic/travel columns are now sortable:
    - Distance (km)
    - Travel Time (without traffic)
    - Travel Time (with traffic)
- **Mobile View**: Fixed mobile card layout labels to correctly match column data

### 🐛 Fixes
- **CSS**: Removed duplicate mobile CSS rules that caused incorrect labels
- **Sorting**: Added support for `liftsOpen`, `distance_km`, and `traffic_duration` sort keys
- **Snow Sorting**: Improved sorting for snow data when stored as objects (mountain/valley)

## [1.3.2] - 2026-01-06

### 🚀 Features
- **Seasonal Pricing**: Implemented dynamic pricing logic based on season calendars (High/Low/Advantage seasons).
    - **Frontend**: Automatically displays effective price for current date.
    - **Backend**: Updated 26 resorts with 2025/2026 seasonal data.
        - **Kitzbühel**: Premium vs. Saver seasons.
        - **Wilder Kaiser**: Premium vs. Vantage seasons.
        - **Garmisch-Classic**: High vs. Low season.
        - **Ski Juwel**: High vs. Low season.
        - **Hochkössen**: Info on dynamic pricing.

## [1.3.1] - 2026-01-06

### 🚀 Features
- **Extended Pricing**: Added detailed price breakdown (Adult, Youth, Child) for all resorts (2025/2026).
- **UI Update**:
    - "Preis" column now displaying tabular prices vertically.
    - Updated column header to "Preis (Tagesskipass)".
    - Linked prices to official resort pricing pages.

## [1.3.0] - 2026-01-06

### 🚀 Features
- **New Resorts**: Added Oberstdorf/Kleinwalsertal, Oberjoch, and Balderschwang.
- **UI Overhaul**: 
    - Redesigned toolbar layout (Search and Actions in separate rows).
    - Added grouped table headers ("Anreise", "Daten", "Bedingungen").
    - Added timestamp to status query indicator.
- **Weather & Snow**: 
    - Consolidated "Weather & Snow" column with 3-day forecast icons and dates.
    - Added generic **Snow Fallback Service** using Open-Meteo API when resort data is missing.
    - Implemented **Detailed Snow Reports** (Mountain/Valley depth split).
- **Traffic**: 
    - Added **Traffic Data Reset**: Columns clear and show loading state on location change.
    - Improved distance calculation stability.
- **System**: 
    - **Status Logging**: Added detailed per-resort update logs in the system console.
    - **Data Source cleanup**: Removed legacy Bergfex references.

## [1.2.0] - 2026-01-06

### 🚀 Features
- **Live Status Console**: New color-coded log console in frontend providing transparent feedback on data loading, weather updates, and traffic calculations.
- **Detailed Error Handling**: Errors now categorized and displayed with specific messages (e.g. "Backend starting up").
- **User Location**: "Mein Standort" now shows a blue pulsing dot on the map.
- **Traffic**: Added "Open Lifts" sorting and improved traffic calculation logic.

### 🐛 Fixes
- **Steinplatte**: Fixed parser to correctly fetch lift status (previously 0/14).
- **Missing Imports**: Fixed critical crash where `calculateScore` was undefined.
- **CI/CD**: Fixed pipeline failures by moving ESLint to root and updating workflow.

### 🏗️ Chore
- **Refactoring**: Cleaned up root directory (moved docs, scripts).
- **Linting**: Added `eslint.config.mjs` for root-level linting.
