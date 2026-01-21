# VanLifeToolBox
## Technical Specification
### MVP Version 1.0

| Field | Value |
|-------|-------|
| Document Version | 1.1 |
| Last Updated | January 2025 |
| Domain | vanlifetoolbox.com |

---

## 1. Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend Framework | React 18 + TypeScript | Component-based, excellent ecosystem, React Native path |
| Styling | Tailwind CSS | Utility-first, responsive, minimal aesthetic |
| Build Tool | Vite | Fast builds, excellent DX, modern tooling |
| Backend | Node.js + Express | JavaScript throughout, rapid development |
| Database | PostgreSQL + PostGIS | Geospatial queries, mature, reliable |
| ORM | Prisma | Type-safe, auto-generated types, migrations |
| Authentication | Supabase Auth | Free tier (50K MAU), handles email/password, secure, battle-tested |
| Maps | Leaflet + OpenStreetMap | Free, open-source, sufficient for MVP |
| Hosting (Frontend) | Vercel | Free tier, automatic deploys, CDN |
| Hosting (Backend) | Railway or Render | Free/low-cost tier, managed PostgreSQL |
| API Documentation | OpenAPI 3.1 | Industry standard, enables code generation |

---

## 2. System Architecture

### 2.1 High-Level Architecture

The application follows a standard three-tier architecture with clear separation between presentation, business logic, and data layers.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ React SPA   │  │ Leaflet Map │  │ Tailwind CSS        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Supabase Auth Client                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API SERVER (Express)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth Middle │  │ Weather API │  │ Config Routes       │  │
│  │ (Supabase)  │  │ Routes      │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
     ┌─────────────┐ ┌───────────┐ ┌─────────────┐
     │ PostgreSQL  │ │ NOAA/NWS  │ │ Open-Meteo  │
     │ + PostGIS   │ │ API       │ │ API         │
     └─────────────┘ └───────────┘ └─────────────┘
```

### 2.2 Directory Structure

```
vanlifetoolbox/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client functions
│   │   ├── utils/             # Helper functions
│   │   ├── types/             # Auto-generated from OpenAPI spec
│   │   └── App.tsx
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation, rate limiting
│   │   ├── utils/             # Weather API clients
│   │   └── index.ts
│   └── package.json
├── prisma/                    # Database schema
│   └── schema.prisma
├── scripts/                   # Build & generation scripts
│   └── generate-types.ts      # OpenAPI → TypeScript types
├── VanLifeToolBox-API-Spec.yaml  # OpenAPI specification (source of truth)
├── VanLifeToolBox-PRD.md
└── VanLifeToolBox-TechSpec.md
```

### 2.3 Type Generation from OpenAPI

The `VanLifeToolBox-API-Spec.yaml` serves as the single source of truth for API types. TypeScript types are auto-generated using `openapi-typescript`:

```bash
# Generate types from OpenAPI spec
npx openapi-typescript VanLifeToolBox-API-Spec.yaml -o client/src/types/api.ts
```

This ensures frontend and backend stay in sync with the API contract.

---

## 3. Database Schema

### 3.1 Entity Relationship Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| users | User accounts (managed by Supabase) | id, email, created_at |
| saved_searches | Weather search configurations | id, user_id, title, filters (JSON), date_range |
| electrical_configs | Saved electrical setups | id, user_id, title, config_data (JSON) |
| grid_points | Pre-computed weather grid (~50K points) | id, latitude, longitude, nearest_city, state, region |
| weather_cache | Cached weather data | grid_point_id, date, data (JSON), data_type, fetched_at |
| resources | Resource library items (admin-curated) | id, title, url, category, description |

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

// Users are managed by Supabase Auth
// This model syncs with Supabase auth.users table
model User {
  id                String              @id @default(uuid())
  email             String              @unique
  createdAt         DateTime            @default(now())
  savedSearches     SavedSearch[]
  electricalConfigs ElectricalConfig[]
}

model SavedSearch {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String   @db.VarChar(100)
  filters   Json     // WeatherFilters object
  startDate DateTime @db.Date
  endDate   DateTime @db.Date
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model ElectricalConfig {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title      String   @db.VarChar(100)
  configData Json     // ElectricalConfigData object
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
}

model GridPoint {
  id          String   @id @default(uuid())
  latitude    Float
  longitude   Float
  nearestCity String?  @db.VarChar(100)
  state       String   @db.Char(2)
  region      String   @db.VarChar(20) // northeast, southeast, midwest, southwest, west, pacific_northwest
  weatherCache WeatherCache[]

  @@unique([latitude, longitude])
  @@index([state])
  @@index([region])
  // PostGIS spatial index for nearest-point queries
}

model WeatherCache {
  id          String    @id @default(uuid())
  gridPointId String
  gridPoint   GridPoint @relation(fields: [gridPointId], references: [id], onDelete: Cascade)
  date        DateTime  @db.Date
  dataType    String    @db.VarChar(20) // "forecast" | "historical"
  data        Json      // DailyWeather object
  fetchedAt   DateTime  @default(now())

  @@unique([gridPointId, date])
  @@index([gridPointId, date])
  @@index([fetchedAt]) // For cache invalidation queries
}

model Resource {
  id          String   @id @default(uuid())
  title       String   @db.VarChar(200)
  url         String   @db.VarChar(500)
  category    String   @db.VarChar(20) // youtube, facebook, reddit, forum, repair, gear, apps, other
  description String?  @db.VarChar(500)
  createdAt   DateTime @default(now())

  @@index([category])
}
```

