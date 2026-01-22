# VanLifeToolBox Development Checklist

This checklist tracks progress through MVP development. Update status as work progresses.

**Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Blocked

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Repository & Tooling
| Status | Task |
|--------|------|
| ✅ | Initialize Git repo with .gitignore |
| ⬜ | Set up branch protection for `main` |
| ✅ | Create monorepo structure (client/, server/, prisma/, scripts/) |
| ✅ | Create .env.example files |
| ✅ | Configure ESLint + Prettier |
| ✅ | Configure TypeScript strict mode |
| ⬜ | Set up Husky pre-commit hooks |

### 1.2 Frontend Foundation
| Status | Task |
|--------|------|
| ✅ | Initialize Vite + React 18 + TypeScript |
| ✅ | Install and configure Tailwind CSS |
| ⬜ | Set up React Router |
| ⬜ | Create base layout components |
| ✅ | Set up Supabase client SDK (installed) |
| ⬜ | Generate types from OpenAPI spec |
| ⬜ | Create API client service |

### 1.3 Backend Foundation
| Status | Task |
|--------|------|
| ✅ | Initialize Express + TypeScript |
| ✅ | Set up Prisma with PostgreSQL + PostGIS |
| ⬜ | Configure Supabase JWT middleware |
| ✅ | Implement rate limiting middleware |
| ✅ | Set up Zod validation (installed) |
| ✅ | Create error handling middleware |
| ✅ | Configure CORS |

### 1.4 Database
| Status | Task |
|--------|------|
| ✅ | Create Prisma schema |
| ⬜ | Run initial migration |
| ⬜ | Create grid points seed script (~50K points) |
| ⬜ | Populate nearest city for grid points |
| ⬜ | Create sample resources seed |

### 1.5 External Services
| Status | Task |
|--------|------|
| ⬜ | Create Supabase project |
| ⬜ | Configure Supabase Auth |
| ⬜ | Set up Vercel project |
| ⬜ | Set up Railway project |
| ⬜ | Configure environment variables |

---

## Phase 2: Authentication

### 2.1 Frontend Auth
| Status | Task |
|--------|------|
| ⬜ | Create AuthContext provider |
| ⬜ | Build Login page |
| ⬜ | Build Register page |
| ⬜ | Implement protected route wrapper |
| ⬜ | Add auth state to header |
| ⬜ | Implement logout |

### 2.2 Backend Auth
| Status | Task |
|--------|------|
| ⬜ | Create JWT validation middleware |
| ⬜ | Implement /api/user/me endpoint |
| ⬜ | Create user sync on first request |

---

## Phase 3: Weather Finder

### 3.1 Weather Data Infrastructure
| Status | Task |
|--------|------|
| ⬜ | Create NOAA/NWS API provider |
| ⬜ | Create Open-Meteo API provider |
| ⬜ | Implement WeatherProvider interface |
| ⬜ | Build weather caching service |
| ⬜ | Implement cache invalidation |

### 3.2 Grid Points API
| Status | Task |
|--------|------|
| ⬜ | GET /api/weather/grid-points (with filters) |
| ⬜ | GET /api/weather/grid-points/:id |
| ⬜ | GET /api/weather/nearest |

### 3.3 Weather Search API
| Status | Task |
|--------|------|
| ⬜ | POST /api/weather/search |
| ⬜ | Filter validation (Zod) |
| ⬜ | Date range validation (30/90 day) |
| ⬜ | Scoring algorithm service |

### 3.4 Weather Finder UI
| Status | Task |
|--------|------|
| ⬜ | Weather Finder page layout |
| ⬜ | FilterPanel component |
| ⬜ | DateRangePicker component |
| ⬜ | MapView component (Leaflet) |
| ⬜ | ResultsList component |
| ⬜ | LocationDetail modal |

### 3.5 Saved Searches
| Status | Task |
|--------|------|
| ⬜ | GET /api/searches |
| ⬜ | GET /api/searches/:id |
| ⬜ | POST /api/searches |
| ⬜ | PUT /api/searches/:id |
| ⬜ | DELETE /api/searches/:id |
| ⬜ | SaveSearchModal component |
| ⬜ | SavedSearchesList component |

---

## Phase 4: Electrical Calculators

### 4.1 Calculator Logic
| Status | Task |
|--------|------|
| ⬜ | Daily Power Consumption calculator |
| ⬜ | Solar Panel Sizing calculator |
| ⬜ | Battery Bank Sizing calculator |
| ⬜ | Inverter Sizing calculator |
| ⬜ | Wire Gauge calculator |
| ⬜ | Capacity/Runtime calculator |

