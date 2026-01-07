# Database Architecture & Schema

Complete database documentation covering current Supabase implementation and future Master Data Management (MDM) vision.

## Current Implementation (Supabase)

### Overview

The application uses **Supabase** (PostgreSQL) for:
- Historical data storage (traffic logs, resort snapshots)
- Weather history tracking
- System configuration persistence

**Static data** (resort metadata) remains in `backend/resorts.json` for fast initial loads and version control.

### Schema

#### Table: `resorts`
Synchronized copy of `resorts.json` for database queries and joins.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique resort identifier (slug) |
| `name` | TEXT | Resort name |
| `district` | TEXT | Region/District |
| `distance` | INTEGER | Standard travel time from Munich (minutes) |
| `piste_km` | INTEGER | Total piste kilometers |
| `lifts` | INTEGER | Total number of lifts |
| `price` | NUMERIC | Adult day pass price (EUR) |
| `classification` | TEXT | Difficulty classification |
| `website` | TEXT | Official website URL |
| `latitude` | NUMERIC | GPS latitude |
| `longitude` | NUMERIC | GPS longitude |
| `price_detail` | JSONB | Detailed pricing (adult, youth, child) |
| `updated_at` | TIMESTAMP | Last sync timestamp |

**Sync Strategy**: Updated on server start via `syncResortsToDatabase()`.

#### Table: `resort_snapshots`
Daily snapshots of resort conditions for trend analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL (PK) | Auto-increment ID |
| `resort_id` | TEXT (FK) | References `resorts.id` |
| `date` | DATE | Snapshot date (YYYY-MM-DD) |
| `data` | JSONB | Snapshot data (lifts, snow, weather, price) |
| `created_at` | TIMESTAMP | Record creation time |

**JSONB Structure**:
```json
{
  "liftsOpen": 8,
  "liftsTotal": 10,
  "snow": "45 cm",
  "weather": "☀️ Sonnig",
  "historicalWeather": {
    "tempMax": 5,
    "tempMin": -2,
    "precipitation": 0,
    "snowfall": 0,
    "snowDepth": 45
  },
  "lifts": [...],
  "slopes": [...],
  "price": 49.50,
  "priceDetail": {...}
}
```

**Retention**: 90 days (configurable)

**Unique Constraint**: `(resort_id, date)` - One snapshot per resort per day

#### Table: `traffic_logs`
High-frequency traffic data for congestion analysis.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL (PK) | Auto-increment ID |
| `city_id` | TEXT | Origin city identifier |
| `city_name` | TEXT | Origin city name |
| `resort_id` | TEXT (FK) | Destination resort |
| `duration` | INTEGER | Travel time (minutes) |
| `delay` | INTEGER | Traffic delay (minutes) |
| `timestamp` | TIMESTAMP | Measurement time |

**Data Sources**:
- **Automated**: GitHub Actions workflow (every 30 min, 06:00-22:00)
- **API**: TomTom Matrix API (8 cities × 60 resorts)

**Retention**: 30 days (configurable)

**Volume**: ~30,720 entries/day (~3 MB/day)

#### Table: `cities`
Reference cities for traffic matrix.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | City identifier (slug) |
| `name` | TEXT | City name |
| `latitude` | NUMERIC | GPS latitude |
| `longitude` | NUMERIC | GPS longitude |
| `created_at` | TIMESTAMP | Record creation time |

**Current Cities**: Munich, Augsburg, Innsbruck, Salzburg, Rosenheim, Stuttgart, Nuremberg, Zurich

### Indexes

```sql
-- Performance optimization for common queries
CREATE INDEX idx_snapshots_resort_date ON resort_snapshots(resort_id, date DESC);
CREATE INDEX idx_traffic_city_resort ON traffic_logs(city_id, resort_id);
CREATE INDEX idx_traffic_timestamp ON traffic_logs(timestamp DESC);
```

### Maintenance

**Automated Cleanup** (via `backend/services/system/monitoring.js`):
- **Daily Health Check** (03:00): Monitor size and usage
- **Weekly Cleanup** (Sunday 02:00): Delete old traffic logs and snapshots
- **Thresholds**:
  - Traffic logs: 30 days
  - Snapshots: 90 days

**Manual Operations**:
- `POST /api/db-health/cleanup` - Force cleanup with custom retention
- `GET /api/db-health/size` - Check current database size

### Connection

**Configuration** (`backend/services/db.js`):
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