### 3.3 Grid Point Generation

The grid points table is pre-populated with ~50,000 points covering the continental USA:

- **Grid spacing:** 0.25° latitude × 0.25° longitude (~17 miles)
- **Coverage bounds:** 24°N to 50°N latitude, -125°W to -66°W longitude
- **Nearest city:** Populated via reverse geocoding during initial data load
- **Region assignment:** Based on state groupings

```sql
-- Example: Generate grid points (run once during setup)
INSERT INTO grid_points (id, latitude, longitude, state, region)
SELECT
  gen_random_uuid(),
  lat,
  lon,
  -- State and region determined by PostGIS point-in-polygon with US states shapefile
FROM generate_series(24.0, 50.0, 0.25) AS lat,
     generate_series(-125.0, -66.0, 0.25) AS lon
WHERE -- Point is within continental US boundary
```

---

## 4. API Endpoints

Full API documentation is in `VanLifeToolBox-API-Spec.yaml` (OpenAPI 3.1 format).

### 4.1 Authentication (via Supabase)

Authentication is handled client-side via Supabase Auth SDK. The backend validates Supabase JWTs.

| Flow | Implementation |
|------|----------------|
| Register | `supabase.auth.signUp()` client-side |
| Login | `supabase.auth.signInWithPassword()` client-side |
| Logout | `supabase.auth.signOut()` client-side |
| Get User | `supabase.auth.getUser()` client-side |
| Backend Auth | Middleware validates Supabase JWT from `Authorization` header |

### 4.2 Weather Finder

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/weather/search | Search grid points matching criteria, return scored results |
| GET | /api/weather/grid-points | Get all grid points (supports region/state/bounds filtering) |
| GET | /api/weather/grid-points/:id | Get detailed weather for specific grid point |
| GET | /api/weather/nearest | Find nearest grid point to given coordinates |

### 4.3 Saved Searches (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/searches | Get user's saved searches |
| GET | /api/searches/:id | Get specific saved search |
| POST | /api/searches | Save a new search |
| PUT | /api/searches/:id | Update a saved search |
| DELETE | /api/searches/:id | Delete a saved search |

### 4.4 Electrical Configs (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/configs | Get user's saved configurations |
| GET | /api/configs/:id | Get specific configuration |
| POST | /api/configs | Save new configuration |
| PUT | /api/configs/:id | Update existing configuration |
| DELETE | /api/configs/:id | Delete configuration |

### 4.5 Resources (Public, Admin-Managed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/resources | Get resources (filterable by category) |
| GET | /api/resources/:id | Get specific resource |

**Note:** Resource creation/editing is admin-only for MVP (direct database or admin panel).

---

## 5. Weather Data Integration

### 5.1 Data Sources

| Source | Data Type | Use Case | Rate Limit |
|--------|-----------|----------|------------|
| NOAA/NWS API | Forecast (7-14 days) | Primary forecast source | Generous (undisclosed), free, commercial OK |
| Open-Meteo Forecast | Forecast (16 days) | Backup/extended forecast | 10,000/day free (non-commercial) |
| Open-Meteo Historical | Historical averages | Beyond forecast range | 10,000/day free (non-commercial) |
| NOAA CDO | Historical data | Alternative historical source | 10,000/day, 5/second |

### 5.2 API Strategy

Based on PRD analysis (500 MAU target, ~30,000 API calls/day potential):

