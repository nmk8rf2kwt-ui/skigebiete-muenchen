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
    "scraper": "unknown",
    "weather": "healthy",
    "scheduler": "unknown"
  },
  "database": {
    "connected": true,
    "message": "Connected"
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

## 2. Resorts
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
