/**
 * Seed script to populate the grid_points table with ~50K points
 * covering the continental United States at 0.25° spacing (~17 miles).
 *
 * Usage: npx tsx scripts/seed-grid-points.ts
 */

import { PrismaClient, GridRegion } from '@prisma/client';

const prisma = new PrismaClient();

// Continental US bounding box (approximate)
const US_BOUNDS = {
  minLat: 24.5, // Southern tip of Florida/Texas
  maxLat: 49.0, // Northern border with Canada
  minLon: -124.7, // West coast
  maxLon: -66.9, // East coast (Maine)
};

// Grid spacing in degrees (~17 miles at mid-latitudes)
const GRID_SPACING = 0.25;

// State boundaries (simplified bounding boxes for region assignment)
// These are approximate and used for quick region classification
const STATE_REGIONS: Record<string, { states: string[]; region: GridRegion }> = {
  northeast: {
    states: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'DC'],
    region: 'northeast',
  },
  southeast: {
    states: ['VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'LA', 'TN', 'KY', 'AR'],
    region: 'southeast',
  },
  midwest: {
    states: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
    region: 'midwest',
  },
  southwest: {
    states: ['TX', 'OK', 'NM', 'AZ'],
    region: 'southwest',
  },
  west: {
    states: ['CO', 'WY', 'MT', 'ID', 'UT', 'NV', 'CA'],
    region: 'west',
  },
  pacific_northwest: {
    states: ['WA', 'OR'],
    region: 'pacific_northwest',
  },
};

// Simplified state boundaries for point classification
// Format: { state: { minLat, maxLat, minLon, maxLon } }
const STATE_BOUNDS: Record<string, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  // Northeast
  ME: { minLat: 43.0, maxLat: 47.5, minLon: -71.1, maxLon: -66.9 },
  NH: { minLat: 42.7, maxLat: 45.3, minLon: -72.6, maxLon: -70.6 },
  VT: { minLat: 42.7, maxLat: 45.0, minLon: -73.5, maxLon: -71.5 },
  MA: { minLat: 41.2, maxLat: 42.9, minLon: -73.5, maxLon: -69.9 },
  RI: { minLat: 41.1, maxLat: 42.0, minLon: -71.9, maxLon: -71.1 },
  CT: { minLat: 40.9, maxLat: 42.1, minLon: -73.7, maxLon: -71.8 },
  NY: { minLat: 40.5, maxLat: 45.0, minLon: -79.8, maxLon: -71.9 },
  NJ: { minLat: 38.9, maxLat: 41.4, minLon: -75.6, maxLon: -73.9 },
  PA: { minLat: 39.7, maxLat: 42.3, minLon: -80.5, maxLon: -74.7 },
  DE: { minLat: 38.4, maxLat: 39.8, minLon: -75.8, maxLon: -75.0 },
  MD: { minLat: 37.9, maxLat: 39.7, minLon: -79.5, maxLon: -75.0 },
  DC: { minLat: 38.8, maxLat: 39.0, minLon: -77.1, maxLon: -76.9 },

  // Southeast
  VA: { minLat: 36.5, maxLat: 39.5, minLon: -83.7, maxLon: -75.2 },
  WV: { minLat: 37.2, maxLat: 40.6, minLon: -82.6, maxLon: -77.7 },
  NC: { minLat: 33.8, maxLat: 36.6, minLon: -84.3, maxLon: -75.5 },
  SC: { minLat: 32.0, maxLat: 35.2, minLon: -83.4, maxLon: -78.5 },
  GA: { minLat: 30.4, maxLat: 35.0, minLon: -85.6, maxLon: -80.8 },
  FL: { minLat: 24.5, maxLat: 31.0, minLon: -87.6, maxLon: -80.0 },
  AL: { minLat: 30.2, maxLat: 35.0, minLon: -88.5, maxLon: -84.9 },
  MS: { minLat: 30.2, maxLat: 35.0, minLon: -91.7, maxLon: -88.1 },
  LA: { minLat: 28.9, maxLat: 33.0, minLon: -94.0, maxLon: -89.0 },
  TN: { minLat: 35.0, maxLat: 36.7, minLon: -90.3, maxLon: -81.6 },
  KY: { minLat: 36.5, maxLat: 39.1, minLon: -89.6, maxLon: -82.0 },
  AR: { minLat: 33.0, maxLat: 36.5, minLon: -94.6, maxLon: -89.6 },

  // Midwest
  OH: { minLat: 38.4, maxLat: 42.0, minLon: -84.8, maxLon: -80.5 },
  IN: { minLat: 37.8, maxLat: 41.8, minLon: -88.1, maxLon: -84.8 },
  IL: { minLat: 37.0, maxLat: 42.5, minLon: -91.5, maxLon: -87.5 },
  MI: { minLat: 41.7, maxLat: 48.3, minLon: -90.4, maxLon: -82.4 },
  WI: { minLat: 42.5, maxLat: 47.1, minLon: -92.9, maxLon: -86.8 },
  MN: { minLat: 43.5, maxLat: 49.4, minLon: -97.2, maxLon: -89.5 },
  IA: { minLat: 40.4, maxLat: 43.5, minLon: -96.6, maxLon: -90.1 },
  MO: { minLat: 35.9, maxLat: 40.6, minLon: -95.8, maxLon: -89.1 },
  ND: { minLat: 45.9, maxLat: 49.0, minLon: -104.1, maxLon: -96.6 },
  SD: { minLat: 42.5, maxLat: 46.0, minLon: -104.1, maxLon: -96.4 },
  NE: { minLat: 40.0, maxLat: 43.0, minLon: -104.1, maxLon: -95.3 },
  KS: { minLat: 37.0, maxLat: 40.0, minLon: -102.1, maxLon: -94.6 },

  // Southwest
  TX: { minLat: 25.8, maxLat: 36.5, minLon: -106.6, maxLon: -93.5 },
  OK: { minLat: 33.6, maxLat: 37.0, minLon: -103.0, maxLon: -94.4 },
  NM: { minLat: 31.3, maxLat: 37.0, minLon: -109.1, maxLon: -103.0 },
  AZ: { minLat: 31.3, maxLat: 37.0, minLon: -114.8, maxLon: -109.0 },

  // West
  CO: { minLat: 37.0, maxLat: 41.0, minLon: -109.1, maxLon: -102.0 },
  WY: { minLat: 41.0, maxLat: 45.0, minLon: -111.1, maxLon: -104.1 },
  MT: { minLat: 44.4, maxLat: 49.0, minLon: -116.1, maxLon: -104.0 },
  ID: { minLat: 42.0, maxLat: 49.0, minLon: -117.2, maxLon: -111.0 },
  UT: { minLat: 37.0, maxLat: 42.0, minLon: -114.1, maxLon: -109.0 },
  NV: { minLat: 35.0, maxLat: 42.0, minLon: -120.0, maxLon: -114.0 },
  CA: { minLat: 32.5, maxLat: 42.0, minLon: -124.4, maxLon: -114.1 },

  // Pacific Northwest
  WA: { minLat: 45.5, maxLat: 49.0, minLon: -124.8, maxLon: -116.9 },
  OR: { minLat: 42.0, maxLat: 46.3, minLon: -124.6, maxLon: -116.5 },
};