1. **Primary forecast source:** NOAA/NWS (free, commercial-use allowed, generous limits)
2. **Historical data:** Open-Meteo with aggressive caching
3. **Caching strategy:**
   - Forecast data: Cache for 6 hours
   - Historical data: Cache for 7 days (averages don't change frequently)
4. **Batch requests:** Open-Meteo supports multi-location queries
5. **Pre-computation:** Background jobs cache popular regions during off-peak hours
6. **Budget contingency:** Open-Meteo paid tier (~€15-30/month) if limits approached

### 5.3 Supported Weather Filters

All precipitation types tracked by the National Weather Service:

| Type | Description |
|------|-------------|
| none | No precipitation |
| rain | Liquid precipitation |
| snow | Frozen precipitation (snowflakes) |
| sleet | Ice pellets formed from frozen raindrops |
| freezing_rain | Rain that freezes on contact with surfaces |
| hail | Large ice pellets from thunderstorms |
| drizzle | Light, fine rain |
| thunderstorms | Rain with thunder/lightning |
| ice_pellets | Small, translucent ice particles |
| fog | Low visibility due to water droplets |
| mist | Light fog with better visibility |
| mixed | Multiple precipitation types |

### 5.4 Date Range Validation

| Range | Behavior |
|-------|----------|
| 1-30 days | Processed normally |
| 31-90 days | Processed with warning in response |
| >90 days | Rejected with `DATE_RANGE_TOO_LARGE` error |

### 5.5 Scoring Algorithm

Each grid point receives a match score (0-100%) based on user criteria:

```typescript
interface FilterScore {
  score: number;    // 0-100
  value: number;    // Actual value
  unit: string;
}

function calculateScore(
  weatherData: DailyWeather[],
  filters: WeatherFilters
): { overall: number; breakdown: Record<string, FilterScore> } {
  const activeFilters: string[] = [];
  const scores: Record<string, FilterScore> = {};

  // Only include filters the user explicitly set
  if (filters.tempMin !== undefined || filters.tempMax !== undefined) {
    activeFilters.push('temperature');
    scores.temperature = scoreTemperature(weatherData, filters);
  }

  if (filters.humidityMax !== undefined) {
    activeFilters.push('humidity');
    scores.humidity = scoreHumidity(weatherData, filters);
  }

  if (filters.windSpeedMax !== undefined) {
    activeFilters.push('wind');
    scores.wind = scoreWind(weatherData, filters);
  }

  if (filters.precipChanceMax !== undefined ||
      filters.precipTypesAllowed !== undefined ||
      filters.precipTypesExcluded !== undefined) {
    activeFilters.push('precipitation');
    scores.precipitation = scorePrecipitation(weatherData, filters);
  }

  if (filters.aqiMax !== undefined) {
    activeFilters.push('aqi');
    scores.aqi = scoreAqi(weatherData, filters);
  }

  // Equal weighting across active filters
  // Architecture supports configurable weights for future tuning
  const overall = activeFilters.length > 0
    ? Math.round(
        activeFilters.reduce((sum, f) => sum + scores[f].score, 0) /
        activeFilters.length
      )
    : 0;

  return { overall, breakdown: scores };
}
```

---

## 6. Frontend Components

### 6.1 Page Structure

| Page | Route | Components/Features |
|------|-------|---------------------|
| Home | / | Hero section, feature cards linking to Weather Finder, Calculators, Resources |
| Weather Finder | /weather | FilterPanel, DateRangePicker, MapView, ResultsList, LocationDetail modal |
| Calculators | /calculators | CalculatorNav, PowerConsumption, SolarSizing, BatterySizing, InverterSizing, WireGauge, CapacityCalc |
| Resources | /resources | CategoryFilter, ResourceGrid, ResourceCard |
| Dashboard | /dashboard | SavedSearchesList, ElectricalConfigsList (requires auth) |
| Auth | /login, /register | Supabase Auth UI components |

### 6.2 Responsive Design Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Mobile | < 640px | Single column, stacked navigation, full-width map |
| Tablet | 640px - 1024px | Two-column where appropriate, collapsible sidebar |
| Desktop | > 1024px | Full layout, side-by-side panels, expanded navigation |

### 6.3 Map Implementation

```typescript
// Using Leaflet with OpenStreetMap tiles
const MapView: React.FC<MapViewProps> = ({ gridPoints, onPointSelect }) => {
  // Cluster markers for performance with ~50K points
  // Use react-leaflet-cluster for marker clustering
  // Color-code markers by match score (red → yellow → green)
  // Click marker → show LocationDetail modal
  // Support bounding box queries for viewport-based loading
};
```

---

## 7. Calculator Specifications

All calculators run client-side for instant feedback. Users can save configurations to their account.

### 7.1 Daily Power Consumption Calculator

**Inputs:**
- List of devices with: name, watts, hours used per day

**Outputs:**
- Total Wh/day, itemized breakdown

**Formula:**
```
Total Wh = Σ(device_watts × hours_per_day)
```

### 7.2 Solar Panel Sizing Calculator

**Inputs:**
- Daily consumption (Wh)
- Location (for sun hours lookup) or manual sun hours entry
- System efficiency (default 80%)

**Outputs:**
- Recommended solar wattage

**Formula:**
```
Solar Watts = (Daily_Wh / Sun_Hours) / Efficiency
```

### 7.3 Battery Bank Sizing Calculator

**Inputs:**
- Daily consumption (Wh)
- Days of autonomy
- Depth of discharge (%) - varies by battery type
- System voltage (12V/24V/48V)

**Outputs:**
- Recommended Ah capacity

**Formula:**
```
Ah = (Daily_Wh × Days) / (Voltage × DoD)
```

### 7.4 Inverter Sizing Calculator

**Inputs:**
- Peak load (watts)
- Surge requirements

**Outputs:**
- Recommended inverter size with 20% headroom

**Formula:**
```
Inverter_Watts = Peak_Load × 1.2
```

### 7.5 Wire Gauge Calculator

**Inputs:**
- Current (amps)
- Wire length (feet, one-way)
- Acceptable voltage drop (%)
- Voltage (12V/24V/48V)

**Outputs:**
- Recommended AWG gauge
- Actual voltage drop at recommended gauge

### 7.6 Capacity/Runtime Calculator

**Inputs:**
- Battery capacity (Ah)
- System voltage
- Current load (W) or daily consumption (Wh)
- Depth of discharge (%)

**Outputs:**
- Hours of runtime without charging

**Formula:**
```
Hours = (Battery_Ah × Voltage × DoD) / Load_Watts
```

---

## 8. Security Considerations

| Area | Implementation |
|------|----------------|
| Transport | All API endpoints use HTTPS |
| Authentication | Supabase Auth with JWT validation |
| Session Management | Supabase handles token refresh automatically |
| Password Security | Managed by Supabase (bcrypt, secure policies) |
| Rate Limiting | Applied to all endpoints (see below) |
| Input Validation | Zod schemas on all user inputs |
| CORS | Configured for production domain only |
| SQL Injection | Prevented via Prisma ORM parameterized queries |
| XSS | React's default escaping + CSP headers |

### 8.1 Rate Limiting Configuration

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public endpoints | 100 requests | Per minute per IP |
| Authenticated endpoints | 200 requests | Per minute per user |
| Save operations (POST/PUT on /searches, /configs) | 30 requests | Per hour per user |
| Auth endpoints (handled by Supabase) | 5 attempts | Per minute per IP |

Rate limit responses include `Retry-After` header.

---

## 9. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial page load | < 3 seconds | Lighthouse |
| Weather search response | < 5 seconds | API timing |
| Map interaction | < 100ms | Frame rate |
| Calculator response | Instant (< 50ms) | Client-side |
| Grid point nearest lookup | < 100ms | API timing (PostGIS spatial index) |

### 9.1 Optimization Strategies

- **Map clustering:** Cluster ~50K grid points into manageable groups at zoom levels
- **Viewport loading:** Only fetch grid points within current map bounds
- **Weather caching:** Aggressive caching reduces external API calls
- **Code splitting:** Lazy-load calculator and resource pages
- **CDN:** Vercel edge caching for static assets

---

## 10. Deployment Configuration

### 10.1 Environment Variables

```bash
# Server
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...  # For server-side auth validation
SUPABASE_ANON_KEY=...     # Public key for client

# Client (VITE_ prefix for Vite exposure)
VITE_API_URL=https://api.vanlifetoolbox.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### 10.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    - Run TypeScript compilation
    - Run unit tests
    - Run integration tests
    - Validate OpenAPI spec

  deploy-backend:
    needs: test
    - Run Prisma migrations
    - Deploy to Railway/Render

  deploy-frontend:
    needs: test
    - Build with Vite
    - Deploy to Vercel

  generate-types:
    - Generate TypeScript types from OpenAPI spec
    - Commit if changed (optional)
```

### 10.3 Monitoring

| Tool | Purpose | Tier |
|------|---------|------|
| Vercel Analytics | Frontend performance | Free |
| Railway/Render Metrics | Backend health, response times | Free |
| Sentry | Error tracking (frontend + backend) | Free (5K events/month) |
| Supabase Dashboard | Auth metrics, database stats | Free |

---

## 11. Companion Documents

| Document | Format | Purpose |
|----------|--------|---------|
| VanLifeToolBox-PRD.md | Markdown | Product requirements, user stories, success metrics |
| VanLifeToolBox-API-Spec.yaml | OpenAPI 3.1 | API contract (source of truth for types) |
| VanLifeToolBox-TechSpec.md | Markdown | This document - technical implementation details |
