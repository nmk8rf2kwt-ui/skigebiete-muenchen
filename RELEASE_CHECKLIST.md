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
