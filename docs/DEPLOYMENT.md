# Deployment & CI/CD

## 🔄 Pipelines (GitHub Actions)

### 1. Node.js CI (`ci.yml`)
-   **Trigger**: Push to `main`, Pull Requests.
-   **Jobs**:
    -   `build`: Installs dependencies (Root & Backend), runs `eslint`, runs `jest` tests.
    -   `e2e`: Runs Playwright End-to-End tests.
    -   `deploy`: Triggers Render deployment via Deploy Hook (main branch only).
-   **Status**: **Blocking**. Code cannot be merged if this pipeline fails.

#### Required GitHub Secrets
| Secret | Description | Source |
|--------|-------------|--------|
| `RENDER_DEPLOY_HOOK` | Render Deploy Hook URL | Render Dashboard → Settings → Deploy Hook |
| `SENTRY_AUTH_TOKEN` | Sentry API Token (optional) | Sentry → Settings → API Tokens |

**Setup**: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

### 2. Keep-Alive (`keep-alive.yml`)
-   **Trigger**: Schedule (Every 10 mins, 06:00-22:00 CET).
-   **Task**: Pings `/health` endpoint to prevent Render Free Tier from sleeping.

### 3. Traffic Tracker (`traffic-tracker.yml`)
-   **Trigger**: Schedule (Every 30 mins, 06:00-22:00 CET).
-   **Task**: Fetches traffic matrix from TomTom.
-   **Action**: Updates `backend/resorts.json` and syncs traffic logs to Supabase.
-   **Note**: This workflow commits changes back to the repository ("Traffic Update").

### 4. Production Smoke Test (`smoke-test.yml`)
-   **Trigger**: Schedule (Daily 08:00 UTC).
-   **Task**: Pings production API endpoints (`/api/status`, `/api/resorts`) to ensure uptime.

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
