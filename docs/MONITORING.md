# System Status & Monitoring Strategy

This document outlines how to monitor the health of the application, from the frontend to the backend services.

## 1. Real-Time Monitoring (Production)

### 🖥️ Admin Dashboard
**URL:** `/admin/dashboard.html`
**Purpose:** Instant overview of all system components.
**Metrics:**
*   **Database:** Connection status & usage.
*   **Scraper:** Status of the last batch run (Healthy/Degraded).
*   **Weather/Traffic APIs:** Connection status.
*   **Logs:** Live view of the last 50 system logs.

### 🛡️ Error Tracking (Sentry)
**Type:** Passive Monitoring
**Frontend:** Captures JS errors, CSP violations, and loading failures.
**Backend:** Captures uncaught exceptions, API timeouts, and database errors.
**Alerts:** Configured to email on spike events.

## 2. "Teststrecke" (Validation Pipeline)

To verify specific components continuously or before release, use the following test suites.

### 🧪 Level 1: Backend Unit Tests (Logic)
Checks internal logic (SmartScore, Data Structure, Caching).
```bash
cd backend
npm test
```

### 🕷️ Level 2: Parser Health (Integration)
Checks if external resort websites have changed their layout. Runs all parsers against live targets.
```bash
cd backend
npm run test:parsers
```

### 🎭 Level 3: Frontend E2E (user-flows)
Simulates a real user clicking through the app (Wizard, Maps, Details).
```bash
# Run all tests
npx playwright test

# Debug specific flow
npx playwright test e2e/home.spec.js --debug
```

## 3. Component Breakdown

| Component | Responsibility | Failure Consequence | Monitoring |
|-----------|---------------|---------------------|------------|
| **Frontend (App.js)** | UI/UX, State Management | App unresponsive | Sentry, E2E Tests |
| **Backend (Express)** | API Routes, Data Serving | No data available | Uptime Robot (Ping `/api/status`) |
| **Services/Scheduler**| Background Jobs (Traffic/Scrape)| Stale data | Admin Dashboard |
| **Parsers** | Fetching Resort Data | Missing/Wrong status | `test:parsers` logs |
| **TomTom API** | Traffic Data | No traffic info | Sentry (API Errors) |
| **Open-Meteo** | Weather Data | No weather/snow info | Sentry (API Errors) |
