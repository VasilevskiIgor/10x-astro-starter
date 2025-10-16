/**
 * API Request Validation Utilities
 *
 * This file contains validation functions for API request bodies and query parameters.
 * All validation rules are based on the specifications in api-plan.md section 8.1.
 *
 * @see dto.ts for type definitions
 * @see api-plan.md section 8 for validation rules
 */

import type {
  CreateTripCommand,
  UpdateTripCommand,
  GenerateAICommand,
  TripsQueryParams,
  AILogsQueryParams,
  ValidationErrorDetail,
  TripSortField,
} from '../types/dto';

/**
 * Validation result type
 * Contains both success flag and error details for failed validations
 */
export type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; errors: ValidationErrorDetail[] };

/**
 * Validates CreateTripCommand request body
 *
 * Validation rules:
 * - destination: required, max 200 chars
 * - start_date: required, valid ISO date
 * - end_date: required, valid ISO date, >= start_date, <= start_date + 365 days
 * - description: optional, max 2000 chars
 * - generate_ai: optional, boolean
 *
 * @param data - Request body data
 * @returns ValidationResult with errors or success
 */
export function validateCreateTripCommand(data: unknown): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'body',
      message: 'Request body must be a valid JSON object',
    });
    return { success: false, errors };
  }

  const body = data as Partial<CreateTripCommand>;

  // Validate destination
  if (!body.destination) {
    errors.push({
      field: 'destination',
      message: 'Destination is required',
    });
  } else if (typeof body.destination !== 'string') {
    errors.push({
      field: 'destination',
      message: 'Destination must be a string',
      value: body.destination,
    });
  } else if (body.destination.length === 0) {
    errors.push({
      field: 'destination',
      message: 'Destination cannot be empty',
    });
  } else if (body.destination.length > 200) {
    errors.push({
      field: 'destination',
      message: 'Destination must be less than 200 characters',
      value: body.destination.length,
    });
  }

  // Validate start_date
  if (!body.start_date) {
    errors.push({
      field: 'start_date',
      message: 'Start date is required',
    });
  } else if (typeof body.start_date !== 'string') {
    errors.push({
      field: 'start_date',
      message: 'Start date must be a string in ISO 8601 format',
      value: body.start_date,
    });
  } else if (!isValidISODate(body.start_date)) {
    errors.push({
      field: 'start_date',
      message: 'Start date must be a valid ISO 8601 date (YYYY-MM-DD)',
      value: body.start_date,
    });
  }

  // Validate end_date
  if (!body.end_date) {
    errors.push({
      field: 'end_date',
      message: 'End date is required',
    });
  } else if (typeof body.end_date !== 'string') {
    errors.push({
      field: 'end_date',
      message: 'End date must be a string in ISO 8601 format',
      value: body.end_date,
    });
  } else if (!isValidISODate(body.end_date)) {
    errors.push({
      field: 'end_date',
      message: 'End date must be a valid ISO 8601 date (YYYY-MM-DD)',
      value: body.end_date,
    });
  }

  // Cross-field validation: end_date >= start_date
  if (
    body.start_date &&
    body.end_date &&
    isValidISODate(body.start_date) &&
    isValidISODate(body.end_date)
  ) {
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    if (endDate < startDate) {
      errors.push({
        field: 'end_date',
        message: 'End date must be after or equal to start date',
        value: body.end_date,
      });
    }

    // Check trip duration <= 365 days
    const diffDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 365) {
      errors.push({
        field: 'end_date',
        message: 'Trip duration cannot exceed 365 days',
        value: diffDays,
      });
    }
  }

  // Validate description (optional)
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        value: body.description,
      });
    } else if (body.description.length > 2000) {
      errors.push({
        field: 'description',
        message: 'Description must be less than 2000 characters',
        value: body.description.length,
      });
    }
  }

  // Validate generate_ai (optional)
  if (body.generate_ai !== undefined && typeof body.generate_ai !== 'boolean') {
    errors.push({
      field: 'generate_ai',
      message: 'generate_ai must be a boolean',
      value: body.generate_ai,
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body as CreateTripCommand };
}

/**
 * Validates UpdateTripCommand request body
 *
 * All fields are optional, but if provided must meet validation rules.
 *
 * @param data - Request body data
 * @returns ValidationResult with errors or success
 */
export function validateUpdateTripCommand(data: unknown): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'body',
      message: 'Request body must be a valid JSON object',
    });
    return { success: false, errors };
  }

  const body = data as Partial<UpdateTripCommand>;

  // At least one field must be provided
  if (Object.keys(body).length === 0) {
    errors.push({
      field: 'body',
      message: 'At least one field must be provided for update',
    });
    return { success: false, errors };
  }

  // Validate destination (optional)
  if (body.destination !== undefined) {
    if (typeof body.destination !== 'string') {
      errors.push({
        field: 'destination',
        message: 'Destination must be a string',
        value: body.destination,
      });
    } else if (body.destination.length === 0) {
      errors.push({
        field: 'destination',
        message: 'Destination cannot be empty',
      });
    } else if (body.destination.length > 200) {
      errors.push({
        field: 'destination',
        message: 'Destination must be less than 200 characters',
        value: body.destination.length,
      });
    }
  }

  // Validate start_date (optional)
  if (body.start_date !== undefined) {
    if (typeof body.start_date !== 'string') {
      errors.push({
        field: 'start_date',
        message: 'Start date must be a string in ISO 8601 format',
        value: body.start_date,
      });
    } else if (!isValidISODate(body.start_date)) {
      errors.push({
        field: 'start_date',
        message: 'Start date must be a valid ISO 8601 date (YYYY-MM-DD)',
        value: body.start_date,
      });
    }
  }

  // Validate end_date (optional)
  if (body.end_date !== undefined) {
    if (typeof body.end_date !== 'string') {
      errors.push({
        field: 'end_date',
        message: 'End date must be a string in ISO 8601 format',
        value: body.end_date,
      });
    } else if (!isValidISODate(body.end_date)) {
      errors.push({
        field: 'end_date',
        message: 'End date must be a valid ISO 8601 date (YYYY-MM-DD)',
        value: body.end_date,
      });
    }
  }

  // Cross-field validation: if both dates provided, end_date >= start_date
  if (
    body.start_date &&
    body.end_date &&
    isValidISODate(body.start_date) &&
    isValidISODate(body.end_date)
  ) {
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    if (endDate < startDate) {
      errors.push({
        field: 'end_date',
        message: 'End date must be after or equal to start date',
        value: body.end_date,
      });
    }

    const diffDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 365) {
      errors.push({
        field: 'end_date',
        message: 'Trip duration cannot exceed 365 days',
        value: diffDays,
      });
    }
  }

  // Validate description (optional)
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        value: body.description,
      });
    } else if (body.description.length > 2000) {
      errors.push({
        field: 'description',
        message: 'Description must be less than 2000 characters',
        value: body.description.length,
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body as UpdateTripCommand };
}

/**
 * Validates GenerateAICommand request body
 *
 * @param data - Request body data
 * @returns ValidationResult with errors or success
 */
export function validateGenerateAICommand(data: unknown): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  // Body is optional, can be empty
  if (!data || typeof data !== 'object') {
    return { success: true, data: {} as GenerateAICommand };
  }

  const body = data as Partial<GenerateAICommand>;

  // Validate model (optional)
  if (body.model !== undefined && typeof body.model !== 'string') {
    errors.push({
      field: 'model',
      message: 'Model must be a string',
      value: body.model,
    });
  }

  // Validate temperature (optional)
  if (body.temperature !== undefined) {
    if (typeof body.temperature !== 'number') {
      errors.push({
        field: 'temperature',
        message: 'Temperature must be a number',
        value: body.temperature,
      });
    } else if (body.temperature < 0 || body.temperature > 1) {
      errors.push({
        field: 'temperature',
        message: 'Temperature must be between 0.0 and 1.0',
        value: body.temperature,
      });
    }
  }

  // Validate force_regenerate (optional)
  if (body.force_regenerate !== undefined && typeof body.force_regenerate !== 'boolean') {
    errors.push({
      field: 'force_regenerate',
      message: 'force_regenerate must be a boolean',
      value: body.force_regenerate,
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body as GenerateAICommand };
}

/**
 * Validates TripsQueryParams
 *
 * @param params - URL query parameters
 * @returns ValidationResult with errors or success
 */
export function validateTripsQueryParams(params: URLSearchParams): ValidationResult {
  const errors: ValidationErrorDetail[] = [];
  const result: Partial<TripsQueryParams> = {};

  // Validate limit
  const limit = params.get('limit');
  if (limit !== null) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum)) {
      errors.push({
        field: 'limit',
        message: 'Limit must be a valid integer',
        value: limit,
      });
    } else if (limitNum < 1 || limitNum > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
        value: limitNum,
      });
    } else {
      result.limit = limitNum;
    }
  }

  // Validate offset
  const offset = params.get('offset');
  if (offset !== null) {
    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum)) {
      errors.push({
        field: 'offset',
        message: 'Offset must be a valid integer',
        value: offset,
      });
    } else if (offsetNum < 0) {
      errors.push({
        field: 'offset',
        message: 'Offset must be greater than or equal to 0',
        value: offsetNum,
      });
    } else {
      result.offset = offsetNum;
    }
  }

  // Validate status
  const status = params.get('status');
  if (status !== null) {
    const validStatuses = ['draft', 'generating', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        value: status,
      });
    } else {
      result.status = status as 'draft' | 'generating' | 'completed' | 'failed';
    }
  }

  // Validate sort
  const sort = params.get('sort');
  if (sort !== null) {
    const validationResult = validateSortParam(sort);
    if (!validationResult.success) {
      errors.push(...validationResult.errors);
    } else {
      result.sort = sort;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: result };
}

