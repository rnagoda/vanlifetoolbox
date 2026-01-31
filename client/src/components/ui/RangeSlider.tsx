import { useCallback, useRef, useState, useEffect } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  step?: number;
  formatLabel?: (value: number) => string;
  className?: string;
}

export default function RangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onChange,
  step = 1,
  formatLabel = (v) => String(v),
  className = '',
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  // Calculate percentage position
  const getPercent = useCallback(
    (value: number) => ((value - min) / (max - min)) * 100,
    [min, max]
  );

  // Get value from position
  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + percent * (max - min);

      // Snap to step
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step]
  );

  // Handle pointer events
  const handlePointerDown = useCallback(
    (thumb: 'min' | 'max') => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(thumb);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;

      const newValue = getValueFromPosition(e.clientX);

      if (dragging === 'min') {
        // Don't let min exceed max
        const clampedValue = Math.min(newValue, maxValue - step);
        if (clampedValue !== minValue) {
          onChange(clampedValue, maxValue);
        }
      } else {
        // Don't let max go below min
        const clampedValue = Math.max(newValue, minValue + step);
        if (clampedValue !== maxValue) {
          onChange(minValue, clampedValue);
        }
      }
    },
    [dragging, getValueFromPosition, minValue, maxValue, step, onChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDragging(null);
    },
    []
  );

  // Handle track click to jump to position
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) return;

      const clickValue = getValueFromPosition(e.clientX);
      const distToMin = Math.abs(clickValue - minValue);
      const distToMax = Math.abs(clickValue - maxValue);

      // Move the closer thumb
      if (distToMin <= distToMax) {
        const newMin = Math.min(clickValue, maxValue - step);
        onChange(newMin, maxValue);
      } else {
        const newMax = Math.max(clickValue, minValue + step);
        onChange(minValue, newMax);
      }
    },
    [dragging, getValueFromPosition, minValue, maxValue, step, onChange]
  );

  // Touch-friendly: prevent default to avoid scrolling while dragging
  useEffect(() => {
    if (dragging && trackRef.current) {
      const preventScroll = (e: TouchEvent) => e.preventDefault();
      document.addEventListener('touchmove', preventScroll, { passive: false });
      return () => document.removeEventListener('touchmove', preventScroll);
    }
  }, [dragging]);

  const minPercent = getPercent(minValue);
  const maxPercent = getPercent(maxValue);

  return (
    <div className={`relative ${className}`}>
      {/* Track background */}
      <div
        ref={trackRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer touch-none"
        onClick={handleTrackClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Active range highlight */}
        <div
          className="absolute h-full bg-blue-500 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab touch-none ${
            dragging === 'min' ? 'cursor-grabbing scale-110 z-20' : 'z-10 hover:scale-105'
          } transition-transform`}
          style={{ left: `${minPercent}%` }}
          onPointerDown={handlePointerDown('min')}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={maxValue}
          aria-valuenow={minValue}
          aria-label="Minimum value"
          tabIndex={0}
        />

        {/* Max thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab touch-none ${
            dragging === 'max' ? 'cursor-grabbing scale-110 z-20' : 'z-10 hover:scale-105'
          } transition-transform`}
          style={{ left: `${maxPercent}%` }}
          onPointerDown={handlePointerDown('max')}
          role="slider"
          aria-valuemin={minValue}
          aria-valuemax={max}
          aria-valuenow={maxValue}
          aria-label="Maximum value"
          tabIndex={0}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span className="font-medium text-blue-600">{formatLabel(minValue)}</span>
        <span className="font-medium text-blue-600">{formatLabel(maxValue)}</span>
      </div>

      {/* Min/Max bounds */}
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{formatLabel(min)}</span>
        <span>{formatLabel(max)}</span>
      </div>
    </div>
  );
}
