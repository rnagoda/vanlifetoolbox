import type { WeatherFilters } from '../validators/weather.js';
import type { DailyWeather, ScoreBreakdown, DailyScore, ScoredLocation } from '../types/weather.js';

/**
 * Weight for each filter category (equal weighting)
 * Categories: temperature, humidity, wind, precipitation
 * AQI is excluded from weighting if not filtered
 */
const CATEGORY_WEIGHTS = {
  temperature: 0.25,
  humidity: 0.25,
  wind: 0.25,
  precipitation: 0.25,
};

/**
 * Scoring service - evaluates weather data against user filters
 */
export class ScoringService {
  /**
   * Score a location's weather data against filters
   * Returns a score from 0-100 and detailed breakdown
   */
  scoreLocation(
    gridPoint: {
      id: string;
      latitude: number;
      longitude: number;
      nearestCity: string | null;
      state: string;
      region: string;
    },
    daily: DailyWeather[],
    filters: WeatherFilters,
    dataSource: 'forecast' | 'historical' | 'mixed'
  ): ScoredLocation {
    // Score each day
    const dailyScores: DailyScore[] = daily.map(day => {
      const dayScore = this.scoreSingleDay(day, filters);
      return {
        date: day.date,
        score: dayScore.score,
        passesFilters: dayScore.passesAllFilters,
      };
    });

    // Calculate category scores across all days
    const categoryScores = this.calculateCategoryScores(daily, filters);

    // Calculate overall score (average of daily scores, weighted by category)
    const overallScore = this.calculateOverallScore(categoryScores);

    return {
      gridPointId: gridPoint.id,
      latitude: gridPoint.latitude,
      longitude: gridPoint.longitude,
      nearestCity: gridPoint.nearestCity,
      state: gridPoint.state,
      region: gridPoint.region,
      score: Math.round(overallScore),
      scoreBreakdown: categoryScores,
      dailyScores,
      dataSource,
    };
  }

  /**
   * Score a single day's weather against filters
   */
  private scoreSingleDay(
    day: DailyWeather,
    filters: WeatherFilters
  ): { score: number; passesAllFilters: boolean } {
    let totalScore = 0;
    let categoryCount = 0;
    let passesAllFilters = true;

    // Temperature scoring
    if (filters.tempMin !== undefined || filters.tempMax !== undefined) {
      const tempScore = this.scoreTemperature(day.tempHigh, day.tempLow, filters);
      totalScore += tempScore;
      categoryCount++;
      if (tempScore === 0) passesAllFilters = false;
    }

    // Humidity scoring
    if (filters.humidityMax !== undefined) {
      const humidityScore = this.scoreHumidity(day.humidity, filters.humidityMax);
      totalScore += humidityScore;
      categoryCount++;
      if (humidityScore === 0) passesAllFilters = false;
    }

    // Wind scoring
    if (filters.windSpeedMax !== undefined) {
      const windScore = this.scoreWind(day.windSpeed, filters.windSpeedMax);
      totalScore += windScore;
      categoryCount++;
      if (windScore === 0) passesAllFilters = false;
    }

    // Precipitation scoring
    if (
      filters.precipChanceMax !== undefined ||
      filters.precipTypesAllowed !== undefined ||
      filters.precipTypesExcluded !== undefined
    ) {
      const precipScore = this.scorePrecipitation(day.precipChance, day.precipType, filters);
      totalScore += precipScore;
      categoryCount++;
      if (precipScore === 0) passesAllFilters = false;
    }

    const score = categoryCount > 0 ? totalScore / categoryCount : 100;
    return { score, passesAllFilters };
  }