/**
 * Validates AILogsQueryParams
 *
 * @param params - URL query parameters
 * @returns ValidationResult with errors or success
 */
export function validateAILogsQueryParams(params: URLSearchParams): ValidationResult {
  const errors: ValidationErrorDetail[] = [];
  const result: Partial<AILogsQueryParams> = {};

  // Validate limit
  const limit = params.get('limit');
  if (limit !== null) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum)) {
      errors.push({
        field: 'limit',
        message: 'Limit must be a valid integer',
        value: limit,
      });
    } else if (limitNum < 1 || limitNum > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
        value: limitNum,
      });
    } else {
      result.limit = limitNum;
    }
  }

  // Validate offset
  const offset = params.get('offset');
  if (offset !== null) {
    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum)) {
      errors.push({
        field: 'offset',
        message: 'Offset must be a valid integer',
        value: offset,
      });
    } else if (offsetNum < 0) {
      errors.push({
        field: 'offset',
        message: 'Offset must be greater than or equal to 0',
        value: offsetNum,
      });
    } else {
      result.offset = offsetNum;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: result };
}

/**
 * Helper: Validates sort parameter format
 *
 * Format: "field:direction" e.g., "created_at:desc"
 * Multiple sorts: "field1:dir1,field2:dir2"
 *
 * @param sort - Sort parameter string
 * @returns ValidationResult
 */
