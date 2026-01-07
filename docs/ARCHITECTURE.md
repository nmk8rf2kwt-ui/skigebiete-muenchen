# Architecture & Design Principles

## Overview
This project follows a clean, layered architecture designed to separate stable core logic from volatile external integrations.

## Layering Strategy

### 1. Frontend (View & Controller)
- **Technology**: Vanilla JavaScript, CSS, HTML.
- **Role**: Presentation of data. Does not contain business logic regarding data validity.
- **Key Files**:
    - `index.html`: Structure (Tabs, Modals).
    - `js/render.js`: Pure functions for HTML generation (View Components).
    - `js/render.js`: Pure functions for HTML generation (View Components).
    - `js/app.js`: Application State, Event Listeners, API Client (Controller).
    - `js/weatherChart.js`: Visualization Logic.

### 1.5. Monitoring & Error Handling
- **Role**: System observability and health tracking.
- **Key Components**:
    - **Frontend**: Detailed error diagnostics for Network/CORS failures.
    - **Sentry Integration**: Exception tracking (Concept).
    - **Smoke Tests**: Automated production API validation via GitHub Actions.

### 2. Backend API (Routes)
- **Role**: Routing, Request Validation, HTTP Response Handling.
- **Constraint**: **NO** direct data access (DB/File System) or heavy computation. Delegates to Services.
- **Location**: `backend/routes/`.

### 3. Service Layer (Core Application)
- **Role**: Business Logic, Orchestration, External API Coordination.
- **Key Modules**:
    - `backend/services/resortManager.js`: Managing static and dynamic resort data.
    - `backend/services/scheduler.js`: Orchestrating periodic tasks (Parsers, Weather, Traffic).
    - `backend/services/statusLogger.js`: Event logging and component health tracking (System Status).
    - `backend/services/historicalWeather.js`: Fetching and processing weather data.
    - `backend/services/tomtom.js`: External Traffic API Interface.

### 4. Data Access Layer (DAL)
- **Role**: Persistence. Abstracts the underlying storage mechanism (Supabase: PostgreSQL).
- **Location**: `backend/history.js`.
- **Constraint**: The only module allowed to interact with the database client (`db.js`).

### 5. External Integrations (Dirty Edge)
- **Role**: Parsing 3rd party websites. Isolated due to high volatility.
- **Location**: `backend/parsers/`.
- **Pattern**: Each resort or group has a dedicated parser module. `index.js` acts as the registry.

## Data Flow
`Frontend` -> `API Route` -> `Service` -> `DAL` -> `Database`

## Design Principles
1.  **Isolation of Volatility**: Parsers `backend/parsers/*` are kept separate from the stable core to minimize the impact of website changes.
2.  **Centralized Stability**: Core logic (`scheduler.js`, `resortManager.js`) defines the data shape and flow.
3.  **Clean API Layer**: Routes are thin and declarative.
4.  **No Hidden State**: Frontend consumes explicit APIs. Derived state is calculated in the frontend specific to the view (e.g., traffic color).

## Directory Structure
- `backend/`
  - `parsers/`: Volatile scraping logic.
  - `services/`: Stable core logic.
  - `routes/`: HTTP Interface.
  - `data/`: Storage (Git-ignored content).
- `js/`: Frontend Scripts.

## Traffic Logic & Calculation

To ensure accurate and consistent travel times, we utilize the **TomTom Matrix API** for all routing calculations.

### Core Calculation
Consistency is ensured by deriving both total time and delay from the same source.
- **Duration (`travelTimeInSeconds`)**: Total time *right now*, including traffic.
- **Delay (`trafficDelayInSeconds`)**: Seconds lost due to congestion.
- **Base Time**: Calculated as `Duration - Delay`. This represents the "free-flow" time.

### Formulas (Frontend)
The frontend receives units in **seconds** and processes them as follows:
```javascript
const liveMins = Math.round(duration / 60);
const delayMins = Math.round(delay / 60);
const baseMins = Math.round((duration - delay) / 60);
```

### Data Flow & Automation
1. **Real-time**: Fetched via `backend/services/tomtom.js` upon request or by the scheduler.
2. **Historical Analysis**: Averaged `delay` values aggregated by hour/resort from `traffic_logs` (Supabase).
3. **Traffic Tracker**: A GitHub Action (`traffic-tracker.yml`) runs every 30 mins (06:00-22:00) to fetch a full matrix (Munich + 4 other cities) and sync it to Supabase.
