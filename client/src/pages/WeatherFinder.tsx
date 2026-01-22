export default function WeatherFinder() {
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
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <p className="text-sm text-gray-500">
              Weather filters will be implemented here.
            </p>
            {/* TODO: FilterPanel component */}
          </div>
        </div>

        {/* Map and Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Map</h2>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Map will be displayed here</p>
              {/* TODO: MapView component with Leaflet */}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Results</h2>
            <p className="text-sm text-gray-500">
              Search results will appear here after you set your filters and search.
            </p>
            {/* TODO: ResultsList component */}
          </div>
        </div>
      </div>
    </div>
  );
}
