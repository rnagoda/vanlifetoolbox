interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  // Calculate date range info
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const daysDiff = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  // Calculate max date (90 days from start)
  const maxEndDate = start
    ? new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : undefined;

  // Validation
  const isValidRange = !startDate || !endDate || (start && end && end >= start);
  const isRangeWarning = daysDiff > 30 && daysDiff <= 90;
  const isRangeTooLong = daysDiff > 90;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
            min={startDate || today}
            max={maxEndDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Range Info */}
      {daysDiff > 0 && (
        <div className="text-sm">
          <span className="text-gray-600">
            {daysDiff} day{daysDiff !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      {/* Validation Messages */}
      {!isValidRange && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">End date must be on or after start date.</p>
        </div>
      )}

      {isRangeWarning && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Ranges over 30 days may include historical data instead of forecasts.
          </p>
        </div>
      )}

      {isRangeTooLong && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">Date range cannot exceed 90 days.</p>
        </div>
      )}
    </div>
  );
}
