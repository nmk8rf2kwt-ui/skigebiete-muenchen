# API Documentation 📡

Base URL: `/api`

## 1. System Status
### GET `/status`
Returns the current health status of the system components and recent logs.

**Response:**
```json
{
  "components": {
    "database": "healthy",
    "scraper": "healthy",
    "weather": "healthy",
    "traffic": "healthy",
    "geocoding": "unknown",
    "scheduler": "healthy"
  },
  "database": {
    "connected": true,
    "message": "Connected"
  },
  "cache": {
    "parser": { "valid": 0, "expired": 0, "total": 0 },
    "weather": { "valid": 60, "expired": 0, "total": 60 },
    "traffic": { "valid": 0, "expired": 0, "total": 0 }
  },
  "logs": [
    {
      "level": "info",
      "component": "system",
      "message": "Server started on port 10000",
      "timestamp": "2026-01-07T08:17:33.114Z"
    }
  ],
  "uptime": 123.45
}
```

## 2. Database Health

### GET `/api/db-health`
Get current database health status and size information.

**Response:**
```json
{
  "status": "healthy",
  "message": "Database size OK: 92.5 MB",
  "sizeInfo": {
    "totalSize": 97000000,
    "totalSizeMB": "92.5",
    "percentUsed": "18.5",
    "tables": [
      {
        "table_name": "traffic_logs",
        "row_count": 920000,
        "estimated_size": 92000000,
        "size_mb": "87.7"
      },
      {
        "table_name": "resort_snapshots",
        "row_count": 1800,
        "estimated_size": 900000,
        "size_mb": "0.9"
      }
    ],
    "estimated": true,
    "timestamp": "2026-01-07T14:00:00.000Z"
  }
}
```

**Status Values:**
- `healthy`: Database size < 80% of limit
- `warning`: Database size 80-90% of limit
- `critical`: Database size > 90% of limit

### GET `/api/db-health/size`
Get detailed database size information only.

**Response:**
```json
{
  "totalSize": 97000000,
  "totalSizeMB": "92.5",
  "percentUsed": "18.5",
  "tables": [...],
  "estimated": true,
  "timestamp": "2026-01-07T14:00:00.000Z"
}
```

### POST `/api/db-health/cleanup`
Manually trigger database cleanup (delete old data).

**Request Body:**
```json
{
  "trafficDays": 30,    // Optional: Keep traffic logs for N days (default: 30)
  "snapshotDays": 90    // Optional: Keep snapshots for N days (default: 90)
}
```

**Response:**
```json
{
  "success": true,
  "trafficDeleted": 15000,
  "snapshotsDeleted": 120,
  "newSize": {
    "totalSizeMB": "75.2",
    "percentUsed": "15.0"
  }
}
```

### POST `/api/db-health/maintenance`
Run full automated maintenance (health check + cleanup if needed).

**Response:**
```json
{
  "status": "healthy",
  "message": "Database size OK: 75.2 MB",
  "cleanupPerformed": true,
  "trafficDeleted": 15000,
  "snapshotsDeleted": 120,
  "sizeInfo": {...}
}
```

---

## 3. Resorts
### GET `/resorts`
Returns live data for all configured ski resorts.
- **Query Params**: None
- **Returns**: Array of Resort Objects (Name, Lifts, Slopes, Weather, Traffic).

### GET `/lifts/:resortId`
Returns detailed lift status for a specific resort.

## 3. Weather
### GET `/weather`
Returns current weather conditions for all resorts.

### GET `/historical-weather/:resortId`
Returns 30-day historical weather data (Temperature, Snowfall) for a specific resort.

## 4. History & Trends
### GET `/history/:resortId`
Returns historical snapshot data for a resort.

### GET `/history/:resortId/trends`
Returns calculated trends (Snow change, Average lifts open) over the last 7 days.

## 5. Traffic
### GET `/traffic`
Returns current traffic data.
