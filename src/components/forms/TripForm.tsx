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
import { LocationAutocomplete } from "./LocationAutocomplete";
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
        groupSize: draft.groupSize,
        interests: draft.interests || [],
        budget: draft.budget,
        travelStyle: draft.travelStyle,
        accommodation: draft.accommodation,
        email: draft.email,
      };
    }
    return {
      destination: "",
      startDate: "",
      endDate: "",
      description: "",
      generateAI: false,
      groupSize: undefined,
      interests: [],
      budget: undefined,
      travelStyle: undefined,
      accommodation: undefined,
      email: undefined,
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
  // Track if we've already handled the trip creation to prevent duplicate runs
  const hasHandledTrip = React.useRef(false);

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
    console.log(
      "[TripForm] useEffect triggered - trip:",
      trip?.id,
      "hasHandledTrip:",
      hasHandledTrip.current,
      "shouldGenerateAI:",
      shouldGenerateAI.current
    );

    if (trip && !hasHandledTrip.current) {
      // Mark as handled immediately to prevent duplicate runs
      hasHandledTrip.current = true;
      console.log("[TripForm] Handling trip creation for trip ID:", trip.id);

      // Clear draft on success
      clearTripDraft();

      // If AI generation was requested, trigger it now
      if (shouldGenerateAI.current) {
        console.log("[TripForm] AI generation was requested, triggering now...");
        console.log("[TripForm] Trip data:", {
          id: trip.id,
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          description: trip.description,
          status: trip.status,
        });
        shouldGenerateAI.current = false;

        // Add a small delay to ensure database is fully committed
        setTimeout(() => {
          console.log("[TripForm] Calling generateAI with trip ID:", trip.id);

          // Trigger AI generation
          generateAI(trip.id)
            .then((success) => {
              console.log("[TripForm] generateAI promise resolved. Success:", success);

              if (success) {
                console.log("[TripForm] AI generation initiated successfully");
              } else {
                console.error("[TripForm] AI generation failed:", generateError);
              }

              // Redirect to trip detail page after attempting generation
              console.log("[TripForm] Redirecting to trip detail page...");
              if (onSuccess) {
                onSuccess(trip.id);
              } else {
                window.location.href = `/trips/${trip.id}`;
              }
            })
            .catch((error) => {
              console.error("[TripForm] generateAI promise rejected:", error);
              // Still redirect even if generation fails
              if (onSuccess) {
                onSuccess(trip.id);
              } else {
                window.location.href = `/trips/${trip.id}`;
              }
            });
        }, 500); // 500ms delay to ensure DB commit
      } else {
        // No AI generation requested, redirect immediately
        console.log("[TripForm] No AI generation requested, redirecting immediately");
        if (onSuccess) {
          onSuccess(trip.id);
        } else {
          window.location.href = `/trips/${trip.id}`;
        }
      }
    }
  }, [trip, onSuccess, generateAI, generateError]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFieldChange = (field: keyof TripFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation for touched fields
    if (touchedFields.has(field)) {
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
    const error = validateField(field, value, formData);
    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
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

    console.log("[TripForm] handleSubmit called");
    console.log("[TripForm] formData.generateAI:", formData.generateAI);

    // Mark all fields as touched
    setTouchedFields(new Set(["destination", "startDate", "endDate", "description"]));

    // Validate entire form
    const errors = validateTripForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log("[TripForm] Validation errors, aborting submit");
      return;
    }

    // Set flag to trigger AI generation after trip creation
    shouldGenerateAI.current = formData.generateAI;
    console.log("[TripForm] shouldGenerateAI.current set to:", shouldGenerateAI.current);

    // Prepare API payload
    const payload: CreateTripCommand = {
      destination: formData.destination.trim(),
      start_date: formData.startDate,
      end_date: formData.endDate,
      description: formData.description.trim() || undefined,
      generate_ai: formData.generateAI,
    };

    console.log("[TripForm] Calling createTrip with payload:", payload);

    // Submit to API
    await createTrip(payload);

    console.log("[TripForm] createTrip completed");
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
      groupSize: undefined,
      interests: [],
      budget: undefined,
      travelStyle: undefined,
      accommodation: undefined,
      email: undefined,
    });
    setValidationErrors({});
    setTouchedFields(new Set());
    setShowDraftNotice(false);
  };

  const handleInterestToggle = (interest: string) => {
    const currentInterests = formData.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];

    handleFieldChange('interests', newInterests);
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

      {/* Destination Field with Autocomplete */}
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
          Miejsce docelowe{" "}
          <span className="text-red-500" aria-label="wymagane">
            *
          </span>
        </label>
        <LocationAutocomplete
          value={formData.destination}
          onChange={(value) => handleFieldChange("destination", value)}
          onBlur={() => handleFieldBlur("destination")}
          disabled={isLoading || isGenerating}
          error={displayErrors.destination}
          placeholder="np. Paryż, Francja"
          language="pl"
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

      {/* Group Size Field */}
      <div>
        <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700">
          Wielkość grupy <span className="text-gray-500 text-xs">(opcjonalny)</span>
        </label>
        <select
          id="groupSize"
          name="groupSize"
          value={formData.groupSize || ""}
          onChange={(e) => handleFieldChange("groupSize", e.target.value)}
          onBlur={() => handleFieldBlur("groupSize")}
          disabled={isLoading || isGenerating}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            displayErrors.groupSize
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${isLoading || isGenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
        >
          <option value="">Wybierz wielkość grupy</option>
          <option value="solo">Podróżnik solo</option>
          <option value="couple">Para (2 osoby)</option>
          <option value="small">Mała grupa (3-5 osób)</option>
          <option value="large">Duża grupa (6+ osób)</option>
        </select>
        {displayErrors.groupSize && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {displayErrors.groupSize}
          </p>
        )}
      </div>

      {/* Interests Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zainteresowania <span className="text-gray-500 text-xs">(opcjonalny, 3-10 elementów)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {[
            { key: 'history', label: '🏛️ Historia', color: 'purple' },
            { key: 'food', label: '🍽️ Jedzenie', color: 'red' },
            { key: 'nature', label: '🌲 Natura', color: 'green' },
            { key: 'museums', label: '🏛️ Muzea', color: 'blue' },
            { key: 'shopping', label: '🛍️ Zakupy', color: 'orange' },
            { key: 'nightlife', label: '🌙 Życie nocne', color: 'indigo' },
            { key: 'architecture', label: '🏗️ Architektura', color: 'gray' },
            { key: 'art', label: '🎨 Sztuka', color: 'pink' },
            { key: 'music', label: '🎵 Muzyka', color: 'cyan' },
            { key: 'sports', label: '⚽ Sport', color: 'emerald' },
            { key: 'beaches', label: '🏖️ Plaże', color: 'yellow' },
            { key: 'photography', label: '📷 Fotografia', color: 'violet' },
          ].map((interest) => {
            const isSelected = formData.interests?.includes(interest.key);
            return (
              <button
                key={interest.key}
                type="button"
                onClick={() => handleInterestToggle(interest.key)}
                disabled={isLoading || isGenerating}
                className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                } ${isLoading || isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
        {displayErrors.interests && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {displayErrors.interests}
          </p>
        )}
        {formData.interests && formData.interests.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Wybrano: {formData.interests.length}/10
          </p>
        )}
      </div>

      {/* Budget and Travel Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
            Budżet dzienny <span className="text-gray-500 text-xs">(opcjonalny)</span>
          </label>
          <select
            id="budget"
            name="budget"
            value={formData.budget || ""}
            onChange={(e) => handleFieldChange("budget", e.target.value)}
            onBlur={() => handleFieldBlur("budget")}
            disabled={isLoading || isGenerating}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
              displayErrors.budget
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } ${isLoading || isGenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
          >
            <option value="">Wybierz zakres budżetu</option>
            <option value="budget">Oszczędny (30-80€/dzień)</option>
            <option value="low">Niski (80-150€/dzień)</option>
            <option value="medium">Średni (150-300€/dzień)</option>
            <option value="high">Wysoki (300-500€/dzień)</option>
            <option value="luxury">Luksusowy (500€+/dzień)</option>
          </select>
          {displayErrors.budget && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {displayErrors.budget}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="travelStyle" className="block text-sm font-medium text-gray-700">
            Styl podróży <span className="text-gray-500 text-xs">(opcjonalny)</span>
          </label>
          <select
            id="travelStyle"
            name="travelStyle"
            value={formData.travelStyle || ""}
            onChange={(e) => handleFieldChange("travelStyle", e.target.value)}
            onBlur={() => handleFieldBlur("travelStyle")}
            disabled={isLoading || isGenerating}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
              displayErrors.travelStyle
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } ${isLoading || isGenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
          >
            <option value="">Wybierz styl podróży</option>
            <option value="relaxed">Spokojny i powolny</option>
            <option value="balanced">Zrównoważony</option>
            <option value="active">Aktywny i intensywny</option>
            <option value="cultural">Skupiony na kulturze</option>
            <option value="adventure">Poszukiwanie przygód</option>
          </select>
          {displayErrors.travelStyle && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {displayErrors.travelStyle}
            </p>
          )}
        </div>
      </div>

      {/* Accommodation Field */}
      <div>
        <label htmlFor="accommodation" className="block text-sm font-medium text-gray-700">
          Preferencje noclegowe <span className="text-gray-500 text-xs">(opcjonalny)</span>
        </label>
        <select
          id="accommodation"
          name="accommodation"
          value={formData.accommodation || ""}
          onChange={(e) => handleFieldChange("accommodation", e.target.value)}
          onBlur={() => handleFieldBlur("accommodation")}
          disabled={isLoading || isGenerating}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            displayErrors.accommodation
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          } ${isLoading || isGenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
        >
          <option value="">Bez preferencji</option>
          <option value="hotel">Hotele</option>
          <option value="hostel">Hostele</option>
          <option value="apartment">Apartamenty/Airbnb</option>
          <option value="boutique">Hotele butikowe</option>
          <option value="luxury">Luksusowe kurorty</option>
        </select>
        {displayErrors.accommodation && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {displayErrors.accommodation}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Dodatkowe informacje <span className="text-gray-500 text-xs">(opcjonalny)</span>
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

      {/* Email Field (for AI generation notifications) */}
      {formData.generateAI && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Adres e-mail <span className="text-gray-500 text-xs">(opcjonalny - do powiadomień AI)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ""}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            onBlur={() => handleFieldBlur("email")}
            disabled={isLoading || isGenerating}
            placeholder="twoj@email.com"
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
              displayErrors.email
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } ${isLoading || isGenerating ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {displayErrors.email && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {displayErrors.email}
            </p>
          )}
        </div>
      )}

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
