# Database Monitoring & Maintenance Strategy

## 🎯 Supabase Free Tier Limits

### Critical Limits
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

## ⚠️ Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **Database Size** | 400 MB (80%) | 450 MB (90%) | Auto-cleanup |
| **Traffic Logs Age** | 30 days | 45 days | Delete old |
| **Snapshots Age** | 90 days | 120 days | Delete old |
| **Connections** | 50 | 100 | Alert admin |

## 🔧 Automated Maintenance

### Daily Health Check
```javascript
// Runs at 03:00 daily
- Check database size
- Log current usage
- Alert if > 80%
```

### Weekly Cleanup
```javascript
// Runs Sunday 02:00
- Delete traffic logs > 30 days
- Delete snapshots > 90 days
- Vacuum database (if supported)
```

### Monthly Report
```javascript
// First day of month
- Generate usage report
- Project growth trends
- Estimate time to limit
```

## 📊 Monitoring Endpoints

### GET /api/db-health
Returns current database health status:
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

## 🚨 Alert Actions

### 80% Threshold (Warning)
1. Log warning to status dashboard
2. Email notification (if configured)
3. Schedule cleanup for next maintenance window

### 90% Threshold (Critical)
1. **Immediate** cleanup of old data
2. Critical alert to status dashboard
3. Email + Slack notification
4. Consider upgrading to Pro tier

## 📈 Growth Projections

### Scenario 1: Current Usage (15min updates)
- **Month 1**: 92 MB (18%)
- **Month 2**: 184 MB (37%)
- **Month 3**: 276 MB (55%)
- **Month 4**: 368 MB (74%)
- **Month 5**: 460 MB (92%) ⚠️

**Action**: With 30-day retention, size stabilizes at ~90-100 MB ✅

### Scenario 2: 5min updates (future)
- **Month 1**: 276 MB (55%)
- **Month 2**: 460 MB (92%) ⚠️

**Action**: Reduce retention to 10 days or upgrade tier

## 🛡️ Mitigation Strategies

### Short-term (Free Tier)
1. ✅ 30-day retention for traffic logs
2. ✅ 90-day retention for snapshots
3. ✅ Automated cleanup
4. ✅ Compression (gzip) for old data

### Medium-term (If needed)
1. Aggregate old data (hourly → daily averages)
2. Export to external storage (S3, etc.)
3. Implement data archiving

### Long-term (Growth)
1. Upgrade to Pro tier ($25/month)
   - 8 GB database storage
   - 50 GB bandwidth
   - No inactivity pausing
2. Separate analytics database
3. Time-series database for traffic data

## 📝 Supabase Dashboard Monitoring

### Manual Checks (Weekly)
1. Login to Supabase Dashboard
2. Navigate to Project → Database → Usage
3. Check:
   - Database size
   - Bandwidth usage
   - Active connections
4. Review Reports section for trends

### Native Alerts (Configure in Supabase)
1. Go to Database → Settings → Monitoring
2. Enable alerts for:
   - CPU usage > 80%
   - Memory usage > 80%
   - Disk I/O spikes
3. Set notification channels (Email/Slack)

## 🔄 Backup Strategy

### Automated Backups (Supabase)
- Free tier: Daily backups (7-day retention)
- Pro tier: Point-in-time recovery

### Manual Exports (Monthly)
```bash
# Export critical data
pg_dump -h [host] -U [user] -d [db] > backup.sql
```

## 📞 Emergency Contacts

**If database full:**
1. Run immediate cleanup: `POST /api/db-health/cleanup`
2. Check Supabase dashboard
3. Consider temporary upgrade to Pro
4. Contact: support@supabase.com

**Monitoring Tools:**
- Supabase Dashboard: https://app.supabase.com
- Status Page: https://status.supabase.com
- Metrics API: Prometheus-compatible
