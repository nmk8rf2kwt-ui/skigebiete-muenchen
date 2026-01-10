# API Reference

**Base URL**: `/api` (Production: `/api`, Dev: `http://localhost:3000/api`)

## 🔐 Authentication

-   **Public**: Most GET endpoints (`/resorts`, `/weather`).
-   **Admin**: Endpoints starting with `/admin/*` require **HTTP Basic Auth**.
    -   Credentials are set via `ADMIN_USER` and `ADMIN_PASS` env vars.

---

## 🏔 Resourse Endpoints

### `GET /resorts`
Returns live status for all ski resorts.
-   **Response**: Array of Resort Objects (Status, Lifts, Weather).

### `GET /lifts/:resortId`
Returns detailed lift & slope status for a specific resort.

### `GET /weather`
Returns cached weather for all resorts.

### `GET /traffic`
Returns current traffic delay relative to Munich.

---

## 📊 Analytics Endpoints

### `GET /history/:resortId`
Returns 30-day historical snapshots.

### `GET /traffic-analysis/:resortId`
Returns congestion analysis (Avg delay per hour/day).
-   **Query**: `?days=7` (Default)

---

## ⚙️ System & Admin

### `GET /status`
Public health check. Returns component status (DB, Scraper, Cache).

### `GET /admin/dashboard`
**Auth Required**. HTML Dashboard for monitoring.
-   Logs
-   Parser Status
-   Cache Control

### `POST /admin/parsers/refresh/:id`
**Auth Required**. Forces an immediate scrape for a resort.

### `GET /admin/usage`
**Auth Required**. Returns API usage statistics.