  /**
   * Calculate category-level scores across all days
   */
  private calculateCategoryScores(
    daily: DailyWeather[],
    filters: WeatherFilters
  ): ScoreBreakdown {
    let tempTotal = 0,
      tempCount = 0;
    let humidityTotal = 0,
      humidityCount = 0;
    let windTotal = 0,
      windCount = 0;
    let precipTotal = 0,
      precipCount = 0;

    for (const day of daily) {
      // Temperature
      if (filters.tempMin !== undefined || filters.tempMax !== undefined) {
        tempTotal += this.scoreTemperature(day.tempHigh, day.tempLow, filters);
        tempCount++;
      }

      // Humidity
      if (filters.humidityMax !== undefined) {
        humidityTotal += this.scoreHumidity(day.humidity, filters.humidityMax);
        humidityCount++;
      }

      // Wind
      if (filters.windSpeedMax !== undefined) {
        windTotal += this.scoreWind(day.windSpeed, filters.windSpeedMax);
        windCount++;
      }

      // Precipitation
      if (
        filters.precipChanceMax !== undefined ||
        filters.precipTypesAllowed !== undefined ||
        filters.precipTypesExcluded !== undefined
      ) {
        precipTotal += this.scorePrecipitation(day.precipChance, day.precipType, filters);
        precipCount++;
      }
    }

    return {
      temperature: tempCount > 0 ? Math.round(tempTotal / tempCount) : 100,
      humidity: humidityCount > 0 ? Math.round(humidityTotal / humidityCount) : 100,
      wind: windCount > 0 ? Math.round(windTotal / windCount) : 100,
      precipitation: precipCount > 0 ? Math.round(precipTotal / precipCount) : 100,
      aqi: null, // AQI not implemented yet
    };
  }

  /**
   * Calculate overall score from category scores
   */
  private calculateOverallScore(breakdown: ScoreBreakdown): number {
    return (
      breakdown.temperature * CATEGORY_WEIGHTS.temperature +
      breakdown.humidity * CATEGORY_WEIGHTS.humidity +
      breakdown.wind * CATEGORY_WEIGHTS.wind +
      breakdown.precipitation * CATEGORY_WEIGHTS.precipitation
    );
  }

  /**
   * Score temperature (0-100)
   * 100 = within range, decreases as temp moves outside range
   */
  private scoreTemperature(
    high: number,
    low: number,
    filters: WeatherFilters
  ): number {
    const { tempMin, tempMax } = filters;

    // Check if high temp is below minimum
    if (tempMin !== undefined && high < tempMin) {
      const diff = tempMin - high;
      // Lose 10 points per degree below minimum
      return Math.max(0, 100 - diff * 10);
    }

    // Check if low temp is above maximum
    if (tempMax !== undefined && low > tempMax) {
      const diff = low - tempMax;
      // Lose 10 points per degree above maximum
      return Math.max(0, 100 - diff * 10);
    }

    // Perfect if within range
    return 100;
  }

  /**
   * Score humidity (0-100)
   * 100 = at or below max, decreases as humidity exceeds max
   */
  private scoreHumidity(humidity: number, maxHumidity: number): number {
    if (humidity <= maxHumidity) {
      return 100;
    }

    const diff = humidity - maxHumidity;
    // Lose 5 points per percentage point over max
    return Math.max(0, 100 - diff * 5);
  }

  /**
   * Score wind speed (0-100)
   * 100 = at or below max, decreases as wind exceeds max
   */
  private scoreWind(windSpeed: number, maxWind: number): number {
    if (windSpeed <= maxWind) {
      return 100;
    }

    const diff = windSpeed - maxWind;
    // Lose 10 points per mph over max
    return Math.max(0, 100 - diff * 10);
  }

  /**
   * Score precipitation (0-100)
   * Considers chance, type allowed/excluded
   */
  private scorePrecipitation(
    chance: number,
    type: string,
    filters: WeatherFilters
  ): number {
    const { precipChanceMax, precipTypesAllowed, precipTypesExcluded } = filters;

    let score = 100;

    // Check if precipitation type is excluded
    if (precipTypesExcluded?.includes(type as never)) {
      if (chance > 0) {
        // Scale penalty by precipitation chance
        score = Math.max(0, 100 - chance);
      }
    }

    // Check if precipitation type is not in allowed list (when list is specified)
    if (precipTypesAllowed && precipTypesAllowed.length > 0) {
      if (!precipTypesAllowed.includes(type as never) && type !== 'none') {
        if (chance > 0) {
          score = Math.min(score, Math.max(0, 100 - chance));
        }
      }
    }

    // Check precipitation chance against maximum
    if (precipChanceMax !== undefined && chance > precipChanceMax) {
      const diff = chance - precipChanceMax;
      // Lose 2 points per percentage point over max
      score = Math.min(score, Math.max(0, 100 - diff * 2));
    }

    return score;
  }
}

// Export singleton instance
export const scoringService = new ScoringService();
