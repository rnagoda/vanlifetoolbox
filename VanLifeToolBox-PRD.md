# VanLifeToolBox
## Product Requirements Document (PRD)
### MVP Version 1.0

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Last Updated | January 2025 |
| Domain | vanlifetoolbox.com |
| Status | Draft - Ready for Development |

---

## 1. Executive Summary

VanLifeToolBox is a mobile-first, responsive web application designed for nomads, van lifers, RVers, and road travelers. The MVP delivers three core features: a Good Weather Finder for discovering ideal travel destinations based on weather preferences, electrical system calculators for off-grid living, and a curated resource library for the van life community.

The application fills a significant gap in the market—no existing tool allows travelers to search for locations based on specific weather criteria across custom date ranges with scored/ranked results displayed on an interactive map.

---

## 2. Problem Statement

Nomads and travelers currently lack a unified tool to answer the question: "Where should I go to find the weather I want?"

**Current pain points include:**
- Manually checking weather forecasts for multiple cities individually
- No way to filter locations by specific weather criteria (temperature + humidity + AQI, etc.)
- Difficulty planning trips months in advance using historical weather data
- Scattered resources for electrical calculations and van life information

---

## 3. Goals and Non-Goals

### 3.1 MVP Goals
- Enable weather-based location discovery across the USA with scored/ranked results
- Display results on an interactive map interface
- Provide comprehensive electrical calculators for van/RV systems
- Offer a curated, expandable resource library
- Support user accounts for saving searches and electrical configurations

### 3.2 Non-Goals (MVP)
- Native mobile applications (web-first, native apps post-MVP)
- Coverage outside USA (Canada/Mexico planned for future)
- Social features or user-generated content
- Route planning or navigation
- Hourly weather granularity (daily only for MVP)

---

## 4. User Personas

### Primary: The Full-Time Nomad
Lives in their vehicle year-round, follows good weather, needs to plan weeks/months ahead. Values: comfort, avoiding extreme weather, managing solar/electrical systems efficiently.

### Secondary: The Weekend Warrior
Takes regular camping/road trips, wants to find the best weather for upcoming weekends. Values: maximizing limited trip time, reliable forecasts.

### Tertiary: The Snowbird
Seasonally relocates to avoid extreme temperatures. Needs to compare destinations months in advance using historical data. Values: predictability, comfort, avoiding humidity/heat.

---

## 5. Features and Requirements

### 5.1 Good Weather Finder

The core feature enabling weather-based location discovery.

| Requirement | Details |
|-------------|---------|
| Weather Filters | Temperature (high/low range), Precipitation type (all types tracked by NWS), Precipitation chance (%), Wind speed, Humidity (%), Air Quality Index (AQI) |
| Date Range | Custom date picker, any range. Display warning for very long date ranges. Reject requests that are too large with user-friendly message explaining the limitation. |
| Location Granularity | GPS coordinate-based. Dense coverage across USA—users are often in rural/remote areas, not just major metros. |
| Data Display | Clearly label data as "Historical Average" or "Forecast" with explanation of why each is shown. |
| Results | Interactive map showing matching locations. Scored/ranked by match percentage (e.g., 92% match). Click location for detailed breakdown. |
| Scoring Algorithm | Equal weighting across all selected filters (architecture should support configurable weights for future tuning). Filters not selected by user are excluded from calculation. |
| Saved Searches | Logged-in users can save and title searches for quick access. |

### 5.2 Electrical Calculators

Suite of calculators for off-grid electrical system planning.

| Calculator | Function |
|------------|----------|
| Daily Power Consumption | Input devices and usage hours manually, output total Wh/day needed |
| Solar Panel Sizing | Based on consumption and location sun hours, recommend panel wattage |
| Battery Bank Sizing | Calculate amp-hours needed based on consumption and days of autonomy |
| Inverter Sizing | Recommend inverter wattage based on peak load requirements |
| Wire Gauge Calculator | Determine appropriate wire gauge based on current, length, and voltage drop tolerance |
| Capacity Calculator | "Based on your setup, you have X hours of capacity without solar/shore power" |

**Note:** Device usage hours in calculators are distinct from weather data granularity. Weather data is daily; device usage tracking is hourly for accurate consumption calculations.

**Post-MVP additions:**
- Pre-populated device library with common appliances
- Fuel cost estimator (based on MPG and distance)
- Water tank duration, propane usage, and others as identified

### 5.3 Resource Library

Curated collection of external resources for the van life community.

- **Categories:** YouTube channels, Facebook groups, Reddit communities, forums, repair guides, gear reviews, apps
- **Admin-curated only for MVP** (no community submissions in MVP)
- **No ratings or reviews for MVP**
- Future monetization potential (featured listings, sponsored resources)

### 5.4 User Accounts

- Email/password authentication only (no social login for MVP)
- All features accessible without login; account required only to save data
- Save weather searches with custom titles
- Save multiple electrical configurations (e.g., "Current Van" vs "Dream Build") - no limit on number of saved configurations
- Minimal personal data storage (email only for auth)
- **Rate limiting required** to prevent automated abuse of save functionality

---

## 6. User Stories

