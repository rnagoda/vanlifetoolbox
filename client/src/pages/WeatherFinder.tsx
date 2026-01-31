import { useState } from 'react';
import FilterPanel from '../components/weather/FilterPanel';
import DateRangePicker from '../components/weather/DateRangePicker';
import MapView from '../components/weather/MapView';
import ResultsList from '../components/weather/ResultsList';
import type { SearchResult } from '../components/weather/types';
import { weatherApi, ApiError } from '../services/api';
import type { WeatherFilters } from '../services/api';

interface ExtendedFilters extends WeatherFilters {
  region?: string;
}

export default function WeatherFinder() {
  // Filter state
  const [filters, setFilters] = useState<ExtendedFilters>({});

  // Date range state - default to next 7 days
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(nextWeek.toISOString().split('T')[0]);

  // Search state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle search
  const handleSearch = async () => {
    // Validate date range
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError('End date must be on or after start date');
      return;
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (daysDiff > 90) {
      setError('Date range cannot exceed 90 days');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedResult(null);

    try {
      // Extract region from extended filters
      const { region, ...weatherFilters } = filters;

      const response = await weatherApi.search({
        filters: weatherFilters,
        dateRange: {
          startDate,
          endDate,
        },
        options: {
          limit: 50,
          region: region as 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' | 'pacific_northwest' | undefined,
        },
      });

      // Transform API response to our SearchResult type
      console.log('API Response:', response);
      const apiResults = response?.results || [];
      console.log('API Results:', apiResults);
      const transformedResults: SearchResult[] = apiResults.map((r: unknown) => {
        const result = r as {
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
          dailyScores?: Array<{
            date: string;
            score: number;
            passesFilters: boolean;
          }>;
          dataSource: 'forecast' | 'historical' | 'mixed';
        };
        return {
          gridPointId: result.gridPointId,
          latitude: result.latitude,
          longitude: result.longitude,
          nearestCity: result.nearestCity,
          state: result.state,
          region: result.region,
          score: result.score,
          scoreBreakdown: result.scoreBreakdown,
          dailyScores: result.dailyScores || [],
          dataSource: result.dataSource,
        };
      });

      setResults(transformedResults);

      if (transformedResults.length === 0) {
        setError('No locations found matching your criteria. Try adjusting your filters.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Weather Finder</h1>
        <p className="mt-2 text-gray-600">
          Find locations across the USA that match your ideal weather conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Date Range */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h2>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>

          {/* Weather Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weather Filters</h2>
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Map and Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">Searching for locations...</p>
                  <p className="text-xs text-blue-600">This may take a moment as we fetch weather data.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Map */}
          <div className="bg-white rounded-lg shadow p-6 relative">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Map</h2>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapView
                results={results}
                selectedResult={selectedResult}
                onSelectResult={setSelectedResult}
              />
            </div>
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Loading results...</span>
                </div>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Results</h2>
            <div className="max-h-[600px] overflow-y-auto">
              <ResultsList
                results={results}
                selectedResult={selectedResult}
                onSelectResult={setSelectedResult}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
