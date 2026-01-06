# Quality Assurance Checklist

This document defines the standardized check-up process for releasing new versions of **Skigebiet-Finder**.

## 1. Architecture & Code Structure
- [ ] **Directory Structure**: Matches `ARCHITECTURE.md`. No orphaned files.
- [ ] **Dependency Check**: No unused dependencies. Audit ran (`npm audit`).
- [ ] **Separation of Concerns**:
    - Backend: Services, Parsers, Routes are distinct.
    - Frontend: Logic (`app.js`) and Rendering (`render.js`) are separated.
- [ ] **Config**: `resorts.json` contains valid JSON and all active resorts.

## 2. Functionality & Logic
- [ ] **Parser Consistency**: All parsers export `parse(options)` signature.
- [ ] **Error Handling**: Parsers throw Errors (not return null) to allow proper logging.
- [ ] **Schema Validation**: All parser outputs pass `ResortDataSchema` (Zod).
- [ ] **Metadata**: New fields (length, altitude, difficulty) are correctly propagated.
- [ ] **History**: Daily snapshots are saved in `backend/data/`.
- [ ] **Traffic**: Calculation service receives valid coordinates.

## 3. User Interface (UI/UX)
- [ ] **Responsiveness**:
    - Desktop (1920x1080): Table, Map, Header aligned.
    - Mobile (390x844): Table scrolls, columns hide/stack, Modals full width.
- [ ] **Interactivity**:
    - Details Modal opens/closes correctly.
    - Tooltips (Price, Difficulty) work on hover/touch.
    - Sorting works (asc/desc) for all columns.
    - Search filters table instantly.
- [ ] **Visual Feedback**:
    - Loading spinners for async actions.
    - Error messages are user-friendly.
    - "Traffic Light" status indicators (🟢/🔴/⚪) are correct.

## 4. Performance & Reliability
- [ ] **Concurrency**: Backend limits concurrent parser execution (p-limit).
- [ ] **Caching**:
    - Static assets cached.
    - API responses cached in memory (TTL check).
- [ ] **Timeouts**: Parsers respect AbortSignal (cancellation).
- [ ] **Resilience**: App recovers if a single parser fails/crashes.

## 5. Security
- [ ] **CSP**: Content Security Policy allows required domains (Maps, Weather, Analytics).
- [ ] **Rate Limiting**: Enabled on API endpoints.
- [ ] **Input Sanitization**: Query params validated.

## 6. Documentation
- [ ] **README.md**: Up-to-date features and installation instructions.
- [ ] **DEPLOYMENT.md**: Accurate build/deploy steps.
- [ ] **CHANGELOG**: Changes logged for the new version.

## 7. Automated Tests
- [ ] `npm test` (Backend Unit Tests) passing.
- [ ] `npm run test:parsers` (Integration Tests) passing.

## 8. Manual Regression Test Suite (Critical Features)

### 🟢 Core Functionality
- [ ] **Initial Load**:
    - Page loads without console errors.
    - "Stand:" timestamp is valid.
    - Resort table populated (> 0 rows).
    - Status badges (🟢/🔴/⚪) visible.
- [ ] **Data Integrity**:
    - Lift counts match known values (e.g., Kitzbühel > 50).
    - Weather icons present.

### 📍 Geolocation & Search
- [ ] **Search Input**: Accepts text (e.g., "Innsbruck").
- [ ] **Search Button**: Clicking updates "Distanz" and "Fahrzeit".
- [ ] **Mein Standort**: Clicking requests permission and updates table.

### ↕️ Sorting & Filtering
- [ ] **Sorting**:
    - Click "Name" -> A-Z / Z-A.
    - Click "Pisten" -> High-Low / Low-High.
    - Click "Score" -> High-Low.
- [ ] **Top 3 Filtering**:
    - Click "🏆 Top 3".
    - Table shows exactly 3 rows.

### 🗺️ Map Visualization
- [ ] **Map Load**: Map container visible.
- [ ] **Markers**: Pins exist for resorts.
- [ ] **Interactivity**: Clicking pin opens popup.

### 📋 Details & Metadata
- [ ] **Details Modal**:
    - Click "📋" icon -> Modal opens.
    - Sections: "Lifte", "Pisten", "7-Tage Verlauf".
    - History Chart: Canvas rendered.
- [ ] **Tooltips**:
    - Prices: Hover `ℹ️` -> Shows Adult/Youth/Child.
    - Difficulty: Hover Badge -> Shows description.

### 💾 Export & Mobile
- [ ] **CSV Export**: Button works and downloads valid CSV.
- [ ] **Mobile View**: Table stacks/scrolls, Modal fits screen.
