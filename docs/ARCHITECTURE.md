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
    - `js/app.js`: Application State, Event Listeners, API Client (Controller).
    - `js/weatherChart.js`: Visualization Logic.

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
