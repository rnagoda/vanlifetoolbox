# CLAUDE.md - VanLifeToolBox Development Guide

## Project Overview

VanLifeToolBox is a mobile-first, responsive web application for nomads, van lifers, RVers, and road travelers. The MVP delivers three core features:

1. **Good Weather Finder** - Discover US locations matching custom weather criteria with scored/ranked results on an interactive map
2. **Electrical Calculators** - Suite of calculators for off-grid electrical system planning
3. **Resource Library** - Admin-curated collection of external resources for the van life community

**Domain:** vanlifetoolbox.com

---

## Git Workflow (CRITICAL)

### Branch Policy

**NEVER commit directly to the `main` branch.** All changes must follow this workflow:

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/<feature-name>
   # or
   git checkout -b fix/<bug-description>
   # or
   git checkout -b docs/<documentation-change>
   ```

2. **Branch naming conventions:**
   - `feature/` - New features (e.g., `feature/weather-search-api`)
   - `fix/` - Bug fixes (e.g., `fix/login-validation`)
   - `docs/` - Documentation only (e.g., `docs/api-readme-update`)
   - `refactor/` - Code refactoring (e.g., `refactor/calculator-utils`)
   - `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

3. **Commit frequently** with clear, descriptive messages:
   ```bash
   git commit -m "feat(weather): add temperature filter validation"
   git commit -m "fix(auth): handle expired Supabase token"
   git commit -m "docs: update API endpoint documentation"
   ```

4. **Push to remote** and create a Pull Request:
   ```bash
   git push origin feature/<feature-name>
   ```

5. **Admin will review and merge** - Do not merge your own PRs

### Commit Message Format

Follow conventional commits:
```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Security Requirements (CRITICAL)

### API Keys and Secrets

- **NEVER commit API keys, secrets, or credentials to the repository**
- **NEVER hardcode sensitive values in source code**
- All secrets must be in environment variables
- Use `.env` files locally (already in `.gitignore`)
- Use platform secrets management for deployment (Vercel/Railway)

```bash
# .env.example (commit this - shows required vars without values)
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=

# .env (NEVER commit this)
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=actual-service-key-here
SUPABASE_ANON_KEY=actual-anon-key-here
```

### User Privacy

**We do NOT collect or store personal user information.** This is a core principle:

- ✅ Store: email (for authentication only, managed by Supabase)
- ✅ Store: user-created content (saved searches, electrical configs)
- ❌ DO NOT store: names, addresses, phone numbers, location data, IP addresses
- ❌ DO NOT store: tracking data, analytics that identify individuals
- ❌ DO NOT implement: social features that expose user identity

### Authentication Security (Supabase Auth)

Authentication is handled by **Supabase Auth** (not custom JWT):

- Client-side: Use Supabase Auth SDK for registration, login, logout
- Server-side: Validate Supabase JWT tokens from `Authorization` header
- Access tokens expire in 1 hour (Supabase SDK handles refresh automatically)
- Rate limit all endpoints (see Rate Limiting section)
- Validate all inputs with Zod schemas
- Use parameterized queries (Prisma handles this)
- HTTPS only in production
- CORS restricted to production domain

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public endpoints | 100 requests | Per minute per IP |
| Authenticated endpoints | 200 requests | Per minute per user |
| Save operations (POST/PUT on /searches, /configs) | 30 requests | Per hour per user |

### Input Validation

Validate ALL user input on both client and server:

```typescript
// Example: Always validate with Zod on the server
const weatherFilterSchema = z.object({
  tempMin: z.number().min(-50).max(150).optional(),
  tempMax: z.number().min(-50).max(150).optional(),
  humidityMax: z.number().min(0).max(100).optional(),
  precipTypesExcluded: z.array(z.enum([
    'none', 'rain', 'snow', 'sleet', 'freezing_rain', 'hail',
    'drizzle', 'thunderstorms', 'ice_pellets', 'fog', 'mist', 'mixed'
  ])).optional(),
  // ... etc
});
```

---

## SOLID Coding Principles

Apply SOLID principles throughout the codebase:

### Single Responsibility Principle (SRP)

Each module/class/function should have one reason to change:

```typescript
// ❌ BAD - Does too many things
function handleWeatherSearch(req, res) {
  // validates input
  // calls weather API
  // calculates scores
  // formats response
  // sends email notification
}

// ✅ GOOD - Separated concerns
function validateSearchFilters(filters: unknown): WeatherFilters { }
function fetchWeatherData(gridPoints: GridPoint[], dateRange: DateRange): Promise<WeatherData[]> { }
function calculateGridPointScores(weather: WeatherData[], filters: WeatherFilters): ScoredGridPoint[] { }
function formatSearchResponse(results: ScoredGridPoint[]): ApiResponse { }
```

### Open/Closed Principle (OCP)

Open for extension, closed for modification:

```typescript
// ✅ GOOD - Easy to add new calculator types without modifying existing code
interface Calculator {
  calculate(input: CalculatorInput): CalculatorResult;
}

