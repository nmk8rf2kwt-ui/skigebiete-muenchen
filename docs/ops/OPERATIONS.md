# Operations & Monitoring Guide

Complete operational handbook for the Skigebiete München platform, covering monitoring, database management, logging, and automated data collection.

## 🎯 Objectives

- **Zero Blind Spots**: Real-time visibility into production errors and system health
- **Proactive Alerts**: Catch issues before they impact users
- **Data Integrity**: Ensure continuous collection of traffic and weather data
- **Cost Control**: Stay within Supabase free tier limits (500 MB)

---

## 1. Error Tracking (Sentry)

### Frontend (Browser)
**Goal**: Catch runtime JS errors, failed fetches, and performance issues on user devices.

**Implementation**:
```html
<script src="https://js.sentry-cdn.com/YOUR_PUBLIC_KEY.min.js" crossorigin="anonymous"></script>
```

**Configuration**:
```javascript
Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0, // 20% in production
  replaysSessionSampleRate: 0.1,
});
```

**Custom Context**: Tag errors with `API_BASE_URL` to debug environment mismatches.

### Backend (Node.js/Express)
**Goal**: Catch crashed processes, database connection failures, and unhandled logic errors.

**Setup** (`backend/index.js`):
```javascript
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... all controllers ...

app.use(Sentry.Handlers.errorHandler());
```

### Activation Guide

