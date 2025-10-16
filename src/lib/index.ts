/**
 * Library Index
 *
 * Central export point for all shared utilities and helpers.
 * Import from here to keep imports clean and organized.
 *
 * @example
 * import { validateCreateTripCommand, errorResponse, cn } from '../lib';
 */

// Validation utilities
export {
  validateCreateTripCommand,
  validateUpdateTripCommand,
  validateGenerateAICommand,
  validateTripsQueryParams,
  validateAILogsQueryParams,
  isValidUUID,
  type ValidationResult,
} from './validation';

// API helpers
export {
  createErrorResponse,
  getStatusForErrorCode,
  errorResponse,
  successResponse,
  noContentResponse,
  getUserIdFromRequest,
  parseRequestBody,
  corsPreflightResponse,
  CORS_HEADERS,
} from './api-helpers';

// General utilities
export { cn } from './utils';
