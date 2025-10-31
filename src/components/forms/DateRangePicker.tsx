/**
 * DateRangePicker Component
 *
 * A date range picker using native HTML5 date inputs with custom styling.
 * Provides real-time validation and displays the trip duration.
 */

import * as React from "react";
import { daysBetween } from "@/lib/validation-client";

// ============================================================================
// Type Definitions
// ============================================================================

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  errors?: {
    startDate?: string;
    endDate?: string;
  };
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  errors = {},
  disabled = false,
}) => {
  const [isTouched, setIsTouched] = React.useState({
    startDate: false,
    endDate: false,
  });

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(startDate, e.target.value);
  };

  const handleStartDateBlur = () => {
    setIsTouched((prev) => ({ ...prev, startDate: true }));
  };

  const handleEndDateBlur = () => {
    setIsTouched((prev) => ({ ...prev, endDate: true }));
  };

  // Calculate duration if both dates are valid
  const duration = React.useMemo(() => {
    if (startDate && endDate && !errors.startDate && !errors.endDate) {
      try {
        const days = daysBetween(startDate, endDate);
        return days;
      } catch {
        return null;
      }
    }
    return null;
  }, [startDate, endDate, errors]);

  const showStartDateError = isTouched.startDate && errors.startDate;
  const showEndDateError = isTouched.endDate && errors.endDate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Start Date */}
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
            Data rozpoczęcia{" "}
            <span className="text-red-500" aria-label="wymagane">
              *
            </span>
          </label>
          <input
            type="date"
            id="start-date"
            name="startDate"
            value={startDate}
            onChange={handleStartDateChange}
            onBlur={handleStartDateBlur}
            disabled={disabled}
            aria-invalid={showStartDateError ? "true" : "false"}
            aria-describedby={showStartDateError ? "start-date-error" : undefined}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
              showStartDateError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : !errors.startDate && startDate && isTouched.startDate
                  ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {showStartDateError && (
            <p id="start-date-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.startDate}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
            Data zakończenia{" "}
            <span className="text-red-500" aria-label="wymagane">
              *
            </span>
          </label>
          <input
            type="date"
            id="end-date"
            name="endDate"
            value={endDate}
            onChange={handleEndDateChange}
            onBlur={handleEndDateBlur}
            disabled={disabled}
            aria-invalid={showEndDateError ? "true" : "false"}
            aria-describedby={showEndDateError ? "end-date-error" : undefined}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
              showEndDateError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : !errors.endDate && endDate && isTouched.endDate
                  ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {showEndDateError && (
            <p id="end-date-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.endDate}
            </p>
          )}
        </div>
      </div>

      {/* Duration Display */}
      {duration !== null && duration >= 0 && (
        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="mr-2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            Czas trwania podróży: <strong>{duration}</strong> {duration === 1 ? "dzień" : duration < 5 ? "dni" : "dni"}
          </span>
        </div>
      )}
    </div>
  );
};
