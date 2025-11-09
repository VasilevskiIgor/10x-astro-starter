/**
 * TripForm Component
 *
 * Main form component for creating a new trip.
 * Features:
 * - Real-time validation
 * - Auto-save to localStorage
 * - AI generation toggle
 * - Error handling and user feedback
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { DateRangePicker } from "./DateRangePicker";
import { useCreateTrip } from "@/hooks/useCreateTrip";
import { useGenerateAI } from "@/hooks/useGenerateAI";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  validateTripForm,
  validateField,
  hasValidationErrors,
  type TripFormData,
  type TripFormValidation,
} from "@/lib/validation-client";
import { loadTripDraft, clearTripDraft, createDebouncedSave } from "@/lib/localStorage";
import type { CreateTripCommand } from "@/types/dto";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TripFormProps {
  onSuccess?: (tripId: string) => void;
  onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const TripForm: React.FC<TripFormProps> = ({ onSuccess, onCancel }) => {
  // ============================================================================
  // Authentication Check
  // ============================================================================

  const { isAuthenticated, isLoading: isCheckingAuth } = useRequireAuth("/auth/login");

  // ============================================================================
  // State Management
  // ============================================================================

  const [formData, setFormData] = React.useState<TripFormData>(() => {
    // Load draft from localStorage on mount
    const draft = loadTripDraft();
    if (draft) {
      return {
        destination: draft.destination || "",
        startDate: draft.startDate || "",
        endDate: draft.endDate || "",
        description: draft.description || "",
        generateAI: draft.generateAI || false,
      };
    }
    return {
      destination: "",
      startDate: "",
      endDate: "",
      description: "",
      generateAI: false,
    };
  });

  const [validationErrors, setValidationErrors] = React.useState<TripFormValidation>({});

  const [touchedFields, setTouchedFields] = React.useState<Set<keyof TripFormData>>(new Set());

  const [showDraftNotice, setShowDraftNotice] = React.useState(() => {
    const draft = loadTripDraft();
    return !!draft;
  });

  const { isLoading, error, validationErrors: apiValidationErrors, trip, createTrip } = useCreateTrip();
  const { isGenerating, error: generateError, generateAI } = useGenerateAI();

  // Track if AI generation should be triggered
  const shouldGenerateAI = React.useRef(false);

  // ============================================================================
  // Auto-save to localStorage
  // ============================================================================

  const debouncedSave = React.useMemo(() => createDebouncedSave(500), []);

  React.useEffect(() => {
    // Auto-save form data (excluding generateAI checkbox)
    if (formData.destination || formData.startDate || formData.endDate || formData.description) {
      debouncedSave(formData);
    }
  }, [formData, debouncedSave]);

  // ============================================================================
  // Success Redirect and AI Generation
  // ============================================================================

  React.useEffect(() => {
    if (trip && !isGenerating) {
      // Clear draft on success
      clearTripDraft();

      // If AI generation was requested, trigger it now
      if (shouldGenerateAI.current) {
        console.log("[TripForm] Trip created, triggering AI generation...");
        shouldGenerateAI.current = false;

        // Trigger AI generation
        generateAI(trip.id).then((success) => {
          if (success) {
            console.log("[TripForm] AI generation initiated successfully");
          } else {
            console.error("[TripForm] AI generation failed:", generateError);
          }

          // Redirect to trip detail page after attempting generation
          if (onSuccess) {
            onSuccess(trip.id);
          } else {
            window.location.href = `/trips/${trip.id}`;
          }
        });
      } else {
        // No AI generation requested, redirect immediately
        if (onSuccess) {
          onSuccess(trip.id);
        } else {
          window.location.href = `/trips/${trip.id}`;
        }
      }
    }
  }, [trip, isGenerating, onSuccess, generateAI, generateError]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

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

    // Validate field on blur
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

    // Validate dates if touched
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

    // Set flag to trigger AI generation after trip creation
    shouldGenerateAI.current = formData.generateAI;

    // Prepare API payload
    const payload: CreateTripCommand = {
      destination: formData.destination.trim(),
      start_date: formData.startDate,
      end_date: formData.endDate,
      description: formData.description.trim() || undefined,
      generate_ai: formData.generateAI,
    };

    // Submit to API
    await createTrip(payload);
  };

  const handleDismissDraftNotice = () => {
    setShowDraftNotice(false);
  };

  const handleClearDraft = () => {
    clearTripDraft();
    setFormData({
      destination: "",
      startDate: "",
      endDate: "",
      description: "",
      generateAI: false,
    });
    setValidationErrors({});
    setTouchedFields(new Set());
    setShowDraftNotice(false);
  };

  // ============================================================================
  // Merge validation errors from client and API
  // ============================================================================

  const displayErrors = React.useMemo(() => {
    const merged = { ...validationErrors };

    if (apiValidationErrors) {
      Object.entries(apiValidationErrors).forEach(([field, message]) => {
        // Map API field names to form field names
        const formField = field === "start_date" ? "startDate" : field === "end_date" ? "endDate" : field;
        merged[formField as keyof TripFormValidation] = message;
      });
    }

    return merged;
  }, [validationErrors, apiValidationErrors]);

  // ============================================================================
  // Render
  // ============================================================================

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 animate-spin text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-600">Sprawdzanie uwierzytelnienia...</p>
        </div>
      </div>
    );
  }

  // Don't render form if not authenticated (will be redirected by useRequireAuth)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Draft Notice */}
      {showDraftNotice && (
        <ErrorAlert
          type="info"
          message="Przywróciliśmy Twój poprzedni szkic. Możesz kontynuować edycję lub zacząć od nowa."
          dismissible
          onDismiss={handleDismissDraftNotice}
        />
      )}

      {/* API Error Alert */}
      {error && !apiValidationErrors && <ErrorAlert type="error" message={error} />}

      {/* AI Generation Error Alert */}
      {generateError && <ErrorAlert type="error" message={`AI Generation Error: ${generateError}`} />}

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
          disabled={isLoading || isGenerating}
          placeholder="np. Paryż, Francja"
          aria-invalid={displayErrors.destination ? "true" : "false"}
          aria-describedby={displayErrors.destination ? "destination-error" : undefined}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            displayErrors.destination
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : !displayErrors.destination && formData.destination && touchedFields.has("destination")
                ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${isLoading || isGenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        {displayErrors.destination && (
          <p id="destination-error" className="mt-1 text-sm text-red-600" role="alert">
            {displayErrors.destination}
          </p>
        )}
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={formData.startDate}
        endDate={formData.endDate}
        onChange={handleDateChange}
        errors={{
          startDate: displayErrors.startDate,
          endDate: displayErrors.endDate,
        }}
        disabled={isLoading || isGenerating}
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
          disabled={isLoading || isGenerating}
          placeholder="Opisz swoje preferencje podróży, zainteresowania lub specjalne wymagania..."
          rows={4}
          aria-invalid={displayErrors.description ? "true" : "false"}
          aria-describedby={displayErrors.description ? "description-error" : "description-hint"}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            displayErrors.description
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${isLoading || isGenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
        />
        {displayErrors.description ? (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {displayErrors.description}
          </p>
        ) : (
          <p id="description-hint" className="mt-1 text-sm text-gray-500">
            {formData.description.length}/2000 znaków
          </p>
        )}
      </div>

      {/* AI Generation Toggle */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              type="checkbox"
              id="generate-ai"
              name="generateAI"
              checked={formData.generateAI}
              onChange={(e) => handleFieldChange("generateAI", e.target.checked)}
              disabled={isLoading || isGenerating}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="generate-ai" className="font-medium text-gray-700">
              Generuj plan podróży AI
            </label>
            <p className="text-gray-500">
              Automatycznie stwórz szczegółowy plan dzień po dniu używając AI na podstawie miejsca docelowego i Twoich
              preferencji.
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <div className="flex gap-2">
          {showDraftNotice && (
            <Button type="button" variant="outline" onClick={handleClearDraft} disabled={isLoading || isGenerating}>
              Wyczyść szkic
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isGenerating}>
              Anuluj
            </Button>
          )}
        </div>
        <Button type="submit" disabled={isLoading || isGenerating}>
          {isLoading || isGenerating ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isGenerating
                ? "Generowanie AI..."
                : formData.generateAI
                  ? "Tworzenie podróży..."
                  : "Tworzenie podróży..."}
            </>
          ) : (
            "Utwórz podróż"
          )}
        </Button>
      </div>
    </form>
  );
};