/**
 * Determine which state a point falls within (simplified)
 */
function getStateForPoint(lat: number, lon: number): string | null {
  for (const [state, bounds] of Object.entries(STATE_BOUNDS)) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon) {
      return state;
    }
  }
  return null;
}

/**
 * Get the region for a state
 */
function getRegionForState(state: string): GridRegion {
  for (const regionData of Object.values(STATE_REGIONS)) {
    if (regionData.states.includes(state)) {
      return regionData.region;
    }
  }
  // Default to west for any unmatched states
  return 'west';
}

/**
 * Generate all grid points
 */
function generateGridPoints(): Array<{
  latitude: number;
  longitude: number;
  state: string;
  region: GridRegion;
}> {
  const points: Array<{
    latitude: number;
    longitude: number;
    state: string;
    region: GridRegion;
  }> = [];

  for (let lat = US_BOUNDS.minLat; lat <= US_BOUNDS.maxLat; lat += GRID_SPACING) {
    for (let lon = US_BOUNDS.minLon; lon <= US_BOUNDS.maxLon; lon += GRID_SPACING) {
      const state = getStateForPoint(lat, lon);

      // Only include points that fall within a state
      if (state) {
        const region = getRegionForState(state);
        points.push({
          latitude: Math.round(lat * 10000) / 10000, // Round to 4 decimal places
          longitude: Math.round(lon * 10000) / 10000,
          state,
          region,
        });
      }
    }
  }

  return points;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌍 Generating grid points for continental US...');

  const points = generateGridPoints();
  console.log(`📍 Generated ${points.length} grid points`);

  // Count by region
  const regionCounts: Record<string, number> = {};
  for (const point of points) {
    regionCounts[point.region] = (regionCounts[point.region] || 0) + 1;
  }
  console.log('📊 Points by region:');
  for (const [region, count] of Object.entries(regionCounts)) {
    console.log(`   ${region}: ${count}`);
  }

  // Clear existing grid points
  console.log('\n🗑️  Clearing existing grid points...');
  await prisma.gridPoint.deleteMany();

  // Insert in batches of 1000 for better performance
  const BATCH_SIZE = 1000;
  console.log(`\n📤 Inserting ${points.length} grid points in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    await prisma.gridPoint.createMany({
      data: batch,
    });
    inserted += batch.length;
    const progress = Math.round((inserted / points.length) * 100);
    process.stdout.write(`\r   Progress: ${inserted}/${points.length} (${progress}%)`);
  }

  console.log('\n\n✅ Grid points seeded successfully!');

  // Verify count
  const count = await prisma.gridPoint.count();
  console.log(`📊 Total grid points in database: ${count}`);
}

main()
  .catch(e => {
    console.error('❌ Error seeding grid points:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
