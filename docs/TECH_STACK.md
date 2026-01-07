# 🛠️ Tech Stack Documentation

This document provides a detailed overview of the technologies, libraries, and versions used in **Skigebiet-Finder v1.7.0**, along with the rationale for their selection.

## 🖥️ Backend (Node.js)

The backend is built as a lightweight, modular REST API.

| Component | Version | Description & Rationale |
|-----------|---------|-------------------------|
| **Node.js** | `v20 (LTS)` | We use the current Long Term Support (LTS) version to ensure stability, security updates, and compatibility with modern libraries (like `undici`). |
| **Express** | `^5.0.0` | The latest major version of Express. provides improved error handling (async/await support) and simpler routing. |
| **Supabase JS** | `^2.x` | Client library for Supabase (PostgreSQL). Handles database connections, authentication, and realtime subscriptions. |
| **Axios / Fetch** | `Native` | We transitioned to Node 20's native `fetch` (via `undici`) for most external calls, reducing dependencies. |
| **Winston** | `^3.x` | Structured logging library. Essential for generating parseable JSON logs for our dashboard and Sentry. |
| **Jest** | `^29.x` | Testing framework. Used for Unit Tests and Integration Tests of all parsers. |

### External APIs
- **TomTom Matrix API**: Used for calculating precise travel times and traffic delays (batch processing supported).
- **Open-Meteo**: Free, open-source weather API for 3-day forecasts.
- **Sentry**: (Optional) Cloud-based error monitoring and performance tracking.

## 🎨 Frontend (Vanilla JS)

The frontend is designed for speed and simplicity, avoiding heavy framework bundles.

| Component | Version | Description & Rationale |
|-----------|---------|-------------------------|
| **Vanilla JS** | `ES6+` | Standard JavaScript modules (`.mjs` style logic). No React/Vue/Angular overhead ensures <100ms load times. |
| **Bootstrap** | `v5.3` | CSS Framework. Used for grid layout, responsive utilities, and icons (Bootstrap Icons). |
| **Leaflet** | `1.9.4` | Open-source mapping library. Lightweight and mobile-friendly alternative to Google Maps API. |
| **Chart.js** | `4.x` | Canvas-based charting library. Used for rendering "Snow History" and "Traffic Trends" graphs. |

## ⚙️ CI/CD & Infrastructure (GitHub Actions)

We use fully automated workflows for testing and deployment.

| Workflow | Action Versions | Description |
|----------|-----------------|-------------|
| **CI Pipeline** | `v4` | Runs on every push. Uses `actions/checkout@v4` and `actions/setup-node@v4` (Node 20). Runs Linting `eslint` and Tests `jest`. |
| **Traffic Tracker** | `v4` | Scheduled Cron Job (every 30 mins). Uses `v4` actions to reliably execute traffic fetching scripts. |
| **Release Guard** | Custom | A custom Node.js script (`verify-release.js`) that checks for `FIXME` markers and Version/Changelog consistency. |

## 📦 Dependency Management

- **npm**: Used as the package manager (`package-lock.json` ensures deterministic builds).
- **Dependabot**: Configured in `.github/dependabot.yml` to automatically check for updates (weekly) for `npm` and `github-actions`.

## 🔄 Data Architecture

1. **Resort Config**: Stored in `resorts.json` (Git).
2. **Live Data**: Fetched periodically from resort websites (Parsers).
3. **Persisted Data**: Stored in Supabase (Traffic History, Snow History).
4. **Client**: Fetches `resorts.json` static config + realtime status from Backend API.

---

*Last Updated: 2026-01-07 (v1.7.0)*
