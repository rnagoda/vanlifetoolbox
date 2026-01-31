import { useState } from 'react';
import type { WeatherFilters, PrecipitationType } from '../../services/api';
import RangeSlider from '../ui/RangeSlider';

interface FilterPanelProps {
  filters: WeatherFilters;
  onFiltersChange: (filters: WeatherFilters) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const PRECIPITATION_TYPES: { value: PrecipitationType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'rain', label: 'Rain' },
  { value: 'snow', label: 'Snow' },
  { value: 'sleet', label: 'Sleet' },
  { value: 'freezing_rain', label: 'Freezing Rain' },
  { value: 'hail', label: 'Hail' },
  { value: 'drizzle', label: 'Drizzle' },
  { value: 'thunderstorms', label: 'Thunderstorms' },
  { value: 'ice_pellets', label: 'Ice Pellets' },
  { value: 'fog', label: 'Fog' },
  { value: 'mist', label: 'Mist' },
  { value: 'mixed', label: 'Mixed' },
];

const REGIONS = [
  { value: '', label: 'All Regions' },
  { value: 'northeast', label: 'Northeast' },
  { value: 'southeast', label: 'Southeast' },
  { value: 'midwest', label: 'Midwest' },
  { value: 'southwest', label: 'Southwest' },
  { value: 'west', label: 'West' },
  { value: 'pacific_northwest', label: 'Pacific Northwest' },
];

interface ExtendedFilters extends WeatherFilters {
  region?: string;
}

interface ExtendedFilterPanelProps extends Omit<FilterPanelProps, 'filters' | 'onFiltersChange'> {
  filters: ExtendedFilters;
  onFiltersChange: (filters: ExtendedFilters) => void;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  onSearch,
  isLoading,
}: ExtendedFilterPanelProps) {
  const [showPrecipTypes, setShowPrecipTypes] = useState(false);

  const updateFilter = <K extends keyof ExtendedFilters>(
    key: K,
    value: ExtendedFilters[K] | undefined
  ) => {
    const newFilters = { ...filters };
    if (value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const togglePrecipTypeExcluded = (type: PrecipitationType) => {
    const current = filters.precipTypesExcluded || [];
    const newTypes = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilter('precipTypesExcluded', newTypes.length > 0 ? newTypes : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-6">
      {/* Temperature Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Temperature Range (°F)
        </label>
        <RangeSlider
          min={0}
          max={120}
          minValue={filters.tempMin ?? 50}
          maxValue={filters.tempMax ?? 85}
          onChange={(newMin, newMax) => {
            onFiltersChange({
              ...filters,
              tempMin: newMin,
              tempMax: newMax,
            });
          }}
          step={5}
          formatLabel={(v) => `${v}°F`}
        />
      </div>

      {/* Humidity Max */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Humidity: {filters.humidityMax ?? 100}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.humidityMax ?? 100}
          onChange={e => {
            const val = Number(e.target.value);
            updateFilter('humidityMax', val < 100 ? val : undefined);
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Wind Speed Max */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Wind Speed: {filters.windSpeedMax ?? 50} mph
        </label>
        <input
          type="range"
          min={0}
          max={50}
          value={filters.windSpeedMax ?? 50}
          onChange={e => {
            const val = Number(e.target.value);
            updateFilter('windSpeedMax', val < 50 ? val : undefined);
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 mph</span>
          <span>50 mph</span>
        </div>
      </div>

      {/* Precipitation Chance Max */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Precipitation Chance: {filters.precipChanceMax ?? 100}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.precipChanceMax ?? 100}
          onChange={e => {
            const val = Number(e.target.value);
            updateFilter('precipChanceMax', val < 100 ? val : undefined);
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Precipitation Types to Exclude */}
      <div>
        <button
          type="button"
          onClick={() => setShowPrecipTypes(!showPrecipTypes)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
        >
          <span>Exclude Precipitation Types</span>
          <span className="text-gray-400">{showPrecipTypes ? '−' : '+'}</span>
        </button>
        {showPrecipTypes && (
          <div className="grid grid-cols-2 gap-2">
            {PRECIPITATION_TYPES.filter(t => t.value !== 'none').map(type => (
              <label key={type.value} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.precipTypesExcluded?.includes(type.value) ?? false}
                  onChange={() => togglePrecipTypeExcluded(type.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Region Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Region
        </label>
        <select
          value={filters.region ?? ''}
          onChange={e => updateFilter('region', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {REGIONS.map(region => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={clearFilters}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : 'Search'}
        </button>
      </div>
    </div>
  );
}
