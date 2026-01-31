export interface SearchResult {
  gridPointId: string;
  latitude: number;
  longitude: number;
  nearestCity: string | null;
  state: string;
  region: string;
  score: number;
  scoreBreakdown: {
    temperature: number;
    humidity: number;
    wind: number;
    precipitation: number;
    aqi: number | null;
  };
  dailyScores: Array<{
    date: string;
    score: number;
    passesFilters: boolean;
  }>;
  dataSource: 'forecast' | 'historical' | 'mixed';
}
