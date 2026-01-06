# Changelog

All notable changes to this project will be documented in this file.

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
