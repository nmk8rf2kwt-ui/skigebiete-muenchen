# Monitoring & Error Tracking Concept

## 🎯 Objective
To eliminate blind spots in production errors and provide real-time insights into system health, preventing outages caused by configuration issues (CORS, Rate Limiting) or runtime exceptions.

## 1. Sentry Integration (Error Tracking)

### Frontend (User Browser)
**Goal**: Catch runtime JS errors, failed fetches, and performance issues on user devices.

**Implementation**:
1.  **Create Project**: `skigebiete-frontend` in Sentry.
2.  **Install SDK**:
    ```html
    <script src="https://js.sentry-cdn.com/YOUR_PUBLIC_KEY.min.js" crossorigin="anonymous"></script>
    ```
3.  **Configuration**:
    ```javascript
    Sentry.init({
      dsn: "YOUR_DSN",
      integrations: [new Sentry.BrowserTracing()],
      tracesSampleRate: 1.0, // 20% in production
      replaysSessionSampleRate: 0.1,
    });
    ```
4.  **Custom Context**: Tag errors with `API_BASE_URL` to debug env mismatches.

### Backend (Node.js/Express)
**Goal**: Catch crashed processes, database connection failures, and unhandled logic errors.

**Implementation**:
1.  **Create Project**: `skigebiete-backend` in Sentry.
2.  **Install**: `npm install @sentry/node @sentry/profiling-node`
3.  **Setup (index.js)**:
    ```javascript
    import * as Sentry from "@sentry/node";
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    
    // RequestHandler creates a separate execution context using domains
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
    
    // ... all controllers ...

    // The error handler must be before any other error middleware
    app.use(Sentry.Handlers.errorHandler());
    ```

## 2. Enhanced Logging (Application)

We have already migrated to `Winston`. Next steps:

1.  **Structured JSON Logs**: Ensure all logs in production are JSON for ingestion by log analysis tools.
2.  **Correlation IDs**: Add a `X-Request-ID` header to trace requests from Frontend -> Backend -> Database.
3.  **Log Retention**: Stream logs from Render to a persistent service (e.g., Papertrail or Datadog) since Render logs are ephemeral.

## 3. Rate Limit & CORS Visibility

**Problem**: 429 and CORS errors are client-side or infrastructure-level, often invisible to backend logs.

**Solution**:
1.  **Frontend Instrumentation**:
    *   Catch `fetch` errors.
    *   If `status === 429` or `TypeError: Failed to fetch` (CORS/Network), explicitly send a Sentry event.
    *   `Sentry.captureMessage("Rate Limit Exceeded", { level: "warning" });`
2.  **Backend Instrumentation**:
    *   Log blocked CORS requests (done in recent fix).
    *   Log Rate Limit hits (requires custom middleware or inspecting `express-rate-limit` events if available, or just monitoring 429s in ingress).

## 4. Uptime & Smoke Tests

**Already Implemented**:
*   `/api/status` endpoint.
*   Database Health Checks.

**New**:
*   **GitHub Action Smoke Test**: Checks availability after deployment.
*   **External Pinger**: Use UptimeRobot or BetterStack to ping `/api/status` every 5 min.

## 5. Action Plan

1.  [x] **Phase 1**: Improve Frontend Error Messages (Done).
2.  [x] **Phase 2**: Smoke Test Workflow (Done).
3.  [ ] **Phase 3**: Register Sentry Account (Free Tier).
4.  [ ] **Phase 4**: Add Sentry DSN to Environment Variables.
5.  [ ] **Phase 5**: Deploy Sentry SDKs.
