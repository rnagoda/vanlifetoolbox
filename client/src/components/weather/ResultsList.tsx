import type { SearchResult } from './types';

interface ResultsListProps {
  results: SearchResult[];
  selectedResult: SearchResult | null;
  onSelectResult: (result: SearchResult) => void;
  isLoading: boolean;
}

// Score to color mapping
function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-lime-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-50';
  if (score >= 60) return 'bg-lime-50';
  if (score >= 40) return 'bg-yellow-50';
  if (score >= 20) return 'bg-orange-50';
  return 'bg-red-50';
}

function formatRegion(region: string): string {
  return region
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ResultsList({
  results,
  selectedResult,
  onSelectResult,
  isLoading,
}: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-gray-500">No results yet</p>
        <p className="text-sm text-gray-400">
          Set your filters and date range, then click Search
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-2">
        {results.length} location{results.length !== 1 ? 's' : ''} found
      </div>
      {results.map((result, index) => (
        <button
          key={result.gridPointId}
          onClick={() => onSelectResult(result)}
          className={`w-full text-left p-4 rounded-lg border transition-all ${
            selectedResult?.gridPointId === result.gridPointId
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
          } ${getScoreBgColor(result.score)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <h3 className="font-semibold text-gray-900 truncate">
                  {result.nearestCity || `${result.state} (${result.latitude.toFixed(2)}°, ${result.longitude.toFixed(2)}°)`}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {result.state} - {formatRegion(result.region)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center text-xs text-gray-500">
                  <span className="mr-1">Temp:</span>
                  <span className="font-medium">{result.scoreBreakdown.temperature}%</span>
                </span>
                <span className="inline-flex items-center text-xs text-gray-500">
                  <span className="mr-1">Humidity:</span>
                  <span className="font-medium">{result.scoreBreakdown.humidity}%</span>
                </span>
                <span className="inline-flex items-center text-xs text-gray-500">
                  <span className="mr-1">Wind:</span>
                  <span className="font-medium">{result.scoreBreakdown.wind}%</span>
                </span>
                <span className="inline-flex items-center text-xs text-gray-500">
                  <span className="mr-1">Precip:</span>
                  <span className="font-medium">{result.scoreBreakdown.precipitation}%</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(
                  result.score
                )}`}
              >
                {result.score}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {result.dataSource === 'forecast'
                  ? 'Forecast'
                  : result.dataSource === 'historical'
                  ? 'Historical'
                  : 'Mixed'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
