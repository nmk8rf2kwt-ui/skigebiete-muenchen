# Release Report v1.2.0

**Date:** 2026-01-06
**Status:** Deployed ✅
**Version:** 1.2.0

## 📝 Summary
Major release focusing on User Experience, Transparency, and Code Hygiene. Introduces a live system status console, improves layout, adds new resorts, and establishes a robust CI/CD pipeline.

## ✨ New Features
1.  **Live Status Console**:
    -   Displays granular real-time logs (Blue: Loading, Green: Success, Yellow: Warning).
    -   Located prominently below the timestamp.
2.  **UI Layout Overhaul**:
    -   Unified Toolbar for Search and Actions.
    -   Responsive design improved for mobile devices.
3.  **New Resorts**:
    -   **Oberaudorf (Hocheck)**
    -   **Kampenwand**
4.  **Traffic Improvements**:
    -   Accurate calculation of delay vs. standard travel time.

## 🐛 Bug Fixes
-   **Steinplatte Parser**: Fixed logic to correctly identify opened lifts (regex/cheerio fixes).
-   **Critical Crash**: Restored missing `calculateScore` import in `app.js`.
-   **CI/CD**: Fixed GitHub Actions pipeline by centralizing linting configuration.

## 🏗️ Technical Improvements
-   **Root Linting**: `eslint.config.mjs` added to project root.
-   **Project Structure**: Cleaned up `docs/`, `scripts/`, `logs/`.
-   **Testing**: Full regression test suite passed.

## 🛡️ Rollback
See `docs/ops/ROLLBACK_PLAN.md` for instructions on reverting to v1.1.
