# Architecture & Tech Stack

## 🎯 Overview
**Skigebiet-Finder** is a layered web application designed to provide real-time ski resort data (Status, Weather, Traffic) with a focus on **speed** (<100ms load times), **reliability** (offline-first architecture), and **simplicity** (No-Framework Frontend).

### Core Principles
1.  **Isolation of Volatility**: External scraping logic (`parsers/`) is strictly separated from the stable core to prevent third-party changes from crashing the system.
2.  **Centralized Control**: Logic resides in the Backend Service Layer (`resortManager.js`, `scheduler.js`), not the Frontend.
3.  **Visual Feedback**: The User Interface reflects system state immediately (e.g., traffic congestion, older data).

### 🛡️ Architectural Policies (Strict)
-   **No Client-Side Frameworks**: The Frontend MUST remain **Vanilla JS** + **Bootstrap**. Do not introduce React, Vue, Tailwind, or complex build tools (Webpack/Vite). The goal is separate concerns and instant loading (<100ms).
-   **Offline-First / Zero-DB-Crash**: The Backend MUST start and function even if the Database (Supabase) is unreachable. Core features (`/resorts`) run from config/cache; only history features degrade gracefully.
-   **Log-to-File Only**: Logs MUST exist only on the filesystem (Stdout/File). **Never** write logs to the Database (save the 500MB Free Tier for business data).

### 📏 Coding & Data Standards
-   **Config-Driven**: Adding a resort MUST only involve `resorts.json` and a parser file. Never hardcode resort-specific logic in Core (`app.js`, `index.html`).
-   **English Code, German Data**: Code (Vars, Functions, Comments, Commits) is **Strictly English**. User-facing text and Data (Resort Names) are **German**. No Denglisch!
-   **Atomic Parsers**: Parsers must be pure funtions (fetching -> returning data). They MUST NOT have side effects (DB writes, Global State mutation).

---

## 🏗 System Architecture

### 1. Frontend (View & Controller)
**Location**: `/js`, `index.html`
-   **Technology**: Vanilla JavaScript (ES6+), Bootstrap 5.3, Leaflet Maps.
-   **Responsibility**: Presentation and User Interaction.
-   **Constraint**: No business logic regarding data validity.
-   **Key Files**:
    -   `app.js`: Main controller, State management.
    -   `render.js`: Pure HTML generation functions.
    -   `congestionForecast.js`: Visualizing traffic trends.

### 2. Backend API (Interface)
**Location**: `/backend/routes`
-   **Technology**: Node.js v20, Express v5.
-   **Responsibility**: Routing, Request Validation, Auth (`basic-auth` for Admin).
-   **Constraint**: Routes must be "thin" and delegate to Services.

### 3. Service Layer (Business Logic)
**Location**: `/backend/services`
-   **Responsibility**: Orchestration, Caching, External API coordination.
-   **Modules**:
    -   `scheduler.js`: Manages cron-like tasks (Scrapers, Weather updates).
    -   `resortManager.js`: Source of truth for Resort Data.
    -   `trafficAnalysis.js`: Analyzes historical congestion data.
    -   `cache.js`: In-memory caching logic.

### 4. Data Access Layer (Persistence)
**Location**: `/backend/services/db.js`
-   **Technology**: Supabase (PostgreSQL).
-   **Responsibility**: Long-term storage (Traffic History, Snow Trends).
-   **Constraint**: Direct DB access is forbidden outside this layer.

### 5. Integration Layer (The "Dirty" Edge)
**Location**: `/backend/parsers`
-   **Responsibility**: Scraping external resort websites.
-   **Pattern**: One parser file per resort (or region). Standardization via `intermaps.js` helper.

---

## 🛠 Tech Stack

### Backend Environment
| Component | Version | Rationale |
|-----------|---------|-----------|
| **Node.js** | `v20 (LTS)` | Stability, performance, and native `fetch` support. |
| **Express** | `^5.0.0` | Modern error handling (Async/Await support). |
| **Supabase** | `^2.90` | Managed PostgreSQL with Realtime capabilities. |
| **Winston** | `^3.19` | Structured JSON logging for observability. |

### Frontend Environment
| Component | Version | Rationale |
|-----------|---------|-----------|
| **Vanilla JS** | `ES6+` | Zero-build step, instant load times, no framework overhead. |
| **Bootstrap** | `v5.3` | Reliable grid system and responsive utilities. |
| **Leaflet** | `v1.9.4` | Lightweight mapping alternative to Google Maps. |
| **Chart.js** | `v4.4` | Performant Canvas-based data visualization. |

### Operations & Tooling
| Tool | Usage |
|------|-------|
| **GitHub Actions** | CI/CD (Linting, Tests) and Cron Jobs (Traffic Tracker). |
| **Playwright** | E2E Testing of the Frontend (`tests/e2e/`). |
| **Cheerio** | HTML Parsing for non-API scrapers. |
| **Sentry** | Error Tracking (Frontend & Backend). |
| **GitHub CLI (`gh`)**| Monitoring pipelines and release management. |

---

## 🔄 Data Flow

1.  **Ingestion**: `Scheduler` triggers `Parsers`.
2.  **Processing**: Parsers normalize data -> `ResortService` updates Cache.
3.  **Consumption**: Frontend polls `/api/resorts` -> Updates DOM via `render.js`.
4.  **Archiving**: `TrafficTracker` (GH Action) fetches TomTom data -> Syncs to Supabase.