### Weather Finder Stories
- As a van lifer, I want to search for locations with 70-80°F highs, low humidity, and good AQI for next month, so I can plan my route.
- As a user viewing results, I want to see a map with color-coded pins showing match scores, so I can quickly identify the best destinations.
- As a user, I want to tap a location and see a detailed breakdown of how it matches each of my criteria.
- As a user, I want to clearly understand whether I'm seeing forecast data or historical averages.
- As a logged-in user, I want to save my search as "Spring 2025 Southwest Trip" for quick access later.

### Calculator Stories
- As a user planning a van build, I want to input my devices and usage to calculate daily power consumption.
- As a user, I want to know how many solar panels I need based on my consumption and typical sun hours.
- As a user, I want to save my electrical setup so I don't have to re-enter it every time.
- As a user, I want to know "with my current setup, I have X hours of battery life without charging."

### Resource Library Stories
- As a new van lifer, I want to browse curated YouTube channels for build advice.

---

## 7. Success Metrics

| Metric | Target (3 months) | Measurement |
|--------|-------------------|-------------|
| Monthly Active Users | 500+ | Analytics |
| Search Completion Rate | >70% | Users who complete a weather search |
| Account Registration Rate | >15% | Visitors who create accounts |
| Saved Searches per User | >2 | Average for registered users |
| Calculator Usage | >30% | Users who use any calculator |

---

## 8. Technical Constraints

- **Budget:** Low - must use free tiers and open-source solutions where possible
- **Weather APIs:** Free tier limits apply (see Section 8.1 for detailed analysis)
- **Map Provider:** Leaflet + OpenStreetMap (free) for MVP; Google Maps upgrade path available
- **Geographic Scope:** USA only (Canada/Mexico post-MVP)
- **Data Granularity:** Daily weather data only (hourly post-MVP)
- **Privacy:** Minimal personal data storage (email for auth only)

### 8.1 Weather API Strategy & Rate Limit Analysis

#### Available APIs

**Open-Meteo**
- Free tier: 10,000 calls/day, 5,000/hour, 600/minute
- **Important:** Free tier is non-commercial use only
- Call multiplier: Requests for >10 weather variables or >2 weeks count as multiple calls (e.g., 4 weeks = 3.0 API calls)

**NOAA/NWS API (api.weather.gov)**
- Completely free, no API key required
- Rate limits not publicly disclosed but described as "generous for typical use"
- Commercial use allowed (public domain government data)

**NOAA Climate Data Online (Historical Data)**
- Free tier: 10,000 requests/day, 5 requests/second
- Requires access token

#### Usage Projection Against 500 MAU Target

**Assumptions:**
- 500 MAU with ~10% daily active = 50 daily active users
- 2-3 weather searches per session
- Each search covers ~2 weeks average date range
- Each search queries 50-200 grid points for regional coverage

**Estimated daily API usage:**
- 50 users × 3 searches × 200 locations = **30,000 calls/day**
- This exceeds Open-Meteo's free tier (10,000/day)

#### Recommended Strategy

1. **Use NOAA/NWS as primary source** for forecast data (free, commercial-use allowed, generous limits)
2. **Use Open-Meteo or NOAA CDO for historical data** with aggressive caching
3. **Implement aggressive caching** - weather data by location/date; many users search similar regions
4. **Batch requests** - Open-Meteo supports multi-location queries in single calls
5. **Pre-compute popular regions** - background jobs to cache common search areas
6. **Budget for paid tier** - Open-Meteo starts at ~€15/month for 20,000 calls/day once approaching 500 MAU or if commercial features are enabled

#### Sources
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing)
- [Open-Meteo Terms](https://open-meteo.com/en/terms)
- [NWS API Documentation](https://www.weather.gov/documentation/services-web-api)
- [NOAA CDO Web Services](https://www.ncdc.noaa.gov/cdo-web/webservices/v2)

---

## 9. Accessibility and Internationalization

- WCAG 2.1 AA compliance required
- Keyboard navigation support for all features
- Screen reader compatible
- Color contrast ratios meeting AA standards
- English only for MVP
- Architecture supports future i18n (externalized strings)

---

## 10. Project Timeline

| Milestone | Target |
|-----------|--------|
| PRD & Technical Spec Complete | Week 1 |
| Development Sprint 1: Core Infrastructure + Auth | Weeks 2-3 |
| Development Sprint 2: Weather Finder | Weeks 4-6 |
| Development Sprint 3: Calculators | Weeks 7-8 |
| Development Sprint 4: Resource Library + Polish | Weeks 9-10 |
| Alpha Testing | Week 11 |
| Beta Testing | Week 12 |
| MVP Launch | Week 13 |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| AQI | Air Quality Index - EPA standard measure of air pollution |
| Ah | Amp-hours - measure of battery capacity |
| Wh | Watt-hours - measure of energy consumption |
| MVP | Minimum Viable Product |
| Shore Power | External electrical hookup at campgrounds/RV parks |
| WCAG | Web Content Accessibility Guidelines |
| NWS | National Weather Service |
| MAU | Monthly Active Users |
| DAU | Daily Active Users |

---

## Appendix B: Companion Documents

- Technical Specification Document
- API Documentation
- Database Schema
- Wireframes/Mockups
