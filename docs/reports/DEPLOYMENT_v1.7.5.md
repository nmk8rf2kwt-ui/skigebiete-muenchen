# Release Report - Skigebiete-Finder v1.7.5

This release focuses on critical frontend stability, UI alignment fixes for mobile devices, and a major refactoring of the CSS architecture to improve maintainability and performance.

## 🚀 Version Summary
- **Version**: v1.7.5
- **Date**: 2026-01-08
- **Category**: Maintenance, Bugfix & Refactoring

## 🩹 Critical Bug Fixes

### 1. Frontend Sorting Reliability
- **Issue**: Sorting was resetting to "Score (desc)" whenever a header was clicked because current state parameters were not passed to the rendering function.
- **Fix**: Updated `js/app.js` to explicitly pass `sortKey`, `sortDirection`, and `filter` from the store to `renderTable()`.
- **Status**: ✅ Verified with Mock Data and Manual Testing.

### 2. Mobile Table Alignment
- **Issue**: Labels in the responsive "card view" were mismatched due to outdated CSS `nth-child` selectors that didn't account for newly added columns.
- **Fix**: Re-mapped all 17 table columns to their correct semantic labels in `css/style.css`.
- **Status**: ✅ Verified with Mobile Emulator.

## 🧹 Refactoring & Optimization

### 1. CSS Modernization
- **CSS Variables**: Introduced `:root` variables for colors, spacing, and transitions.
- **Consolidation**: Merged multiple scattered media queries into a single unified responsive section.
- **Clean Code**: Removed legacy classes (`.search-container`, `.controls`) that were no longer in use.
- **Improved UI**: Added styles for the loading banner and spinner (previously unstyled).

### 2. Local Environment Improvements
- **Port Separation**: Moved local backend to Port `3000` while keeping the frontend on Port `10000` to avoid conflicts during static serving.
- **Config**: Updated `js/config.js` to auto-detect and use the correct local port.

## 📚 Documentation Updates
- Updated `README.md` with new local development instructions.
- Updated `DEPLOYMENT.md` for v1.7.5 and new port structure.
- Updated `CHANGELOG.md` with detailed patch notes.
- Bumped version numbers in `package.json`, `backend/package.json`, and `index.html`.

## 🧪 Verification Done
- [x] Sorting logic (asc/desc toggle)
- [x] Mobile card display & alignment
- [x] Desktop sticky headers & group highlighting
- [x] End-to-end data fetch (local/prod detection)
- [x] Modal UI consistency (Details, History, Webcams)

---
*Release managed by Antigravity v1.7.5*
