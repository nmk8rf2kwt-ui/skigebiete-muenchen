# Project Architecture

## Overview
**Skigebiete München** is a real-time ski resort tracking application composed of a decoupled frontend and backend. 

- **Frontend**: Static HTML/JS served via GitHub Pages or local server.
- **Backend**: Node.js/Express server that aggregates data from various sources (APIs, HTML scraping) and serves it via JSON endpoints.

## Directory Structure

```graphql
.
├── backend/                 # Node.js Application (Server & Scrapers)
│   ├── index.js             # Main entry point (Express App + Schedules)
│   ├── resorts.json         # Static configuration of all supported resorts
│   ├── parsers/             # Individual scrapers/fetchers for each resort
│   ├── routes/              # API Routes
│   ├── services/            # Business logic (Manager, Traffic, etc.)
│   └── tests/               # Backend Unit Tests
│
├── docs/                    # Documentation
│   ├── reports/             # Archived release reports
│   └── TABLE_STRUCTURE.md
│
├── scripts/                 # Root maintenance scripts
│   └── deploy.sh            # Manual deployment helper
│
├── css/                     # Frontend Styles
│   └── style.css
│
├── js/                      # Frontend Logic
│   ├── app.js               # Main application controller
│   ├── render.js            # UI Rendering & DOM manipulation
│   └── map.js               # Map Logic (Leaflet)
│
├── index.html               # Main Entry Point
├── package.json             # Root Tooling (Linting)
└── eslint.config.mjs        # ESLint Configuration
```

## Key Components

### Backend
*   **`index.js`**: Orchestrates the server. It handles:
    *   API endpoints (`/api/resorts`, `/api/history`).
    *   Caching layer (in-memory).
    *   Scheduler for fetching weather and snow data.
    *   Saving daily history snapshots.
    *   **Traffic Calculation**: Handles `POST /api/traffic/calculate` to fetch matrix data from OpenRouteService.
*   **`parsers/`**: Contains the logic to extract data for each resort. Each file exports a function that returns standardization data (`liftsOpen`, `snow`, `weather`).
*   **`resorts.json`**: The "Source of Truth" for static data (Names, IDs, coordinates, URLs, Base Prices).
    *   **New**: Supports `priceDetail` object for Adult/Youth/Child breakdown.

### Frontend
*   **`index.html`**: Pure HTML structure.
*   **`app.js`**: Fetches data from the backend APIs and manages application state.
*   **`render.js`**: Pure functions that take data and generate HTML table rows, handling formatting and visual indicators (traffic lights, emojis).
    *   **`formatDuration()`**: Helper function to convert minutes to HH:mm format (e.g., 75 → "01:15 h")
    *   **Enhanced Sorting**: Supports sorting by distance_km, traffic_duration, and handles snow objects (mountain/valley values)
    *   **Price Display**: Dynamic seasonal pricing based on current date

## Data Flow
1.  **Client** requests `index.html`.
2.  **`app.js`** calls `GET /api/resorts`.
3.  **Backend** checks memory cache.
    *   If missing/stale: Invokes `parsers/*` in parallel (with concurrency limits).
    *   Returns merged Static + Live data.
4.  **Client** renders the table.

## Development & Testing
*   **Run Server**: `cd backend && npm start`
*   **Test Parsers**: `cd backend && npm run test:parsers`
