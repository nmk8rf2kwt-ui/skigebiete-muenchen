# Operations & Monitoring

## 🎯 Objectives
-   **Zero Blind Spots**: Real-time visibility into errors.
-   **Data Integrity**: Continuous traffic/weather collection.
-   **Cost Control**: Stay within Supabase Free Tier (500MB).

---

## 1. Error Tracking (Sentry)

### Frontend
Catches runtime JS errors on user devices.
-   **Config**: `js/app.js`

### Backend
Catches process crashes and unhandled exceptions.
-   **Config**: `backend/index.js` (Express Middleware)

---

## 2. Logging (Winston)

We use **file-based logging** to avoid database load/costs.

### Log Locations
-   **Directory**: `backend/logs/`
-   **Files**:
    -   `error-YYYY-MM-DD.log`: Critical errors.
    -   `combined-YYYY-MM-DD.log`: General info (Production: WARN+, Dev: DEBUG+).
    -   `scraper-*.log`: Parser specific outputs.

### Accessing Logs (Production)
1.  **Render Dashboard**: "Logs" tab (Last 7 days).
2.  **Admin Dashboard**: `/admin/logs` (Last 100KB tail).

---

## 3. Database Maintenance (Supabase)

### Free Tier Limits
-   **Storage**: 500 MB
-   **Action**: Weekly cleanup is critical.

### Automated Maintenance
The backend runs a cleanup job every **Sunday at 02:00**:
1.  Deletes `traffic_logs` older than 30 days.
2.  Deletes `resort_snapshots` older than 90 days.

### Manual Cleanup
If storage alert (>90%) triggers:
```http
POST /api/db-health/cleanup
AUTH: Basic [AdminCredentials]
Content-Type: application/json

{ "trafficDays": 10, "snapshotDays": 30 }
```

---

## 4. Incidents & Playbooks

### "Database Full"
1.  Check usage at `/api/db-health`.
2.  Run Manual Cleanup (see above).
3.  Vacuum DB via Supabase SQL Editor.

### "Scrapers Failing"
1.  Check `/api/admin/parsers`.
2.  If specific resort fails consistently: Check `scraper-*.log`.
3.  **Fix**: Update selector in `backend/parsers/[resort].js`.

### "Traffic Data Missing"
1.  Check `traffic-tracker` Action on GitHub.
2.  Verify TomTom API Quota.
