import { Router, Request, Response } from 'express';
import { PrismaClient, GridRegion } from '@prisma/client';
import {
  gridPointsQuerySchema,
  nearestGridPointQuerySchema,
  weatherSearchRequestSchema,
} from '../validators/index.js';
import { formatZodError, uuidSchema } from '../validators/common.js';
import { weatherService } from '../services/weather.service.js';
import { scoringService } from '../services/scoring.service.js';
import type { ScoredLocation } from '../types/weather.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/weather/grid-points
 * Returns grid points, optionally filtered by region, states, or viewport bounds.
 */
router.get('/grid-points', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const parseResult = gridPointsQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: formatZodError(parseResult.error),
      });
      return;
    }

    const { region, states, bounds } = parseResult.data;

    // Build where clause
    const where: {
      region?: GridRegion;
      state?: { in: string[] };
      latitude?: { gte: number; lte: number };
      longitude?: { gte: number; lte: number };
    } = {};

    if (region) {
      where.region = region as GridRegion;
    }

    if (states && states.length > 0) {
      where.state = { in: states.map(s => s.toUpperCase()) };
    }

    if (bounds) {
      where.latitude = { gte: bounds.minLat, lte: bounds.maxLat };
      where.longitude = { gte: bounds.minLon, lte: bounds.maxLon };
    }

    const gridPoints = await prisma.gridPoint.findMany({
      where,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        nearestCity: true,
        state: true,
        region: true,
      },
      orderBy: [{ state: 'asc' }, { latitude: 'desc' }],
    });

    res.json({
      success: true,
      data: {
        gridPoints,
        total: gridPoints.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/weather/grid-points:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve grid points',
      },
    });
  }
});

/**
 * GET /api/weather/grid-points/:id
 * Returns a specific grid point by ID.
 */
router.get('/grid-points/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    const uuidResult = uuidSchema.safeParse(id);
    if (!uuidResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid grid point ID format',
        },
      });
      return;
    }

    const gridPoint = await prisma.gridPoint.findUnique({
      where: { id },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        nearestCity: true,
        state: true,
        region: true,
      },
    });

    if (!gridPoint) {
      res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Grid point not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: gridPoint,
    });
  } catch (error) {
    console.error('Error in GET /api/weather/grid-points/:id:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve grid point',
      },
    });
  }
});

/**
 * GET /api/weather/nearest
 * Finds the nearest grid point to given coordinates.
 * Uses Euclidean distance approximation (sufficient for nearby points).
 */
router.get('/nearest', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const parseResult = nearestGridPointQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: formatZodError(parseResult.error),
      });
      return;
    }

    const { lat, lon } = parseResult.data;

    // Find the nearest grid point using Euclidean distance approximation
    // For more accuracy at scale, we'd use PostGIS ST_Distance, but this is
    // sufficient for finding nearby points within our grid spacing
    const nearestPoint = await prisma.$queryRaw<
      Array<{
        id: string;
        latitude: number;
        longitude: number;
        nearest_city: string | null;
        state: string;
        region: string;
        distance: number;
      }>
    >`
      SELECT
        id,
        latitude,
        longitude,
        nearest_city,
        state,
        region,
        SQRT(POW(latitude - ${lat}, 2) + POW(longitude - ${lon}, 2)) as distance
      FROM grid_points
      ORDER BY distance
      LIMIT 1
    `;

    if (nearestPoint.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'No grid points found',
        },
      });
      return;
    }

    const point = nearestPoint[0];

    // Convert distance from degrees to approximate miles (at mid-latitudes, 1° ≈ 69 miles)
    const distanceMiles = point.distance * 69;

    res.json({
      success: true,
      data: {
        gridPoint: {
          id: point.id,
          latitude: point.latitude,
          longitude: point.longitude,
          nearestCity: point.nearest_city,
          state: point.state,
          region: point.region,
        },
        distance: Math.round(distanceMiles * 100) / 100, // Round to 2 decimal places
      },
    });
  } catch (error) {
    console.error('Error in GET /api/weather/nearest:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to find nearest grid point',
      },
    });
  }
});

/**
 * POST /api/weather/search
 * Searches for locations matching weather criteria.
 * Returns scored results sorted by match quality.
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parseResult = weatherSearchRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: formatZodError(parseResult.error),
      });
      return;
    }

    const { filters, dateRange, options } = parseResult.data;
    const limit = options?.limit ?? 50;
    const minScore = options?.minScore ?? 0;

    // Build grid point query
    const gridPointWhere: {
      region?: GridRegion;
      state?: { in: string[] };
    } = {};

    if (options?.region) {
      gridPointWhere.region = options.region as GridRegion;
    }

    if (options?.states && options.states.length > 0) {
      gridPointWhere.state = { in: options.states.map(s => s.toUpperCase()) };
    }

    // Fetch grid points (limit to reasonable batch for performance)
    const gridPoints = await prisma.gridPoint.findMany({
      where: gridPointWhere,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        nearestCity: true,
        state: true,
        region: true,
      },
      take: 500, // Process up to 500 grid points
    });

    if (gridPoints.length === 0) {
      res.json({
        success: true,
        data: {
          results: [],
          total: 0,
          searchCriteria: {
            filters,
            dateRange,
            options,
          },
        },
      });
      return;
    }

    // Fetch weather data and score each location
    const scoredLocations: ScoredLocation[] = [];

    // Process in batches to avoid overwhelming the weather API
    const batchSize = 10;
    for (let i = 0; i < gridPoints.length; i += batchSize) {
      const batch = gridPoints.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async gridPoint => {
          try {
            const weather = await weatherService.getGridPointWeather(
              gridPoint.id,
              gridPoint.latitude,
              gridPoint.longitude,
              dateRange.startDate,
              dateRange.endDate
            );

            return scoringService.scoreLocation(
              gridPoint,
              weather.daily,
              filters,
              weather.dataSource
            );
          } catch (error) {
            console.error(`Error fetching weather for grid point ${gridPoint.id}:`, error);
            return null;
          }
        })
      );

      // Add successful results
      for (const result of batchResults) {
        if (result && result.score >= minScore) {
          scoredLocations.push(result);
        }
      }

      // Stop early if we have enough high-scoring results
      const highScoreResults = scoredLocations.filter(r => r.score >= 70);
      if (highScoreResults.length >= limit * 2) {
        break;
      }
    }

    // Sort by score descending and limit results
    const sortedResults = scoredLocations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        results: sortedResults,
        total: sortedResults.length,
        searchCriteria: {
          filters,
          dateRange,
          options,
        },
      },
    });
  } catch (error) {
    console.error('Error in POST /api/weather/search:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search weather data',
      },
    });
  }
});

export default router;
