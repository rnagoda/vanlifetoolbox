import { PrismaClient, WeatherDataType, Prisma } from '@prisma/client';
import type { DailyWeather, GridPointWeather, WeatherProvider } from '../types/weather.js';
import { openMeteoProvider } from '../providers/openmeteo.provider.js';

const prisma = new PrismaClient();

/**
 * Cache expiration times
 */
const FORECAST_CACHE_HOURS = 6;
const HISTORICAL_CACHE_DAYS = 7;

/**
 * Weather service - handles fetching, caching, and providing weather data
 */
export class WeatherService {
  private provider: WeatherProvider;

  constructor(provider: WeatherProvider = openMeteoProvider) {
    this.provider = provider;
  }

  /**
   * Get weather data for a grid point over a date range
   * Uses cache when available, fetches from provider when needed
   */
  async getGridPointWeather(
    gridPointId: string,
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<GridPointWeather> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all dates in range
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Check cache for each date
    const cachedData = await prisma.weatherCache.findMany({
      where: {
        gridPointId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Build map of cached data by date
    const cacheMap = new Map<string, { data: DailyWeather; dataType: WeatherDataType; fetchedAt: Date }>();
    for (const cached of cachedData) {
      const dateKey = cached.date.toISOString().split('T')[0];
      cacheMap.set(dateKey, {
        data: cached.data as unknown as DailyWeather,
        dataType: cached.dataType,
        fetchedAt: cached.fetchedAt,
      });
    }

    // Determine which dates need fetching (not cached or cache expired)
    const datesToFetch: Date[] = [];
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      const cached = cacheMap.get(dateKey);

      if (!cached || this.isCacheExpired(cached.fetchedAt, cached.dataType, date, today)) {
        datesToFetch.push(date);
      }
    }

    // Fetch missing data from provider
    if (datesToFetch.length > 0) {
      const fetchStart = datesToFetch[0];
      const fetchEnd = datesToFetch[datesToFetch.length - 1];

      const fetched = await this.provider.getWeather(
        latitude,
        longitude,
        this.formatDate(fetchStart),
        this.formatDate(fetchEnd)
      );

      // Cache the fetched data
      await this.cacheWeatherData(gridPointId, fetched, today);

      // Add to cache map
      for (const day of fetched) {
        const dataType = new Date(day.date) < today ? WeatherDataType.historical : WeatherDataType.forecast;
        cacheMap.set(day.date, {
          data: day,
          dataType,
          fetchedAt: new Date(),
        });
      }
    }

    // Build result from cache map
    const daily: DailyWeather[] = [];
    let hasForecast = false;
    let hasHistorical = false;

    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      const cached = cacheMap.get(dateKey);

      if (cached) {
        daily.push(cached.data);
        if (cached.dataType === WeatherDataType.forecast) hasForecast = true;
        if (cached.dataType === WeatherDataType.historical) hasHistorical = true;
      }
    }

    // Determine data source
    let dataSource: 'forecast' | 'historical' | 'mixed' = 'forecast';
    if (hasForecast && hasHistorical) {
      dataSource = 'mixed';
    } else if (hasHistorical) {
      dataSource = 'historical';
    }

    return {
      gridPointId,
      latitude,
      longitude,
      daily,
      dataSource,
      fetchedAt: new Date(),
    };
  }

  /**
   * Check if cached data has expired
   */
  private isCacheExpired(
    fetchedAt: Date,
    dataType: WeatherDataType,
    _dataDate: Date,
    _today: Date
  ): boolean {
    const now = new Date();
    const ageMs = now.getTime() - fetchedAt.getTime();

    if (dataType === WeatherDataType.forecast) {
      // Forecast data expires after 6 hours
      return ageMs > FORECAST_CACHE_HOURS * 60 * 60 * 1000;
    } else {
      // Historical data expires after 7 days
      return ageMs > HISTORICAL_CACHE_DAYS * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Cache weather data to database
   */
  private async cacheWeatherData(
    gridPointId: string,
    daily: DailyWeather[],
    today: Date
  ): Promise<void> {
    const operations = daily.map(day => {
      const date = new Date(day.date);
      const dataType = date < today ? WeatherDataType.historical : WeatherDataType.forecast;

      return prisma.weatherCache.upsert({
        where: {
          gridPointId_date_dataType: {
            gridPointId,
            date,
            dataType,
          },
        },
        create: {
          gridPointId,
          date,
          dataType,
          data: day as unknown as Prisma.InputJsonValue,
        },
        update: {
          data: day as unknown as Prisma.InputJsonValue,
          fetchedAt: new Date(),
        },
      });
    });

    await prisma.$transaction(operations);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
