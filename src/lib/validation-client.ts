/**
 * Client-side validation functions for trip form
 *
 * This file contains validation logic that mirrors server-side validation
 * to provide immediate feedback to users.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  generateAI: boolean;
}

export interface TripFormValidation {
  destination?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  general?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if a string is a valid ISO 8601 date (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Calculates the number of days between two dates
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ============================================================================
// Field Validation Functions
// ============================================================================

/**
 * Validates destination field
 */
function validateDestination(destination: string): string | undefined {
  if (!destination.trim()) {
    return 'Destination is required';
  }

  if (destination.length > 200) {
    return 'Destination must be less than 200 characters';
  }

  return undefined;
}

/**
 * Validates start date field
 */
function validateStartDate(startDate: string): string | undefined {
  if (!startDate) {
    return 'Start date is required';
  }

  if (!isValidDate(startDate)) {
    return 'Start date must be a valid date';
  }

  return undefined;
}

/**
 * Validates end date field
 */
function validateEndDate(
  endDate: string,
  startDate: string
): string | undefined {
  if (!endDate) {
    return 'End date is required';
  }

  if (!isValidDate(endDate)) {
    return 'End date must be a valid date';
  }

  if (startDate && endDate < startDate) {
    return 'End date must be after or equal to start date';
  }

  if (startDate && daysBetween(startDate, endDate) > 365) {
    return 'Trip duration cannot exceed 365 days';
  }

  return undefined;
}

/**
 * Validates description field
 */
function validateDescription(description: string): string | undefined {
  if (description && description.length > 2000) {
    return 'Description must be less than 2000 characters';
  }

  return undefined;
}

// ============================================================================
// Form Validation Function
// ============================================================================

/**
 * Validates entire trip form
 * Returns object with field-specific error messages
 */
export function validateTripForm(data: TripFormData): TripFormValidation {
  const errors: TripFormValidation = {};

  // Validate destination
  const destinationError = validateDestination(data.destination);
  if (destinationError) {
    errors.destination = destinationError;
  }

  // Validate start date
  const startDateError = validateStartDate(data.startDate);
  if (startDateError) {
    errors.startDate = startDateError;
  }

  // Validate end date
  const endDateError = validateEndDate(data.endDate, data.startDate);
  if (endDateError) {
    errors.endDate = endDateError;
  }

  // Validate description
  const descriptionError = validateDescription(data.description);
  if (descriptionError) {
    errors.description = descriptionError;
  }

  return errors;
}

/**
 * Checks if form has any validation errors
 */
export function hasValidationErrors(errors: TripFormValidation): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Validates a single field (for real-time validation)
 */
export function validateField(
  fieldName: keyof TripFormData,
  value: string,
  formData: TripFormData
): string | undefined {
  switch (fieldName) {
    case 'destination':
      return validateDestination(value);
    case 'startDate':
      return validateStartDate(value);
    case 'endDate':
      return validateEndDate(value, formData.startDate);
    case 'description':
      return validateDescription(value);
    default:
      return undefined;
  }
}
