import type { WeatherProvider, DailyWeather } from '../types/weather.js';
import type { PrecipitationType } from '../validators/weather.js';

/**
 * Open-Meteo API response types
 */
interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  relative_humidity_2m_max: number[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  precipitation_probability_max: number[];
  precipitation_sum: number[];
  weathercode: number[];
  uv_index_max: number[];
  cloudcover_mean?: number[];
  sunrise: string[];
  sunset: string[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily: OpenMeteoDaily;
}

/**
 * Map WMO weather codes to our precipitation types
 * https://open-meteo.com/en/docs#weathervariables
 */
function mapWeatherCodeToPrecipType(code: number): PrecipitationType {
  // Clear/Cloudy (0-3)
  if (code <= 3) return 'none';

  // Fog (45, 48)
  if (code === 45 || code === 48) return 'fog';

  // Drizzle (51, 53, 55)
  if (code >= 51 && code <= 55) return 'drizzle';

  // Freezing drizzle (56, 57)
  if (code === 56 || code === 57) return 'freezing_rain';

  // Rain (61, 63, 65)
  if (code >= 61 && code <= 65) return 'rain';

  // Freezing rain (66, 67)
  if (code === 66 || code === 67) return 'freezing_rain';

  // Snow (71, 73, 75, 77)
  if (code >= 71 && code <= 77) return 'snow';

  // Rain showers (80, 81, 82)
  if (code >= 80 && code <= 82) return 'rain';

  // Snow showers (85, 86)
  if (code === 85 || code === 86) return 'snow';

  // Thunderstorm (95, 96, 99)
  if (code >= 95) return 'thunderstorms';

  return 'none';
}

/**
 * Convert Celsius to Fahrenheit
 */
function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Convert km/h to mph
 */
function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

/**
 * Convert mm to inches
 */
function mmToInches(mm: number): number {
  return Math.round(mm * 0.0393701 * 100) / 100;
}

/**
 * Open-Meteo weather provider
 * Free API with generous limits, supports forecast (16 days) and historical data
 */
export class OpenMeteoProvider implements WeatherProvider {
  name = 'open-meteo';

  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly historicalUrl = 'https://archive-api.open-meteo.com/v1/archive';

  /**
   * Maximum days ahead for forecast data
   */
  private readonly maxForecastDays = 16;

  /**
   * Number of years to average for historical fallback
   */
  private readonly historicalYearsToAverage = 5;

  async getWeather(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): Promise<DailyWeather[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Determine which API(s) to call based on date range
    const forecastEnd = new Date(today);
    forecastEnd.setDate(forecastEnd.getDate() + this.maxForecastDays);

    const needsHistorical = start < today;
    const needsForecast = end >= today && start <= forecastEnd;
    // Check if dates are beyond forecast range (need historical fallback)
    const needsHistoricalFallback = end > forecastEnd;

    const results: DailyWeather[] = [];

    // Fetch historical data if needed (for past dates)
    if (needsHistorical) {
      const histEnd = end < today ? end : new Date(today.getTime() - 86400000); // yesterday
      if (start <= histEnd) {
        try {
          const historical = await this.fetchHistorical(lat, lon, startDate, this.formatDate(histEnd));
          results.push(...historical);
        } catch (error) {
          console.error('Error fetching historical data:', error);
        }
      }
    }

    // Fetch forecast data if needed
    if (needsForecast) {
      const fcstStart = start >= today ? start : today;
      const fcstEnd = end <= forecastEnd ? end : forecastEnd;
      try {
        const forecast = await this.fetchForecast(lat, lon, this.formatDate(fcstStart), this.formatDate(fcstEnd));
        results.push(...forecast);
      } catch (error) {
        console.error('Error fetching forecast data, falling back to historical averages:', error);
        // Fallback: use historical averages from the same dates over multiple years
        try {
          const averaged = await this.fetchHistoricalAverages(lat, lon, fcstStart, fcstEnd);
          results.push(...averaged);
        } catch (fallbackError) {
          console.error('Historical averages fallback also failed:', fallbackError);
        }
      }
    }

    // For dates beyond forecast range, use historical averages
    if (needsHistoricalFallback) {
      const fallbackStart = new Date(Math.max(forecastEnd.getTime() + 86400000, start.getTime()));
      const fallbackEnd = end;

      try {
        const averaged = await this.fetchHistoricalAverages(lat, lon, fallbackStart, fallbackEnd);
        results.push(...averaged);
      } catch (error) {
        console.error('Error fetching historical averages:', error);
      }
    }

    // Sort by date and remove duplicates (prefer forecast for today)
    const uniqueByDate = new Map<string, DailyWeather>();
    for (const day of results) {
      if (!uniqueByDate.has(day.date) || day.date >= this.formatDate(today)) {
        uniqueByDate.set(day.date, day);
      }
    }

    return Array.from(uniqueByDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Fetch historical data for multiple years and compute averages
   * This provides a more reliable estimate than a single year's data
   */
  private async fetchHistoricalAverages(
    lat: number,
    lon: number,
    startDate: Date,
    endDate: Date
  ): Promise<DailyWeather[]> {
    const targetYear = startDate.getFullYear();
    const yearsData: DailyWeather[][] = [];

    // Fetch data for the past N years
    for (let yearOffset = 1; yearOffset <= this.historicalYearsToAverage; yearOffset++) {
      const histStart = new Date(startDate);
      histStart.setFullYear(targetYear - yearOffset);
      const histEnd = new Date(endDate);
      histEnd.setFullYear(targetYear - yearOffset);

      try {
        const data = await this.fetchHistorical(lat, lon, this.formatDate(histStart), this.formatDate(histEnd));
        yearsData.push(data);
      } catch (error) {
        console.error(`Error fetching historical data for year ${targetYear - yearOffset}:`, error);
        // Continue with other years even if one fails
      }
    }

    if (yearsData.length === 0) {
      throw new Error('Failed to fetch any historical data for averaging');
    }

    // Average the data across years
    return this.averageHistoricalData(yearsData, startDate, endDate);
  }

  /**
   * Average weather data across multiple years
   */
  private averageHistoricalData(
    yearsData: DailyWeather[][],
    startDate: Date,
    endDate: Date
  ): DailyWeather[] {
    const results: DailyWeather[] = [];

    // Get the number of days in the range
    const numDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

    for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + dayIndex);
      const targetDateStr = this.formatDate(targetDate);

      // Collect data for this day from all years
      const dayDataPoints: DailyWeather[] = [];
      for (const yearData of yearsData) {
        const matchingDay = yearData[dayIndex];
        if (matchingDay) {
          dayDataPoints.push(matchingDay);
        }
      }

      if (dayDataPoints.length === 0) continue;

      // Compute averages
      const avgTempHigh = Math.round(
        dayDataPoints.reduce((sum, d) => sum + d.tempHigh, 0) / dayDataPoints.length
      );
      const avgTempLow = Math.round(
        dayDataPoints.reduce((sum, d) => sum + d.tempLow, 0) / dayDataPoints.length
      );
      const avgHumidity = Math.round(
        dayDataPoints.reduce((sum, d) => sum + d.humidity, 0) / dayDataPoints.length
      );
      const avgWindSpeed = Math.round(
        dayDataPoints.reduce((sum, d) => sum + d.windSpeed, 0) / dayDataPoints.length
      );
      const avgPrecipAmount =
        Math.round(
          (dayDataPoints.reduce((sum, d) => sum + d.precipAmount, 0) / dayDataPoints.length) * 100
        ) / 100;

      // For precipitation chance, calculate percentage of years with precipitation
      const yearsWithPrecip = dayDataPoints.filter(d => d.precipAmount > 0).length;
      const precipChance = Math.round((yearsWithPrecip / dayDataPoints.length) * 100);

      // For precip type, use the most common type
      const precipTypeCounts = new Map<string, number>();
      for (const d of dayDataPoints) {
        precipTypeCounts.set(d.precipType, (precipTypeCounts.get(d.precipType) || 0) + 1);
      }
      let mostCommonPrecipType = 'none' as DailyWeather['precipType'];
      let maxCount = 0;
      for (const [type, count] of precipTypeCounts) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonPrecipType = type as DailyWeather['precipType'];
        }
      }

      results.push({
        date: targetDateStr,
        tempHigh: avgTempHigh,
        tempLow: avgTempLow,
        humidity: avgHumidity,
        windSpeed: avgWindSpeed,
        windGust: null, // Not reliable to average
        precipChance,
        precipType: mostCommonPrecipType,
        precipAmount: avgPrecipAmount,
        uvIndex: null, // Not available in historical data
        cloudCover: null,
        sunrise: dayDataPoints[0]?.sunrise ?? null,
        sunset: dayDataPoints[0]?.sunset ?? null,
      });
    }

    return results;
  }

  supportsDateRange(_startDate: string, _endDate: string): boolean {
    // We now support all date ranges by falling back to historical data
    // from the same dates in the previous year when forecast is unavailable
    return true;
  }

  private async fetchForecast(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): Promise<DailyWeather[]> {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      start_date: startDate,
      end_date: endDate,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'relative_humidity_2m_max',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'precipitation_probability_max',
        'precipitation_sum',
        'weathercode',
        'uv_index_max',
        'sunrise',
        'sunset',
      ].join(','),
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timezone: 'auto',
    });

    const response = await fetch(`${this.forecastUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`Open-Meteo forecast API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenMeteoResponse;
    return this.parseResponse(data);
  }

  private async fetchHistorical(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): Promise<DailyWeather[]> {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      start_date: startDate,
      end_date: endDate,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'relative_humidity_2m_max',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'precipitation_sum',
        'weathercode',
        'sunrise',
        'sunset',
      ].join(','),
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timezone: 'auto',
    });

    const response = await fetch(`${this.historicalUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`Open-Meteo historical API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenMeteoResponse;
    return this.parseResponse(data, true);
  }

  private parseResponse(data: OpenMeteoResponse, isHistorical = false): DailyWeather[] {
    const { daily } = data;
    const results: DailyWeather[] = [];

    for (let i = 0; i < daily.time.length; i++) {
      results.push({
        date: daily.time[i],
        tempHigh: celsiusToFahrenheit(daily.temperature_2m_max[i]),
        tempLow: celsiusToFahrenheit(daily.temperature_2m_min[i]),
        humidity: Math.round(daily.relative_humidity_2m_max[i]),
        windSpeed: kmhToMph(daily.wind_speed_10m_max[i]),
        windGust: daily.wind_gusts_10m_max[i] ? kmhToMph(daily.wind_gusts_10m_max[i]) : null,
        // Historical data doesn't have precipitation probability
        precipChance: isHistorical
          ? daily.precipitation_sum[i] > 0
            ? 100
            : 0
          : Math.round(daily.precipitation_probability_max[i] ?? 0),
        precipType: mapWeatherCodeToPrecipType(daily.weathercode[i]),
        precipAmount: mmToInches(daily.precipitation_sum[i]),
        uvIndex: daily.uv_index_max?.[i] ?? null,
        cloudCover: daily.cloudcover_mean?.[i] ?? null,
        sunrise: daily.sunrise[i] ?? null,
        sunset: daily.sunset[i] ?? null,
      });
    }

    return results;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// Export singleton instance
export const openMeteoProvider = new OpenMeteoProvider();