**Step 1: Create Sentry Account**
1. Go to [sentry.io](https://sentry.io)
2. Create project "skigebiete-frontend" (Framework: Browser JS)
3. Create project "skigebiete-backend" (Framework: Node.js)
4. Copy the DSNs (API Keys)

**Step 2: Activate Frontend**
1. Open `index.html`
2. Uncomment Sentry script and replace `YOUR_PUBLIC_KEY`
3. Commit & Push

**Step 3: Activate Backend**
1. Add `SENTRY_DSN` to Render Environment Variables
2. Deploy (SDK already installed)

---

## 2. Application Logging (Winston)

### Strategy: Filesystem, Not Database

**Why Files?**
- ✅ **Performance**: No DB load from logging
- ✅ **Independence**: Logs work even during DB outages
- ✅ **Standard Tools**: `tail`, `grep`, `awk` work natively
- ✅ **Automatic Rotation**: Built-in archiving and deletion
- ✅ **Cost**: No database storage costs

### Log Structure

```
backend/logs/
├── combined-2026-01-07.log      # All logs (daily rotation)
├── error-2026-01-07.log         # Errors only (daily rotation)
├── scraper-2026-01-07.log       # Scraper-specific
├── traffic-2026-01-07.log       # Traffic API calls
└── archived/
    ├── combined-2026-01-01.log.gz
    └── error-2026-01-01.log.gz
```

### Retention Policy

| Log Type | Retention | Compression | Purpose |
|----------|-----------|-------------|---------|
| **Error Logs** | 14 days | Yes (gzip) | Error analysis |
| **Combined Logs** | 14 days | Yes (gzip) | Debugging |
| **Scraper Logs** | 7 days | Yes (gzip) | Short-term analysis |
| **Traffic Logs** | 7 days | Yes (gzip) | Performance monitoring |

### Log Levels

```javascript
{
  error: 0,   // Errors requiring attention
  warn: 1,    // Warnings (e.g., API rate limit)
  info: 2,    // Important events (server start, scheduler)
  debug: 5,   // Debugging (development only)
}
```

### Environment-Specific Configuration

**Production:**
- Console: `warn` and `error` only
- Files: `info` and higher
- Rotation: active

**Development:**
- Console: `debug` and higher
- Files: all levels
- Colored console output

### Accessing Logs

**Local:**
```bash
# Live tail all logs
tail -f backend/logs/combined-$(date +%Y-%m-%d).log

# Errors only
tail -f backend/logs/error-$(date +%Y-%m-%d).log

# Search pattern
grep "TomTom" backend/logs/traffic-*.log
```

**Production (Render.com):**
- Render Dashboard → Logs Tab
- Logs retained for 7 days

### Best Practices

1. ✅ **Structured Logs** (JSON format)
2. ✅ **Timestamps** (ISO 8601)
3. ✅ **Context** (component, resortId)
4. ✅ **Rotation** (automatic)
5. ✅ **Retention** (14 days max)
6. ✅ **Compression** (gzip for old logs)
7. ❌ **No Sensitive Data** (passwords, API keys)

---

## 3. Database Monitoring (Supabase)

### Free Tier Limits

**Critical Thresholds:**
- **Database Storage**: 500 MB
- **Bandwidth**: 2-5 GB/month
- **File Storage**: 1 GB
- **Inactivity**: Project pauses after 7 days

### Current Usage Projections

**Traffic Logs:**
- 30,720 entries/day × 100 bytes = 3 MB/day
- Monthly: ~90 MB
- Retention: 30 days

**Resort Snapshots:**
- 60 resorts × 1 snapshot/day × 500 bytes = 30 KB/day
- Monthly: ~900 KB
- Retention: 90 days

**Total Monthly Growth:** ~92 MB (18% of limit) ✅

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **Database Size** | 400 MB (80%) | 450 MB (90%) | Auto-cleanup |
| **Traffic Logs Age** | 30 days | 45 days | Delete old |
| **Snapshots Age** | 90 days | 120 days | Delete old |
| **Connections** | 50 | 100 | Alert admin |

### Automated Maintenance

**Daily Health Check** (03:00):
```javascript
- Check database size
- Log current usage
- Alert if > 80%
```

**Weekly Cleanup** (Sunday 02:00):
```javascript
- Delete traffic logs > 30 days
- Delete snapshots > 90 days
- Vacuum database (if supported)
```

**Monthly Report** (1st of month):
```javascript
- Generate usage report
- Project growth trends
- Estimate time to limit
```

### Monitoring Endpoints

**GET /api/db-health**
```json
{
  "status": "healthy",
  "totalSizeMB": 92.5,
  "percentUsed": 18.5,
  "tables": [
    {
      "table_name": "traffic_logs",
      "row_count": 920000,
      "size_mb": 88.2
    }
  ],
  "alerts": [],
  "lastCleanup": "2026-01-07T02:00:00Z"
}
```

### Alert Actions

**80% Threshold (Warning):**
1. Log warning to status dashboard
2. Email notification (if configured)
3. Schedule cleanup for next maintenance window

**90% Threshold (Critical):**
1. **Immediate** cleanup of old data
2. Critical alert to status dashboard
3. Email + Slack notification
4. Consider upgrading to Pro tier

### Growth Projections

**Scenario 1: Current Usage (15min updates)**
- Month 1: 92 MB (18%)
- Month 2: 184 MB (37%)
- Month 3: 276 MB (55%)
- Month 4: 368 MB (74%)
- Month 5: 460 MB (92%) ⚠️

**Action**: With 30-day retention, size stabilizes at ~90-100 MB ✅

**Scenario 2: 5min updates (future)**
- Month 1: 276 MB (55%)
- Month 2: 460 MB (92%) ⚠️

**Action**: Reduce retention to 10 days or upgrade tier

### Mitigation Strategies

**Short-term (Free Tier):**
1. ✅ 30-day retention for traffic logs
2. ✅ 90-day retention for snapshots
3. ✅ Automated cleanup
4. ✅ Compression (gzip) for old data

**Medium-term (If needed):**
1. Aggregate old data (hourly → daily averages)
2. Export to external storage (S3, etc.)
3. Implement data archiving

**Long-term (Growth):**
1. Upgrade to Pro tier ($25/month)
   - 8 GB database storage
   - 50 GB bandwidth
   - No inactivity pausing
2. Separate analytics database
3. Time-series database for traffic data

### Manual Monitoring (Weekly)

1. Login to Supabase Dashboard
2. Navigate to Project → Database → Usage
3. Check:
   - Database size
   - Bandwidth usage
   - Active connections
4. Review Reports section for trends

### Backup Strategy

**Automated Backups (Supabase):**
- Free tier: Daily backups (7-day retention)
- Pro tier: Point-in-time recovery

**Manual Exports (Monthly):**
```bash
pg_dump -h [host] -U [user] -d [db] > backup.sql
```

### Emergency Contacts

**If database full:**
1. Run immediate cleanup: `POST /api/db-health/cleanup`
2. Check Supabase dashboard
3. Consider temporary upgrade to Pro
4. Contact: support@supabase.com

**Monitoring Tools:**
- Supabase Dashboard: https://app.supabase.com
- Status Page: https://status.supabase.com
- Metrics API: Prometheus-compatible

---

## 4. Automated Data Collection

### Traffic Tracker (GitHub Actions)

**Purpose**: Maintain historical traffic data for trend analysis and ensure `resorts.json` stays current.

**Schedule**: Every 30 minutes, 06:00 - 22:00 CET

**Workflow** (`.github/workflows/traffic-tracker.yml`):
1. Fetch full traffic matrix from TomTom API (8 cities × 60 resorts)
2. Persist to Supabase via `saveMatrixTrafficLog`
3. Update `backend/resorts.json` with Munich-based travel times
4. Commit and push changes if `resorts.json` modified

**Data Sources**:
- **TomTom Matrix API**: Live traffic with delay information
- **Reference Cities**: Munich, Augsburg, Innsbruck, Salzburg, Rosenheim, Stuttgart, Nuremberg, Zurich

**Verification**:
- GitHub Actions logs show success/failure
- Supabase `traffic_logs` table receives new entries
- `resorts.json` git history shows periodic updates

**Failure Handling**:
- Workflow fails if Supabase connection drops
- Alert visible in GitHub Actions UI
- No impact on live frontend (uses cached data)

### Weather Backfill (One-time)

**Purpose**: Populate historical weather data for trend analysis.

**Execution**: Runs once on first server start, then disabled.

**Process**:
1. Check if backfill completed (flag in DB)
2. Fetch 30 days of historical weather for each resort
3. Store in `resort_snapshots` table
4. Mark backfill as complete

---

## 5. Rate Limiting & CORS Visibility

**Problem**: 429 and CORS errors are client-side or infrastructure-level, often invisible to backend logs.

**Solution**:

**Frontend Instrumentation**:
- Catch `fetch` errors
- If `status === 429` or `TypeError: Failed to fetch` (CORS/Network), send Sentry event
- `Sentry.captureMessage("Rate Limit Exceeded", { level: "warning" });`

**Backend Instrumentation**:
- Log blocked CORS requests
- Log Rate Limit hits (via custom middleware or monitoring 429s)

---

## 6. Uptime & Health Checks

**Implemented**:
- `/api/status` endpoint
- Database health checks
- Component status tracking (scheduler, scraper, weather, traffic, database)

**Recommended**:
- **GitHub Action Smoke Test**: Verify availability after deployment
- **External Pinger**: Use UptimeRobot or BetterStack to ping `/api/status` every 5 min

---

## 7. System Status Dashboard

**Endpoint**: `GET /api/status`

**Response**:
```json
{
  "components": {
    "scheduler": "healthy",
    "scraper": "healthy",
    "weather": "healthy",
    "traffic": "healthy",
    "database": "healthy",
    "system": "healthy"
  },
  "database": {
    "connected": true,
    "message": "Connection successful"
  },
  "cache": {
    "parser": { "size": 60, "valid": 58 },
    "weather": { "size": 60, "valid": 60 },
    "traffic": { "size": 60, "valid": 60 }
  },
  "webcams": {
    "summary": { "total": 60, "ok": 55, "error": 5 },
    "lastCheck": "2026-01-07T22:00:00Z"
  },
  "metrics": {
    "db_size_mb": 92.5,
    "db_percent_used": 18.5,
    "traffic_data_points": 30720,
    "traffic_last_update": "2026-01-07T22:30:00Z"
  },
  "logs": [...],
  "uptime": 86400
}
```

---

## 8. Operational Runbook

### Daily Tasks
- ✅ Automated: Weather refresh (hourly)
- ✅ Automated: Traffic matrix update (every 15 min, 06:00-22:00)
- ✅ Automated: Database health check (03:00)

### Weekly Tasks
- ✅ Automated: Database cleanup (Sunday 02:00)
- 🔧 Manual: Review Supabase dashboard
- 🔧 Manual: Check GitHub Actions for failed workflows

### Monthly Tasks
- ✅ Automated: Usage report generation
- 🔧 Manual: Review Sentry error trends
- 🔧 Manual: Manual database export (backup)

### Incident Response

**Database Full (>90%)**:
1. Run `POST /api/db-health/cleanup`
2. Check cleanup results
3. If still critical, reduce retention periods
4. Consider Pro tier upgrade

**Traffic Tracker Failing**:
1. Check GitHub Actions logs
2. Verify Supabase connection
3. Check TomTom API quota
4. Manually trigger workflow if transient

**Parser Errors (>10 resorts failing)**:
1. Check `/api/status` for degraded scrapers
2. Review `backend/logs/scraper-*.log`
3. Identify common failure pattern
4. Update parsers or disable broken ones

**High Error Rate in Sentry**:
1. Review Sentry dashboard
2. Identify error pattern (CORS, API, Logic)
3. Deploy hotfix if critical
4. Monitor post-deployment

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design and data flow
- [API.md](../API.md) - API endpoint reference
- [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) - Admin interface guide