class SolarSizingCalculator implements Calculator { }
class BatterySizingCalculator implements Calculator { }
class WireGaugeCalculator implements Calculator { }
// Adding new calculator doesn't require changing existing ones
```

### Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types:

```typescript
// ✅ GOOD - Any WeatherProvider can be used interchangeably
interface WeatherProvider {
  getForecast(lat: number, lon: number, days: number): Promise<ForecastData>;
  getHistorical(lat: number, lon: number, startDate: Date, endDate: Date): Promise<HistoricalData>;
}

class NOAAProvider implements WeatherProvider { }
class OpenMeteoProvider implements WeatherProvider { }
```

### Interface Segregation Principle (ISP)

Don't force clients to depend on interfaces they don't use:

```typescript
// ❌ BAD - Forces implementers to implement unused methods
interface UserService {
  createUser(): void;
  deleteUser(): void;
  updateUser(): void;
  sendEmail(): void;
  generateReport(): void;
}

// ✅ GOOD - Segregated interfaces
interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}
```

### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions:

```typescript
// ❌ BAD - Directly depends on concrete implementation
class WeatherSearchService {
  private noaaApi = new NOAAApi();

  async search(filters: WeatherFilters) {
    return this.noaaApi.fetch(...);
  }
}

// ✅ GOOD - Depends on abstraction, injected at runtime
class WeatherSearchService {
  constructor(private weatherProvider: WeatherProvider) {}

  async search(filters: WeatherFilters) {
    return this.weatherProvider.getForecast(...);
  }
}
```

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18 + TypeScript | Component-based architecture |
| Styling | Tailwind CSS | Mobile-first, utility classes |
| Build | Vite | Fast builds, HMR |
| Backend | Node.js + Express | TypeScript throughout |
| Database | PostgreSQL + PostGIS | Geospatial queries for grid points |
| ORM | Prisma | Type-safe, migrations |
| Auth | Supabase Auth | Email/password, handles tokens |
| Maps | Leaflet + OpenStreetMap | Free, open-source |
| Frontend Hosting | Vercel | Auto-deploy from main |
| Backend Hosting | Railway | Managed PostgreSQL |
| API Documentation | OpenAPI 3.1 | Source of truth for types |

---

## Project Structure

```
vanlifetoolbox/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Buttons, inputs, modals
│   │   │   ├── layout/         # Header, footer, navigation
│   │   │   ├── weather/        # Weather finder components
│   │   │   ├── calculators/    # Calculator components
│   │   │   └── resources/      # Resource library components
│   │   ├── pages/              # Route-level page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API client functions
│   │   ├── utils/              # Helper functions
│   │   ├── types/              # Auto-generated from OpenAPI spec
│   │   ├── context/            # React context providers
│   │   └── App.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Express backend
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── user.routes.ts
│   │   │   ├── weather.routes.ts
│   │   │   ├── searches.routes.ts
│   │   │   ├── configs.routes.ts
│   │   │   └── resources.routes.ts
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   │   ├── weather.service.ts
│   │   │   ├── scoring.service.ts
│   │   │   └── calculator.service.ts
│   │   ├── middleware/         # Auth, validation, rate limiting
│   │   ├── providers/          # External API integrations
│   │   │   ├── noaa.provider.ts
│   │   │   └── openmeteo.provider.ts
│   │   ├── utils/              # Helper functions
│   │   ├── validators/         # Zod schemas
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data (grid points)
├── scripts/
│   └── generate-types.ts       # OpenAPI → TypeScript types
├── VanLifeToolBox-API-Spec.yaml  # OpenAPI specification (source of truth)
├── VanLifeToolBox-PRD.md
├── VanLifeToolBox-TechSpec.md
├── .env.example                # Environment variable template
├── .gitignore
├── README.md
└── CLAUDE.md                   # This file
```

---

## Database Schema

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
  id           String         @id @default(uuid())
  latitude     Float
  longitude    Float
  nearestCity  String?        @db.VarChar(100)
  state        String         @db.Char(2)
  region       String         @db.VarChar(20) // northeast, southeast, midwest, southwest, west, pacific_northwest
  weatherCache WeatherCache[]

  @@unique([latitude, longitude])
  @@index([state])
  @@index([region])
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
  @@index([fetchedAt])
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

**Note:** Grid points are pre-computed at ~0.25° spacing (~17 miles), providing ~50,000 points across the continental USA. This enables dense coverage for rural/remote areas where van lifers typically travel.

---

## API Endpoints Summary

### User (Auth via Supabase client-side)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user/me` | Yes | Get current user from database |

