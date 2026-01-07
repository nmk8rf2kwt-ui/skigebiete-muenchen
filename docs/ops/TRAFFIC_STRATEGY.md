# Traffic Data Strategy & Calculation

**Last Updated**: 2026-01-07
**Status**: Active

## 1. Overview
We use real-time traffic data from **TomTom Matrix API** to provide accurate travel times and congestion delays for all ski resorts.

### 1.1 Data Sources & APIs
- **Traffic & Duration & Distance**: **TomTom Matrix API**.
  - We use the actual driving distance calculated by TomTom, not "as the crow flies".
  - This ensures that the distance matches the route used for traffic calculation.
- **Geocoding (Address Search)**: **OpenRouteService (ORS)**.
  - Used to convert user input (e.g., "Munich Marienplatz") into coordinates.
  - ORS is cost-effective for geocoding, while TomTom is superior for live traffic.

## 2. Calculation Logic
Consistency is key. To ensure "Time with Traffic" is always >= "Time without Traffic", we derive both values from the same live source.

### 2.1 Definitions
- **Live Travel Time (`duration`)**: The total seconds it takes to drive *right now*, including traffic jams. Provided by TomTom (`travelTimeInSeconds`).
- **Traffic Delay (`delay`)**: The seconds lost due to congestion compared to free-flow conditions. Provided by TomTom (`trafficDelayInSeconds`).
- **Base Travel Time**: Calculated as `Live Travel Time - Traffic Delay`. This represents the theoretical optimal drive time on the current route.

### 2.2 Formula (Frontend)
The frontend receives `duration` and `delay` in **seconds** (since v1.4.1).

```javascript
const liveMins = Math.round(durationSecs / 60);
const delayMins = Math.round(delaySecs / 60);
const baseMins = Math.round((durationSecs - delaySecs) / 60);
```

### 2.3 Fallback Strategy
If the TomTom API fails or returns no data:
1.  **Frontend**: Falls back to static `distance` value from `resorts.json`.
2.  **Display**: Shows "n.a." for traffic column.

## 3. Data Storage (Backend)
- All traffic data is processed in `services/tomtom.js`.
- **Unit**: Seconds (Raw integers).
- **Database**: `traffic_logs` stores `delay_seconds` (integer).

## 4. Historical Analysis (Stauprognose)
The "Prognose" column is based on aggregated historical data from `traffic_logs`. It shows the average delay for the current hour based on past weeks.
- **Aggregation**: Average of `delay_seconds` / 60.

## 5. Known Issues / History
- **Before v1.4.1**: Backend stored `duration` in minutes, but Frontend divided by 60 again, resulting in 1-minute travel times. Fixed in v1.4.1.
- **Data Cleanup**: Historical logs from before v1.4.1 were inconsistent and should be truncated/ignored.
