/**
 * Script to populate the nearestCity field for grid points using reverse geocoding.
 * Uses Nominatim (OpenStreetMap) API with rate limiting to respect usage policy.
 *
 * Usage: npx tsx scripts/populate-nearest-cities.ts
 *
 * Note: This is a long-running script due to rate limiting (1 request/second).
 * It will skip points that already have a nearestCity value.
 * Run incrementally and can be safely interrupted and resumed.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nominatim API URL (free, but requires 1 req/sec rate limiting)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

// Rate limit: 1 request per second as per Nominatim usage policy
const DELAY_MS = 1100;

// Batch size for database updates
const BATCH_SIZE = 50;

interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
  };
  display_name?: string;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get nearest city name from Nominatim
 */
async function getNearestCity(lat: number, lon: number): Promise<string | null> {
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('zoom', '10'); // City-level zoom
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'VanLifeToolbox/1.0 (contact@vanlifetoolbox.com)',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as NominatimResponse;

    // Try to find the most specific locality name
    const address = data.address;
    if (address) {
      const cityName =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.municipality;

      if (cityName) {
        return cityName;
      }

      // Fall back to county if no city found
      if (address.county) {
        return `Near ${address.county}`;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching city for (${lat}, ${lon}):`, error);
    return null;
  }
}

/**
 * Main function to populate nearest cities
 */
async function main() {
  console.log('🏙️  Starting nearest city population...\n');

  // Get count of points without nearestCity
  const totalWithoutCity = await prisma.gridPoint.count({
    where: { nearestCity: null },
  });

  const totalPoints = await prisma.gridPoint.count();
  console.log(`📊 Total grid points: ${totalPoints}`);
  console.log(`📊 Points without nearestCity: ${totalWithoutCity}`);

  if (totalWithoutCity === 0) {
    console.log('\n✅ All grid points already have nearestCity populated!');
    return;
  }

  const estimatedTime = Math.ceil((totalWithoutCity * DELAY_MS) / 1000 / 60);
  console.log(`⏱️  Estimated time: ~${estimatedTime} minutes (due to rate limiting)\n`);

  // Process in batches
  let processed = 0;
  let updated = 0;
  let errors = 0;

  while (true) {
    // Fetch batch of points without nearestCity
    const points = await prisma.gridPoint.findMany({
      where: { nearestCity: null },
      select: { id: true, latitude: true, longitude: true, state: true },
      take: BATCH_SIZE,
    });

    if (points.length === 0) {
      break;
    }

    console.log(`\n📦 Processing batch of ${points.length} points...`);

    for (const point of points) {
      // Get nearest city
      const nearestCity = await getNearestCity(point.latitude, point.longitude);

      if (nearestCity) {
        await prisma.gridPoint.update({
          where: { id: point.id },
          data: { nearestCity },
        });
        updated++;
        console.log(
          `  ✓ ${point.state} (${point.latitude}, ${point.longitude}) → ${nearestCity}`
        );
      } else {
        errors++;
        console.log(
          `  ✗ ${point.state} (${point.latitude}, ${point.longitude}) → No city found`
        );
      }

      processed++;

      // Progress update
      if (processed % 10 === 0) {
        const remaining = totalWithoutCity - processed;
        const remainingMin = Math.ceil((remaining * DELAY_MS) / 1000 / 60);
        console.log(
          `\n📈 Progress: ${processed}/${totalWithoutCity} (${Math.round(
            (processed / totalWithoutCity) * 100
          )}%) - ~${remainingMin} min remaining\n`
        );
      }

      // Rate limiting
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Nearest city population complete!');
  console.log(`📊 Processed: ${processed}`);
  console.log(`📊 Updated: ${updated}`);
  console.log(`📊 Errors: ${errors}`);
}

main()
  .catch(e => {
    console.error('❌ Error populating nearest cities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