**Note:** Registration, login, logout, and token refresh are handled client-side via Supabase Auth SDK:
- `supabase.auth.signUp()` - Register
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signOut()` - Logout
- `supabase.auth.getUser()` - Get current user

### Weather Finder
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/weather/search` | No | Search grid points by weather criteria |
| GET | `/api/weather/grid-points` | No | Get all grid points (supports bounds/region/state filters) |
| GET | `/api/weather/grid-points/:id` | No | Get detailed weather for a grid point |
| GET | `/api/weather/nearest` | No | Find nearest grid point to coordinates |

### Saved Searches
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/searches` | Yes | Get user's saved searches |
| GET | `/api/searches/:id` | Yes | Get a specific saved search |
| POST | `/api/searches` | Yes | Save a search |
| PUT | `/api/searches/:id` | Yes | Update a saved search |
| DELETE | `/api/searches/:id` | Yes | Delete a search |

### Electrical Configurations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/configs` | Yes | Get user's configs |
| GET | `/api/configs/:id` | Yes | Get a specific config |
| POST | `/api/configs` | Yes | Create config |
| PUT | `/api/configs/:id` | Yes | Update config |
| DELETE | `/api/configs/:id` | Yes | Delete config |

### Resources (Admin-Curated)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/resources` | No | Get resources (filterable by category) |
| GET | `/api/resources/:id` | No | Get a specific resource |

**Note:** Resource creation/editing is admin-only for MVP (direct database or admin panel). No community submissions in MVP.

---

## Feature Specifications

### 1. Good Weather Finder

**User Flow:**
1. User selects date range
2. User sets weather filters (all optional):
   - Temperature range (°F)
   - Maximum humidity (%)
   - Maximum wind speed (mph)
   - Maximum precipitation chance (%)
   - Precipitation types to allow or exclude
   - Maximum AQI
3. User clicks "Search"
4. Map displays grid points with color-coded pins by match score
5. User clicks a point to see detailed breakdown

**Precipitation Types (NWS):**
- `none` - No precipitation
- `rain` - Liquid precipitation
- `snow` - Frozen precipitation (snowflakes)
- `sleet` - Ice pellets formed from frozen raindrops
- `freezing_rain` - Rain that freezes on contact
- `hail` - Large ice pellets from thunderstorms
- `drizzle` - Light, fine rain
- `thunderstorms` - Rain with thunder/lightning
- `ice_pellets` - Small, translucent ice particles
- `fog` - Low visibility due to water droplets
- `mist` - Light fog with better visibility
- `mixed` - Multiple precipitation types

**Date Range Limits:**
| Range | Behavior |
|-------|----------|
| 1-30 days | Processed normally |
| 31-90 days | Processed with warning in response |
| >90 days | Rejected with `DATE_RANGE_TOO_LARGE` error |

**Scoring Algorithm:**
- Only filters explicitly set by user are included in calculation
- Each active filter is weighted equally (configurable for future tuning)
- Score is 0-100% based on how well grid point matches criteria
- Results sorted by score descending

**Data Handling:**
- If date range includes dates within forecast window (7-14 days): show forecast data
- If date range is beyond forecast window: show historical averages
- If date range spans both: show mixed data with clear labeling
- Cache weather data: forecasts for 6 hours, historical for 7 days

### 2. Electrical Calculators

**Daily Power Consumption:**
- Input: List of devices with watts and hours/day (manual entry)
- Output: Total Wh/day
- Formula: `Σ(watts × hours)`

**Solar Panel Sizing:**
- Input: Daily Wh, location (for sun hours) or manual sun hours, efficiency (default 80%)
- Output: Recommended watts
- Formula: `(Daily_Wh / Sun_Hours) / Efficiency`

**Battery Bank Sizing:**
- Input: Daily Wh, days of autonomy, DoD%, voltage
- Output: Recommended Ah
- Formula: `(Daily_Wh × Days) / (Voltage × DoD)`

**Inverter Sizing:**
- Input: Peak load watts
- Output: Recommended inverter watts (with 20% headroom)
- Formula: `Peak_Load × 1.2`

**Wire Gauge Calculator:**
- Input: Amps, length (feet), voltage drop %, voltage
- Output: Recommended AWG

**Capacity/Runtime Calculator:**
- Input: Battery Ah, voltage, load watts, DoD%
- Output: Hours of runtime
- Formula: `(Ah × Voltage × DoD) / Load_Watts`

### 3. Resource Library

**Categories:**
- youtube
- facebook
- reddit
- forum
- repair
- gear
- apps
- other