### 4.2 Calculator UI
| Status | Task |
|--------|------|
| ⬜ | Calculators page with navigation |
| ⬜ | Individual calculator components |
| ⬜ | DeviceList component |
| ⬜ | Calculator state persistence |

### 4.3 Electrical Configs API
| Status | Task |
|--------|------|
| ⬜ | GET /api/configs |
| ⬜ | GET /api/configs/:id |
| ⬜ | POST /api/configs |
| ⬜ | PUT /api/configs/:id |
| ⬜ | DELETE /api/configs/:id |

### 4.4 Saved Configs UI
| Status | Task |
|--------|------|
| ⬜ | SaveConfigModal component |
| ⬜ | ConfigurationsList component |
| ⬜ | Load configuration functionality |

---

## Phase 5: Resource Library

### 5.1 Resources API
| Status | Task |
|--------|------|
| ⬜ | GET /api/resources (with filters/pagination) |
| ⬜ | GET /api/resources/:id |
| ⬜ | Seed initial resources |

### 5.2 Resources UI
| Status | Task |
|--------|------|
| ⬜ | Resources page layout |
| ⬜ | CategoryFilter component |
| ⬜ | SearchInput component |
| ⬜ | ResourceGrid component |
| ⬜ | ResourceCard component |

---

## Phase 6: Dashboard & Polish

### 6.1 User Dashboard
| Status | Task |
|--------|------|
| ⬜ | Dashboard page |
| ⬜ | SavedSearchesList display |
| ⬜ | ElectricalConfigsList display |

### 6.2 Home Page
| Status | Task |
|--------|------|
| ⬜ | Hero section |
| ⬜ | Feature cards |
| ⬜ | Call-to-action buttons |

### 6.3 UI Polish
| Status | Task |
|--------|------|
| ⬜ | Loading states (skeletons) |
| ⬜ | Error boundaries |
| ⬜ | Toast notifications |
| ⬜ | Empty states |
| ⬜ | Responsive design testing |

### 6.4 Accessibility
| Status | Task |
|--------|------|
| ⬜ | Keyboard navigation audit |
| ⬜ | Screen reader testing |
| ⬜ | Color contrast verification |
| ⬜ | ARIA labels audit |

### 6.5 Performance
| Status | Task |
|--------|------|
| ⬜ | Code splitting |
| ⬜ | Map marker clustering |
| ⬜ | API response caching |
| ⬜ | Lighthouse audit (>90) |

---

## Phase 7: Testing

### 7.1 Unit Tests
| Status | Task |
|--------|------|
| ⬜ | Calculator logic tests |
| ⬜ | Scoring algorithm tests |
| ⬜ | Validation schema tests |
| ⬜ | Utility function tests |

### 7.2 Integration Tests
| Status | Task |
|--------|------|
| ⬜ | Auth flow tests |
| ⬜ | Weather search API tests |
| ⬜ | Saved searches CRUD tests |
| ⬜ | Electrical configs CRUD tests |
| ⬜ | Resources API tests |

---

## Phase 8: Launch

### 8.1 Beta
| Status | Task |
|--------|------|
| ⬜ | Deploy to staging |
| ⬜ | Set up error tracking (Sentry) |
| ⬜ | Set up analytics |
| ⬜ | Internal testing |

### 8.2 Production
| Status | Task |
|--------|------|
| ⬜ | Security audit |
| ⬜ | Database backup config |
| ⬜ | Deploy to production |
| ⬜ | DNS configuration |
| ⬜ | SSL verification |
| ⬜ | Smoke testing |

---

## MVP Success Criteria

| Status | Criterion |
|--------|-----------|
| ⬜ | User can search for weather-based locations |
| ⬜ | User can view results on interactive map |
| ⬜ | User can save/load weather searches |
| ⬜ | User can use all 6 electrical calculators |
| ⬜ | User can save/load electrical configurations |
| ⬜ | User can browse resources by category |
| ⬜ | App is responsive (mobile + desktop) |
| ⬜ | WCAG 2.1 AA accessibility |
| ⬜ | Lighthouse score >90 |
| ⬜ | <3s initial page load |
| ⬜ | <5s weather search response |

---

## Notes & Blockers

*Document any blockers, decisions, or notes here as development progresses.*

### Decisions Made
- Authentication: Supabase Auth (client-side SDK)
- Location model: Grid-based (~50K points at 0.25° spacing)
- Resources: Admin-curated only for MVP
- Precipitation types: Full NWS list (12 types)
- Date range limits: 30 days normal, 31-90 warning, >90 rejected

### Blockers
*None currently*

### Notes
*Add notes as development progresses*
