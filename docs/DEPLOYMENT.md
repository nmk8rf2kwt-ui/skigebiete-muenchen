# Deployment & CI/CD

## 🔄 Pipelines (GitHub Actions)

### 1. Node.js CI (`ci.yml`)
-   **Trigger**: Push to `main`, Pull Requests.
-   **Jobs**:
    -   `build`: Installs dependencies (Root & Backend), runs `eslint` (Fail on Warning), runs `jest` tests.
    -   `e2e`: Runs Playwright End-to-End tests.
-   **Status**: **Blocking**. Code cannot be merged if this pipeline fails.

### 2. Traffic Tracker (`traffic-tracker.yml`)
-   **Trigger**: Schedule (Every 30 mins, 06:00-22:00 CET).
-   **Task**: Fetches traffic matrix from TomTom.
-   **Action**: Updates `backend/resorts.json` and syncs traffic logs to Supabase.
-   **Note**: This workflow commits changes back to the repository ("Traffic Update").

### 3. Production Smoke Test (`smoke-test.yml`)
-   **Trigger**: Schedule (Daily 08:00 UTC).
-   **Task**: "Pings" the production API key endpoints (`/api/status`, `/api/resorts`) to ensure uptime.

---

## 🌍 Environments

### Frontend (GitHub Pages)
-   **URL**: `https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/`
-   **Deploy**: Automatic on push to `main` (via standard GitHub Pages action).
-   **Config**: Served from root `/`.

### Backend (Render.com)
-   **Type**: Web Service (Node.js).
-   **Build Command**: `cd backend && npm install`
-   **Start Command**: `cd backend && node index.js`
-   **Env Vars**:
    -   `NODE_ENV`: production
    -   `SUPABASE_URL`: [Secret]
    -   `SUPABASE_KEY`: [Secret]
    -   `TOMTOM_API_KEY`: [Secret]
    -   `SENTRY_DSN`: [Secret]

### Database (Supabase)
-   **Region**: Frankfurt (AWS).
-   **Tier**: Free.
-   **Management**: See [OPERATIONS.md](./OPERATIONS.md).