**Features (MVP):**
- Browse by category
- Search by title/description
- Admin-curated only (no community submissions)
- No ratings or reviews

---

## Environment Variables

```bash
# Server (.env)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/vanlifetoolbox

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# CORS
CORS_ORIGIN=http://localhost:5173

# Client (.env)
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## Type Generation from OpenAPI

The `VanLifeToolBox-API-Spec.yaml` is the single source of truth for API types. Generate TypeScript types:

```bash
# Generate types from OpenAPI spec
npx openapi-typescript VanLifeToolBox-API-Spec.yaml -o client/src/types/api.ts
```

Run this whenever the API spec changes to keep frontend types in sync.

---

## Development Commands

```bash
# Install dependencies
cd client && npm install
cd server && npm install

# Database setup
cd server
npx prisma migrate dev
npx prisma db seed

# Generate types from OpenAPI
npx openapi-typescript VanLifeToolBox-API-Spec.yaml -o client/src/types/api.ts

# Development
cd client && npm run dev    # Starts on :5173
cd server && npm run dev    # Starts on :3001

# Testing
npm run test
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run typecheck

# Build for production
cd client && npm run build
cd server && npm run build
```

---

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Explicit return types on functions
- No `any` types (use `unknown` if truly unknown)
- Prefer interfaces over type aliases for objects
- Use enums sparingly; prefer union types

### React
- Functional components only
- Custom hooks for reusable logic
- Props interfaces defined above component
- Destructure props in function signature
- Memoize expensive computations

### File Naming
- React components: PascalCase (`WeatherMap.tsx`)
- Utilities/hooks: camelCase (`useWeatherSearch.ts`)
- Types: PascalCase (`WeatherFilters.ts`)
- Routes/controllers: kebab-case with suffix (`weather.routes.ts`)

### Imports Order
1. External packages
2. Internal absolute imports
3. Relative imports
4. Styles/assets

---

## Testing Requirements

- Unit tests for all utility functions
- Unit tests for all calculator logic
- Integration tests for API endpoints
- Component tests for critical UI flows
- Minimum 80% code coverage target

---

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- ARIA labels on icons and interactive elements
- Color contrast minimum 4.5:1
- Focus indicators visible
- Screen reader compatible
- No reliance on color alone to convey information

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial page load | < 3 seconds |
| Weather search response | < 5 seconds |
| Map interaction | < 100ms |
| Calculator response | < 50ms (client-side) |
| Grid point nearest lookup | < 100ms |
| Lighthouse score | > 90 |

---

## Error Handling

### API Errors
All API errors return consistent format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Request body failed validation
- `AUTHENTICATION_REQUIRED` - No valid token provided
- `TOKEN_EXPIRED` - JWT token has expired
- `RESOURCE_NOT_FOUND` - Requested resource does not exist
- `RATE_LIMITED` - Too many requests, try again later
- `DATE_RANGE_TOO_LARGE` - Date range exceeds 90 days
- `WEATHER_API_ERROR` - External weather API failed
- `INTERNAL_ERROR` - Unexpected server error

### Client Error Handling
- Display user-friendly error messages
- Log errors to console in development
- Implement error boundaries for React components
- Graceful degradation when APIs fail

---

## Checklist Before Creating PR

- [ ] Code follows SOLID principles
- [ ] No hardcoded secrets or API keys
- [ ] No personal user data being stored
- [ ] All inputs validated (client and server)
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] Tests written and passing
- [ ] Responsive design tested (mobile + desktop)
- [ ] Accessibility checked
- [ ] Feature branch is up to date with main
- [ ] Commit messages follow conventional format
- [ ] PR description explains changes clearly

---

## Work Session Documentation

When pausing or completing a work session, always provide a summary that includes:

### Testable Items
List all new functionality that can be tested:
- New endpoints (with example curl commands)
- New UI components (with navigation paths)
- New scripts or commands
- Database changes

### How to Test
Provide step-by-step instructions for testing the work:

```bash
# Example format:

# 1. Start the server
cd server && npm run dev

# 2. Test the health endpoint
curl http://localhost:3001/api/health

# 3. Start the client
cd client && npm run dev

# 4. Navigate to http://localhost:5173
```

Include expected outputs and success criteria for each test.

---

## Companion Documents

| Document | Format | Purpose |
|----------|--------|---------|
| VanLifeToolBox-PRD.md | Markdown | Product requirements, user stories, success metrics |
| VanLifeToolBox-API-Spec.yaml | OpenAPI 3.1 | API contract (source of truth for types) |
| VanLifeToolBox-TechSpec.md | Markdown | Technical implementation details |
| CLAUDE.md | Markdown | This file - development guide |
