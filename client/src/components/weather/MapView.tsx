import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { SearchResult } from './types';

interface MapViewProps {
  results: SearchResult[];
  selectedResult: SearchResult | null;
  onSelectResult: (result: SearchResult) => void;
}

// Score to color mapping (red -> yellow -> green)
function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#84cc16'; // lime-500
  if (score >= 40) return '#eab308'; // yellow-500
  if (score >= 20) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

// Component to handle map bounds updates
function MapBoundsUpdater({ results }: { results: SearchResult[] }) {
  const map = useMap();
  const hasSetBounds = useRef(false);

  useEffect(() => {
    if (results.length > 0 && !hasSetBounds.current) {
      const bounds: [number, number][] = results.map(r => [r.latitude, r.longitude]);
      map.fitBounds(bounds, { padding: [50, 50] });
      hasSetBounds.current = true;
    }
  }, [results, map]);

  // Reset flag when results change
  useEffect(() => {
    hasSetBounds.current = false;
  }, [results.length]);

  return null;
}

export default function MapView({ results, selectedResult, onSelectResult }: MapViewProps) {
  // Default center on continental US
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full rounded-lg"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater results={results} />

      {results.map(result => (
        <CircleMarker
          key={result.gridPointId}
          center={[result.latitude, result.longitude]}
          radius={selectedResult?.gridPointId === result.gridPointId ? 12 : 8}
          fillColor={getScoreColor(result.score)}
          fillOpacity={selectedResult?.gridPointId === result.gridPointId ? 0.9 : 0.7}
          stroke={selectedResult?.gridPointId === result.gridPointId}
          color="#ffffff"
          weight={2}
          eventHandlers={{
            click: () => onSelectResult(result),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="font-semibold text-lg">
                {result.nearestCity || `${result.state} Location`}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {result.state} - {result.region.replace('_', ' ')}
                <div className="text-xs text-gray-400">
                  {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: getScoreColor(result.score) }}
                >
                  {result.score}
                </div>
                <span className="text-sm">Match Score</span>
              </div>
              <div className="text-xs text-gray-500">
                Data: {result.dataSource}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className="font-medium">{result.scoreBreakdown.temperature}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity:</span>
                    <span className="font-medium">{result.scoreBreakdown.humidity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind:</span>
                    <span className="font-medium">{result.scoreBreakdown.wind}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precipitation:</span>
                    <span className="font-medium">{result.scoreBreakdown.precipitation}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