function validateSortParam(sort: string): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  const validFields: TripSortField[] = [
    'created_at',
    'updated_at',
    'start_date',
    'end_date',
    'destination',
    'status',
  ];
  const validDirections = ['asc', 'desc'];

  const sortParts = sort.split(',');

  for (const part of sortParts) {
    const [field, direction] = part.split(':');

    if (!field || !direction) {
      errors.push({
        field: 'sort',
        message: 'Sort format must be "field:direction" (e.g., "created_at:desc")',
        value: part,
      });
      continue;
    }

    if (!validFields.includes(field as TripSortField)) {
      errors.push({
        field: 'sort',
        message: `Invalid sort field. Must be one of: ${validFields.join(', ')}`,
        value: field,
      });
    }

    if (!validDirections.includes(direction)) {
      errors.push({
        field: 'sort',
        message: 'Sort direction must be "asc" or "desc"',
        value: direction,
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: sort };
}

/**
 * Helper: Validates ISO 8601 date format (YYYY-MM-DD)
 *
 * @param dateString - Date string to validate
 * @returns true if valid ISO date, false otherwise
 */
function isValidISODate(dateString: string): boolean {
  // Check format: YYYY-MM-DD
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  // Check if date is actually valid (e.g., not 2025-13-45)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Ensure the date string matches the parsed date
  // (prevents cases like "2025-02-30" being parsed as "2025-03-02")
  const [year, month, day] = dateString.split('-').map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

/**
 * Helper: Validates UUID format
 *
 * @param uuid - UUID string to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
