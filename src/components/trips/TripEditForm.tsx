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

import * as React from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { TripDetailDTO, UpdateTripCommand } from '@/types/dto';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import {
  validateTripForm,
  validateField,
  hasValidationErrors,
  type TripFormData,
  type TripFormValidation,
} from '@/lib/validation-client';

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
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    generateAI: false,
  });

  const [isLoadingTrip, setIsLoadingTrip] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<TripFormValidation>({});
  const [touchedFields, setTouchedFields] = React.useState<Set<keyof TripFormData>>(new Set());

  // Fetch trip data
  React.useEffect(() => {
    const fetchTrip = async () => {
      setIsLoadingTrip(true);
      setError(null);

      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();

        if (!session) {
          throw new Error('Not authenticated. Please log in.');
        }

        const response = await fetch(`/api/trips/${tripId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch trip');
        }

        const trip: TripDetailDTO = await response.json();

        // Pre-fill form with trip data
        setFormData({
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          description: trip.description || '',
          generateAI: false, // Not editable
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching trip');
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
    if (touchedFields.has(field) && typeof value === 'string') {
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
    if (typeof value === 'string') {
      const error = validateField(field, value, formData);
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleDateChange = (startDate: string, endDate: string) => {
    setFormData((prev) => ({ ...prev, startDate, endDate }));

    if (touchedFields.has('startDate')) {
      const startDateError = validateField('startDate', startDate, {
        ...formData,
        startDate,
        endDate,
      });
      setValidationErrors((prev) => ({
        ...prev,
        startDate: startDateError,
      }));
    }

    if (touchedFields.has('endDate')) {
      const endDateError = validateField('endDate', endDate, {
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouchedFields(new Set(['destination', 'startDate', 'endDate', 'description']));

    // Validate entire form
    const errors = validateTripForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Prepare update payload
      const payload: UpdateTripCommand = {
        destination: formData.destination.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description.trim() || undefined,
      };

      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update trip');
      }

      // Redirect to trip detail page
      window.location.href = `/trips/${tripId}`;
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating trip');
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
          Destination <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="destination"
          name="destination"
          value={formData.destination}
          onChange={(e) => handleFieldChange('destination', e.target.value)}
          onBlur={() => handleFieldBlur('destination')}
          disabled={isSaving}
          placeholder="e.g., Paris, France"
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            validationErrors.destination
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {validationErrors.destination && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.destination}</p>
        )}
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
        disabled={isSaving}
      />

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          onBlur={() => handleFieldBlur('description')}
          disabled={isSaving}
          placeholder="Describe your trip preferences, interests, or special requirements..."
          rows={4}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            validationErrors.description
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {validationErrors.description ? (
          <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
        ) : (
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/2000 characters
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = `/trips/${tripId}`)}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