**Environment Variables**:
- `SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key (bypasses RLS)

**Health Check**:
```javascript
export async function checkConnection() {
  const { data, error } = await supabase
    .from('resorts')
    .select('count')
    .limit(1);
  
  return { ok: !error, message: error?.message || 'Connected' };
}
```

---

## Future Vision: Master Data Management (MDM)

### Motivation

The current flat structure (`resorts.json`) works well for 60 resorts but has limitations:
- **No multi-area support**: Resorts like "Ski Juwel" span multiple mountains
- **No price history**: Cannot track seasonal pricing or inflation
- **No hierarchical relationships**: Cannot model ski alliances (e.g., Dolomiti Superski)

### Target Architecture

A **normalized relational model** to support 1000+ resorts across DACH+IT.

#### Table: `ski_resorts` (Master)
Represents the logical brand/marketing entity.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | TEXT (PK) | Unique identifier (slug) | `at_tirol_ski_juwel` |
| `name` | TEXT | Resort name | "Ski Juwel Alpbachtal Wildschönau" |
| `country_code` | TEXT | ISO 3166-1 alpha-2 | `AT` |
| `region` | TEXT | State/Canton | `Tirol` |
| `website` | TEXT | Official website | `https://skijuwel.com` |
| `logo_url` | TEXT | Logo URL | |

#### Table: `ski_areas` (Physical Locations)
One resort can have multiple physical mountains/entry points.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | TEXT (PK) | Unique identifier | `at_alpbach_wiedersbergerhorn` |
| `resort_id` | TEXT (FK) | Parent resort | `at_tirol_ski_juwel` |
| `name` | TEXT | Area name | "Wiedersberger Horn" |
| `geo_lat` | NUMERIC | Latitude (base station) | `47.398` |
| `geo_lng` | NUMERIC | Longitude (base station) | `11.944` |
| `elevation_bottom` | INTEGER | Bottom elevation (m) | `830` |
| `elevation_top` | INTEGER | Top elevation (m) | `2025` |
| `piste_km` | NUMERIC | Piste km in this area | `45.5` |

#### Table: `ticket_prices` (Price History)
Enables seasonal pricing and historical analysis.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | BIGSERIAL (PK) | Auto-increment | |
| `resort_id` | TEXT (FK) | Parent resort | `at_tirol_ski_juwel` |
| `season_year` | INTEGER | Season start year | `2025` (for 25/26) |
| `season_type` | TEXT | Peak/Off-peak/Pre | `peak` |
| `category` | TEXT | Adult/Youth/Child | `adult` |
| `price` | NUMERIC | Price | `65.50` |
| `currency` | TEXT | Currency code | `EUR` |
| `valid_from` | DATE | Start date | `2025-12-20` |
| `valid_to` | DATE | End date | `2026-03-15` |

### Migration Strategy

**Phase 1: Preparation** (Current)
- ✅ Use existing `resorts` table (flat structure)
- [ ] Create new tables in parallel (`ski_resorts`, `ski_areas`, `ticket_prices`)

**Phase 2: Data Enrichment**
- Write migration scripts to transform `resorts.json` → new tables
- Manually enrich data for top 50 resorts (regions, sub-areas)

**Phase 3: Backend Transition**
- Backend reads from `ski_resorts` instead of `resorts.json`
- `resorts.json` becomes seeding source only
- APIs return aggregated data (sum of piste_km across all `ski_areas`)

### Benefits

With this model, we can:
- **Scale to 1000+ resorts** without performance issues
- **Model complex alliances** (e.g., Dolomiti Superski as meta-resort with child resorts)
- **Track price trends** (inflation, dynamic pricing)
- **Improve geo-features** (multiple entry points per resort)

---

## Data Flow

```
1. Static Data (resorts.json)
   ↓
2. Sync to Supabase (resorts table)
   ↓
3. Backend serves merged static + live data
   ↓
4. Daily snapshots saved to resort_snapshots
   ↓
5. Traffic matrix logged to traffic_logs (every 30 min)
   ↓
6. Automated cleanup maintains retention policies
```

---

## Backup & Recovery

### Automated Backups (Supabase)
- **Free Tier**: Daily backups, 7-day retention
- **Pro Tier**: Point-in-time recovery (PITR)

### Manual Exports
```bash
# Full database dump
pg_dump -h [host] -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Specific table
pg_dump -h [host] -U postgres -d postgres -t traffic_logs > traffic_backup.sql
```

### Restore
```bash
psql -h [host] -U postgres -d postgres < backup.sql
```

---

## Performance Considerations

### Query Optimization
- Use indexes on frequently queried columns (`resort_id`, `date`, `timestamp`)
- Limit result sets (e.g., last 7 days only)
- Use `EXPLAIN ANALYZE` to identify slow queries

### Caching Strategy
- **In-Memory Cache**: Parser results, weather data (15-60 min TTL)
- **Static Files**: `resorts.json` served directly from filesystem
- **CDN**: Frontend assets on GitHub Pages

### Scaling Limits (Free Tier)
- **Database**: 500 MB (current: ~90 MB)
- **Connections**: 100 concurrent
- **Bandwidth**: 2-5 GB/month

**Upgrade Path**: Pro tier ($25/month) provides 8 GB storage and 50 GB bandwidth.

---

## Related Documentation

- [OPERATIONS.md](./ops/OPERATIONS.md) - Monitoring and maintenance
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API.md](./API.md) - API endpoints
