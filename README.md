# VanLifeToolBox

A mobile-first web application for nomads and van lifers featuring weather-based location discovery, electrical system calculators, and curated resources.

## Features

- **Weather Finder** - Search for locations across the USA that match your ideal weather conditions. Filter by temperature, humidity, wind speed, precipitation, and more.
- **Electrical Calculators** - Plan your off-grid power system with calculators for daily power consumption, solar panel sizing, battery bank sizing, inverter sizing, wire gauge, and capacity/runtime.
- **Resource Library** - Curated collection of van life resources including YouTube channels, forums, gear recommendations, and repair guides.

## Tech Stack

### Frontend (client/)
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS v4 for styling
- React Router for navigation
- Leaflet / react-leaflet for maps
- Supabase client SDK for authentication

### Backend (server/)
- Express.js with TypeScript
- Prisma ORM with PostgreSQL + PostGIS
- Supabase for authentication
- Zod for validation
- Open-Meteo API for weather data

### Database
- PostgreSQL with PostGIS extension
- Hosted on Supabase

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database with PostGIS extension (or Supabase account)

## Project Structure

```
vanlifetoolbox/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── validators/     # Zod schemas
│   │   └── types/          # TypeScript types
│   └── ...
├── prisma/                 # Database schema
│   └── schema.prisma
├── scripts/                # Utility scripts
│   ├── seed-grid-points.ts
│   ├── populate-cities-fast.ts
│   └── populate-nearest-cities.ts
└── package.json            # Root workspace config
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/vanlifetoolbox.git
cd vanlifetoolbox
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for both client and server workspaces.

### 3. Configure environment variables

#### Client (.env)

Copy the example file and update values:

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Server (.env)

Copy the example file and update values:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/vanlifetoolbox
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
CORS_ORIGIN=http://localhost:5173
```

For Supabase, get your credentials from:
- Project Settings > API > Project URL
- Project Settings > API > anon/public key
- Project Settings > API > service_role key (keep secret!)

### 4. Set up the database

#### Generate Prisma client

```bash
npm run db:generate
```

#### Push schema to database

```bash
npm run db:push
```

This creates all tables and enums in your database.

### 5. Seed the grid points

The weather finder requires a grid of ~50,000 points covering the continental USA:

```bash
npm run db:seed:grid
```

This takes about a minute to complete.

### 6. Populate nearest cities (optional but recommended)

To show city names instead of coordinates for search results:

```bash
npx tsx scripts/populate-cities-fast.ts
```

This uses a local database of US cities and runs in seconds.

Alternatively, for more accurate results using Nominatim reverse geocoding (slow, ~14 hours):

```bash
npx tsx scripts/populate-nearest-cities.ts
```

## Development

### Start both client and server

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Frontend (http://localhost:5173)
npm run dev:client

# Terminal 2 - Backend (http://localhost:3001)
npm run dev:server
```

### Type checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Running tests

```bash
npm test
```

## Building for Production

### Build both client and server

```bash
npm run build
```

### Build individually

```bash
npm run build:client   # Outputs to client/dist/
npm run build:server   # Outputs to server/dist/
```

## Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Set build command: `npm run build:client`
3. Set output directory: `client/dist`
4. Add environment variables:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Backend (Railway/Render)

1. Connect your repository
2. Set build command: `npm run build:server`
3. Set start command: `npm run start --workspace=server`
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`
   - `CORS_ORIGIN`

### Database (Supabase)

The database is hosted on Supabase. After deployment:

1. Run migrations: `npm run db:push`
2. Seed grid points: `npm run db:seed:grid`
3. Populate cities: `npx tsx scripts/populate-cities-fast.ts`

## Database Management

### Re-seeding grid points

If you need to update the grid point data (e.g., after boundary fixes):

```bash
# This will delete all existing grid points and re-create them
npm run db:seed:grid

# Then re-populate nearest cities
npx tsx scripts/populate-cities-fast.ts
```

### Prisma commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio to browse data
npx prisma studio --schema=prisma/schema.prisma
```

## API Endpoints

### Weather

- `GET /api/weather/grid-points` - Get grid points (with optional region/state/bounds filters)
- `GET /api/weather/grid-points/:id` - Get a specific grid point
- `GET /api/weather/nearest?lat=&lon=` - Find nearest grid point to coordinates
- `POST /api/weather/search` - Search for locations matching weather criteria

### User

- `GET /api/user/me` - Get current authenticated user

### Health

- `GET /api/health` - API health check

## Environment Variables Reference

### Client

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

### Server

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `DATABASE_URL` | PostgreSQL connection URL | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `CORS_ORIGIN` | Allowed CORS origin(s) | Yes |

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run type checking: `npm run typecheck`
4. Run linting: `npm run lint`
5. Commit with descriptive message
6. Push and create a pull request

## License

MIT
