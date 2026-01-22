import type { PrecipitationType } from '../validators/weather.js';

/**
 * Daily weather data for a single location
 */
export interface DailyWeather {
  date: string; // ISO date string (YYYY-MM-DD)
  tempHigh: number; // Fahrenheit
  tempLow: number; // Fahrenheit
  humidity: number; // Percentage (0-100)
  windSpeed: number; // mph
  windGust: number | null; // mph
  precipChance: number; // Percentage (0-100)
  precipType: PrecipitationType;
  precipAmount: number; // inches
  uvIndex: number | null;
  cloudCover: number | null; // Percentage (0-100)
  sunrise: string | null; // ISO time
  sunset: string | null; // ISO time
}

/**
 * Weather data for a grid point over a date range
 */
export interface GridPointWeather {
  gridPointId: string;
  latitude: number;
  longitude: number;
  daily: DailyWeather[];
  dataSource: 'forecast' | 'historical' | 'mixed';
  fetchedAt: Date;
}

/**
 * Weather provider interface - implementations fetch data from external APIs
 */
export interface WeatherProvider {
  name: string;

  /**
   * Get weather data for a specific location and date range
   * @param lat Latitude
   * @param lon Longitude
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   */
  getWeather(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): Promise<DailyWeather[]>;

  /**
   * Check if the provider supports the given date range
   * (e.g., forecast providers only support ~16 days ahead)
   */
  supportsDateRange(startDate: string, endDate: string): boolean;
}

/**
 * Scored location result from weather search
 */
export interface ScoredLocation {
  gridPointId: string;
  latitude: number;
  longitude: number;
  nearestCity: string | null;
  state: string;
  region: string;
  score: number; // 0-100
  scoreBreakdown: ScoreBreakdown;
  dailyScores: DailyScore[];
  dataSource: 'forecast' | 'historical' | 'mixed';
}

/**
 * Score breakdown by filter category
 */
export interface ScoreBreakdown {
  temperature: number; // 0-100
  humidity: number; // 0-100
  wind: number; // 0-100
  precipitation: number; // 0-100
  aqi: number | null; // 0-100, null if not filtered
}

/**
 * Score for a single day
 */
export interface DailyScore {
  date: string;
  score: number;
  passesFilters: boolean;
}

/**
 * Weather search options
 */
export interface WeatherSearchOptions {
  limit?: number;
  minScore?: number;
  region?: string;
  states?: string[];
}
