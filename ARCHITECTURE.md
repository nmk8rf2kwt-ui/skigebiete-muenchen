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
│   ├── scripts/             # Maintenance and debugging tools
│   │   ├── debug_parsers.js # Tool to test individual scrapers
│   │   └── seed_history.js  # Tool to generate dummy data for testing
│   ├── data/                # Persisted runtime data (JSON history files)
│   └── utils/               # Shared helpers (network fetchers, etc.)
│
├── css/                     # Frontend Styles
│   └── style.css
│
├── js/                      # Frontend Logic
│   ├── app.js               # Main application controller
│   ├── render.js            # UI Rendering & DOM manipulation
│   └── config.js            # API Configuration
│
└── index.html               # Main Entry Point
```

## Key Components

### Backend
*   **`index.js`**: Orchestrates the server. It handles:
    *   API endpoints (`/api/resorts`, `/api/history`).
    *   Caching layer (in-memory).
    *   Scheduler for fetching weather and snow data.
    *   Saving daily history snapshots.
*   **`parsers/`**: Contains the logic to extract data for each resort. Each file exports a function that returns standardization data (`liftsOpen`, `snow`, `weather`).
*   **`resorts.json`**: The "Source of Truth" for static data (Names, IDs, coordinates, URLs).

### Frontend
*   **`index.html`**: Pure HTML structure.
*   **`app.js`**: Fetches data from the backend APIs and manages application state.
*   **`render.js`**: Pure functions that take data and generate HTML table rows, handling formatting and visual indicators (traffic lights, emojis).

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
