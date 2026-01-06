# Changelog

All notable changes to this project will be documented in this file.

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
