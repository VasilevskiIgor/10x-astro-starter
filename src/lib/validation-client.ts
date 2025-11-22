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
  // Additional fields from prototype
  groupSize?: string;
  interests?: string[];
  budget?: string;
  travelStyle?: string;
  accommodation?: string;
  email?: string;
}

export interface TripFormValidation {
  destination?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  groupSize?: string;
  interests?: string;
  budget?: string;
  travelStyle?: string;
  accommodation?: string;
  email?: string;
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
    return "Miejsce docelowe jest wymagane";
  }

  if (destination.length > 200) {
    return "Miejsce docelowe musi mieć mniej niż 200 znaków";
  }

  return undefined;
}

/**
 * Validates start date field
 */
function validateStartDate(startDate: string): string | undefined {
  if (!startDate) {
    return "Data rozpoczęcia jest wymagana";
  }

  if (!isValidDate(startDate)) {
    return "Data rozpoczęcia musi być prawidłową datą";
  }

  return undefined;
}

/**
 * Validates end date field
 */
function validateEndDate(endDate: string, startDate: string): string | undefined {
  if (!endDate) {
    return "Data zakończenia jest wymagana";
  }

  if (!isValidDate(endDate)) {
    return "Data zakończenia musi być prawidłową datą";
  }

  if (startDate && endDate < startDate) {
    return "Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia";
  }

  if (startDate && daysBetween(startDate, endDate) > 365) {
    return "Czas trwania podróży nie może przekroczyć 365 dni";
  }

  return undefined;
}

/**
 * Validates description field
 */
function validateDescription(description: string): string | undefined {
  if (description && description.length > 2000) {
    return "Opis musi mieć mniej niż 2000 znaków";
  }

  return undefined;
}

/**
 * Validates group size field
 */
function validateGroupSize(groupSize?: string): string | undefined {
  if (!groupSize) {
    return undefined; // Optional field
  }

  const validSizes = ['solo', 'couple', 'small', 'large'];
  if (!validSizes.includes(groupSize)) {
    return "Nieprawidłowy rozmiar grupy";
  }

  return undefined;
}

/**
 * Validates interests field
 */
function validateInterests(interests?: string[]): string | undefined {
  if (!interests || interests.length === 0) {
    return undefined; // Optional field
  }

  if (interests.length < 3) {
    return "Wybierz co najmniej 3 zainteresowania";
  }

  if (interests.length > 10) {
    return "Możesz wybrać maksymalnie 10 zainteresowań";
  }

  return undefined;
}

/**
 * Validates budget field
 */
function validateBudget(budget?: string): string | undefined {
  if (!budget) {
    return undefined; // Optional field
  }

  const validBudgets = ['budget', 'low', 'medium', 'high', 'luxury'];
  if (!validBudgets.includes(budget)) {
    return "Nieprawidłowy budżet";
  }

  return undefined;
}

/**
 * Validates travel style field
 */
function validateTravelStyle(travelStyle?: string): string | undefined {
  if (!travelStyle) {
    return undefined; // Optional field
  }

  const validStyles = ['relaxed', 'balanced', 'active', 'cultural', 'adventure'];
  if (!validStyles.includes(travelStyle)) {
    return "Nieprawidłowy styl podróży";
  }

  return undefined;
}

/**
 * Validates accommodation field
 */
function validateAccommodation(accommodation?: string): string | undefined {
  if (!accommodation) {
    return undefined; // Optional field
  }

  const validAccommodations = ['hotel', 'hostel', 'apartment', 'boutique', 'luxury'];
  if (!validAccommodations.includes(accommodation)) {
    return "Nieprawidłowy typ zakwaterowania";
  }

  return undefined;
}

/**
 * Validates email field
 */
function validateEmail(email?: string): string | undefined {
  if (!email) {
    return undefined; // Optional field
  }

  if (!email.trim()) {
    return undefined;
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Nieprawidłowy adres e-mail";
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

  // Validate optional fields
  const groupSizeError = validateGroupSize(data.groupSize);
  if (groupSizeError) {
    errors.groupSize = groupSizeError;
  }

  const interestsError = validateInterests(data.interests);
  if (interestsError) {
    errors.interests = interestsError;
  }

  const budgetError = validateBudget(data.budget);
  if (budgetError) {
    errors.budget = budgetError;
  }

  const travelStyleError = validateTravelStyle(data.travelStyle);
  if (travelStyleError) {
    errors.travelStyle = travelStyleError;
  }

  const accommodationError = validateAccommodation(data.accommodation);
  if (accommodationError) {
    errors.accommodation = accommodationError;
  }

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
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
  value: string | string[] | boolean | undefined,
  formData: TripFormData
): string | undefined {
  switch (fieldName) {
    case "destination":
      return validateDestination(value as string);
    case "startDate":
      return validateStartDate(value as string);
    case "endDate":
      return validateEndDate(value as string, formData.startDate);
    case "description":
      return validateDescription(value as string);
    case "groupSize":
      return validateGroupSize(value as string);
    case "interests":
      return validateInterests(value as string[]);
    case "budget":
      return validateBudget(value as string);
    case "travelStyle":
      return validateTravelStyle(value as string);
    case "accommodation":
      return validateAccommodation(value as string);
    case "email":
      return validateEmail(value as string);
    default:
      return undefined;
  }
}
