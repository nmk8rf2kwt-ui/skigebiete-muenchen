# 📡 API Documentation (v1.7.1)

Base URL: `/api`

The Skigebiet-Finder API provides live data, historical stats, and weather/traffic information for ski resorts around Munich.

## 🔐 Authentication & Security

- **Public Access**: Most `GET` endpoints are public and read-only.
- **CORS Restricted**: Browser access is limited to whitelisted domains (Official Frontend + Localhost).
- **Rate Limiting**: Limited to **1000 requests per 15 minutes** per IP address.
- **Headers**: Responses include standard CORS headers and Security Headers (Helmet).

---

## 🏔️ Resorts

Core resource for ski resort data (Live Status, Lifts, Slopes).

### List All Resorts
Returns aggregated live data for all configured ski resorts. This is the main endpoint for the dashboard.

- **URL**: `/resorts`
- **Method**: `GET`
- **Response**: `200 OK`
- **Content-Type**: `application/json`

```json
[
  {
    "id": "zugspitze",
    "name": "Zugspitze",
    "status": "open",
    "lifts": {
      "open": 5,
      "total": 10,
      "percent": 50
    },
    "slopes": {
      "open": 12,
      "total": 20
    },
    "weather": {
      "temperature": -5,
      "condition": "snowy"
    }
  }
]
```

### Get Detailed Lifts
Returns a detailed list of all lifts and slopes for a specific resort (used for Details Modal).

- **URL**: `/lifts/:resortId`
- **Method**: `GET`
- **Path Params**:
  - `resortId` (string, required): The unique ID of the resort (e.g., `zugspitze`).

---

## 🌦️ Weather

### Get Current Weather
Returns current weather conditions for all resorts. Data is cached for 1 hour.

- **URL**: `/weather`
- **Method**: `GET`

### Get Historical Weather
Returns 30-day historical weather data (Temperature, Snowfall) for a specific resort.

- **URL**: `/historical-weather/:resortId`
- **Method**: `GET`
- **Path Params**:
  - `resortId` (string, required): Resort ID.

---

## 🚦 Traffic & Analysis

### Get Live Traffic
Returns current traffic data for all resorts relative to Munich.

- **URL**: `/traffic`
- **Method**: `GET`
- **Logic**: See [Traffic Logic & Calculation](./ARCHITECTURE.md#traffic-logic--calculation) in ARCHITECTURE.md.

### Get Traffic Analysis
Returns aggregated traffic statistics (average delay by hour of day) to visualize congestion patterns.

- **URL**: `/traffic-analysis/:resortId`
- **Method**: `GET`
- **Path Params**:
  - `resortId` (string, required): Resort ID.
- **Query Params**:
  - `days` (number, optional): Number of past days to include in analysis (default: 7).

---

## 📊 History & Trends

### Get Resort History
Returns historical snapshot data (snow depth, lifts open) for a resort.

- **URL**: `/history/:resortId`
- **Method**: `GET`
- **Query Params**:
  - `days` (number, optional): History depth (default: 30).

### Get Resort Trends
Returns calculated trends (Snow change 24h, Average lifts open) over the last 7 days.

- **URL**: `/history/:resortId/trends`
- **Method**: `GET`

---

## ⚙️ System & Health

Endpoints for monitoring and maintenance.

### System Status
Returns the current health status of all system components (DB, Scraper, Scheduler).

- **URL**: `/status`
- **Method**: `GET`
- **Response**: `200 OK`

```json
{
  "components": {
    "database": "healthy",
    "scraper": "healthy"
  },
  "uptime": 1234.5
}
```

### Database Health
Get database size metrics and table statistics.

- **URL**: `/db-health`
- **Method**: `GET`

### Trigger DB Cleanup
Manually trigger database cleanup to remove old records.

- **URL**: `/db-health/cleanup`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trafficDays": 30,
    "snapshotDays": 90
  }
  ```

---

## 🔒 Admin Endpoints

**Authentication Required**: All `/api/admin/*` endpoints require HTTP Basic Authentication.

**Dashboard URL**: `https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/admin/dashboard.html`

### Admin Dashboard Features

The admin dashboard provides:
- **API Usage Monitor**: Daily request count and 30-day trend visualization
- **Webcam Monitor**: Health tracking of all resort webcam links
- **Parser Status**: Live monitoring of all ski resort data scrapers
- **System & Cache**: Cache statistics and management
- **Server Logs**: Real-time log viewer with filtering

### Usage Statistics
Returns daily and historical API usage statistics.

- **URL**: `/admin/usage`
- **Method**: `GET`
- **Auth**: Required

### System Status
Returns cache statistics and traffic CSV information.

- **URL**: `/admin/system`
- **Method**: `GET`
- **Auth**: Required

### Parser Status
Returns status of all resort parsers.

- **URL**: `/admin/parsers`
- **Method**: `GET`
- **Auth**: Required
- **Response**: Array of parser status objects with lift counts and cache status

### Refresh Single Parser
Forces a refresh of a specific resort parser.

- **URL**: `/admin/parsers/refresh/:id`
- **Method**: `POST`
- **Auth**: Required
- **Path Params**:
  - `resortId` (string, required): Resort ID (e.g., `zugspitze`)

### Clear Cache
Clears specified cache type.

- **URL**: `/admin/cache/clear`
- **Method**: `POST`
- **Auth**: Required
- **Body**:
  ```json
  {
    "type": "parser" | "weather" | "traffic" | "all"
  }
  ```

### Server Logs
Returns recent server logs.

- **URL**: `/admin/logs`
- **Method**: `GET`
- **Auth**: Required
- **Query Params**:
  - `type` (string, optional): `combined` or `error` (default: `combined`)

### Webcam Status
Returns webcam monitoring status (public endpoint).

- **URL**: `/status/webcams`
- **Method**: `GET`

### Check All Webcams
Triggers a manual check of all webcam URLs (public endpoint).

- **URL**: `/status/webcams/check`
- **Method**: `POST`
