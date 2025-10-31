/**
 * TripEditForm Component
 *
 * Form for editing an existing trip.
 * Features:
 * - Pre-filled with current trip data
 * - Real-time validation
 * - Save/Cancel actions
 * - Error handling
 */

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { TripDetailDTO, UpdateTripCommand } from "@/types/dto";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import {
  validateTripForm,
  validateField,
  hasValidationErrors,
  type TripFormData,
  type TripFormValidation,
} from "@/lib/validation-client";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TripEditFormProps {
  tripId: string;
}

// ============================================================================
// Component
// ============================================================================

export const TripEditForm: React.FC<TripEditFormProps> = ({ tripId }) => {
  const [formData, setFormData] = React.useState<TripFormData>({
    destination: "",
    startDate: "",
    endDate: "",
    description: "",
    generateAI: false,
  });

  const [isLoadingTrip, setIsLoadingTrip] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<TripFormValidation>({});
  const [touchedFields, setTouchedFields] = React.useState<Set<keyof TripFormData>>(new Set());

  // Fetch trip data
  React.useEffect(() => {
    const fetchTrip = async () => {
      setIsLoadingTrip(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session) {
          throw new Error("Nie jesteś zalogowany. Zaloguj się.");
        }

        const response = await fetch(`/api/trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Nie udało się pobrać podróży");
        }

        const trip: TripDetailDTO = await response.json();

        // Pre-fill form with trip data
        setFormData({
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          description: trip.description || "",
          generateAI: false, // Not editable
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Wystąpił błąd podczas pobierania podróży");
      } finally {
        setIsLoadingTrip(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  // Handle field changes
  const handleFieldChange = (field: keyof TripFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation for touched fields
    if (touchedFields.has(field) && typeof value === "string") {
      const error = validateField(field, value, {
        ...formData,
        [field]: value,
      });
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleFieldBlur = (field: keyof TripFormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));

    const value = formData[field];
    if (typeof value === "string") {
      const error = validateField(field, value, formData);
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleDateChange = (startDate: string, endDate: string) => {
    setFormData((prev) => ({ ...prev, startDate, endDate }));

    if (touchedFields.has("startDate")) {
      const startDateError = validateField("startDate", startDate, {
        ...formData,
        startDate,
        endDate,
      });
      setValidationErrors((prev) => ({
        ...prev,
        startDate: startDateError,
      }));
    }

    if (touchedFields.has("endDate")) {
      const endDateError = validateField("endDate", endDate, {
        ...formData,
        startDate,
        endDate,
      });
      setValidationErrors((prev) => ({
        ...prev,
        endDate: endDateError,
      }));
    }
  };

  // Handle regenerate AI content
  const handleRegenerateAI = async () => {
    // Mark all fields as touched
    setTouchedFields(new Set(["destination", "startDate", "endDate", "description"]));

    // Validate entire form
    const errors = validateTripForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      setError("Popraw błędy walidacji przed regenerowaniem treści AI.");
      return;
    }

    const confirmRegenerate = window.confirm(
      "Czy na pewno chcesz regenerować treść AI? To zastąpi istniejący plan podróży AI nową treścią opartą na zaktualizowanych szczegółach podróży."
    );

    if (!confirmRegenerate) {
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        throw new Error("Nie jesteś zalogowany. Zaloguj się.");
      }

      // Call the regenerate API endpoint
      const response = await fetch(`/api/trips/${tripId}/regenerate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: formData.destination.trim(),
          start_date: formData.startDate,
          end_date: formData.endDate,
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się regenerować treści AI");
      }

      // Redirect to trip detail page to see the updated content
      window.location.href = `/trips/${tripId}`;
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Wystąpił błąd podczas regenerowania treści AI");
      setIsRegenerating(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouchedFields(new Set(["destination", "startDate", "endDate", "description"]));

    // Validate entire form
    const errors = validateTripForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        throw new Error("Nie jesteś zalogowany. Zaloguj się.");
      }

      // Prepare update payload
      const payload: UpdateTripCommand = {
        destination: formData.destination.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description.trim() || undefined,
      };

      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się zaktualizować podróży");
      }

      // Redirect to trip detail page
      window.location.href = `/trips/${tripId}`;
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Wystąpił błąd podczas aktualizacji podróży");
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoadingTrip) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-full rounded bg-gray-200"></div>
        <div className="h-10 w-full rounded bg-gray-200"></div>
        <div className="h-32 w-full rounded bg-gray-200"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Error Alert */}
      {error && <ErrorAlert type="error" message={error} />}

      {/* Destination Field */}
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
          Miejsce docelowe{" "}
          <span className="text-red-500" aria-label="wymagane">
            *
          </span>
        </label>
        <input
          type="text"
          id="destination"
          name="destination"
          value={formData.destination}
          onChange={(e) => handleFieldChange("destination", e.target.value)}
          onBlur={() => handleFieldBlur("destination")}
          disabled={isSaving || isRegenerating}
          placeholder="np. Paryż, Francja"
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            validationErrors.destination
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${isSaving || isRegenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        {validationErrors.destination && <p className="mt-1 text-sm text-red-600">{validationErrors.destination}</p>}
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={formData.startDate}
        endDate={formData.endDate}
        onChange={handleDateChange}
        errors={{
          startDate: validationErrors.startDate,
          endDate: validationErrors.endDate,
        }}
        disabled={isSaving || isRegenerating}
      />

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Opis <span className="text-gray-500 text-xs">(opcjonalny)</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          onBlur={() => handleFieldBlur("description")}
          disabled={isSaving || isRegenerating}
          placeholder="Opisz swoje preferencje podróży, zainteresowania lub specjalne wymagania..."
          rows={4}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            validationErrors.description
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${isSaving || isRegenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        {validationErrors.description ? (
          <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
        ) : (
          <p className="mt-1 text-sm text-gray-500">{formData.description.length}/2000 znaków</p>
        )}
      </div>

      {/* AI Regeneration Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900">Treść wygenerowana przez AI</h3>
          <p className="mt-1 text-sm text-gray-500">
            Regeneruj plan podróży AI na podstawie zaktualizowanych szczegółów podróży. To zastąpi istniejącą treść AI.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleRegenerateAI}
          disabled={isSaving || isRegenerating}
          className="w-full sm:w-auto"
        >
          {isRegenerating ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Regenerowanie treści AI...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regeneruj treść AI
            </>
          )}
        </Button>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = `/trips/${tripId}`)}
          disabled={isSaving || isRegenerating}
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={isSaving || isRegenerating}>
          {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </div>
    </form>
  );
};
