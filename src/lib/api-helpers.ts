/**
 * API Helper Functions
 *
 * Common utilities for API endpoint handlers, including error responses,
 * success responses, and authentication helpers.
 *
 * @see dto.ts for response type definitions
 * @see api-plan.md for API response standards
 */

import type { ErrorResponse, ErrorCode } from '../types/dto';

/**
 * Creates a standardized error response
 *
 * @param code - Error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param details - Optional additional error context
 * @returns ErrorResponse object
 *
 * @example
 * return new Response(
 *   JSON.stringify(createErrorResponse('NOT_FOUND', 'Trip not found')),
 *   { status: 404, headers: { 'Content-Type': 'application/json' } }
 * );
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Maps error codes to HTTP status codes
 */
const errorCodeToStatusMap: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  INVALID_TOKEN: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INVALID_PARAMS: 400,
  TRIP_LIMIT_EXCEEDED: 403,
  RATE_LIMIT_EXCEEDED: 429,
  GENERATION_IN_PROGRESS: 409,
  AI_GENERATION_FAILED: 500,
  AI_GENERATION_TIMEOUT: 500,
  INTERNAL_ERROR: 500,
};

/**
 * Gets HTTP status code for an error code
 *
 * @param code - Error code
 * @returns HTTP status code
 */
export function getStatusForErrorCode(code: ErrorCode): number {
  return errorCodeToStatusMap[code] || 500;
}

/**
 * Creates a JSON Response with error
 *
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 * @returns Response object
 *
 * @example
 * return errorResponse('UNAUTHORIZED', 'Authentication required');
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): Response {
  const status = getStatusForErrorCode(code);
  const body = createErrorResponse(code, message, details);

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Creates a JSON Response with success data
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns Response object
 *
 * @example
 * return successResponse(tripDTO, 201);
 */
export function successResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Creates a 204 No Content Response
 *
 * @returns Response object
 *
 * @example
 * // For DELETE endpoints
 * return noContentResponse();
 */
export function noContentResponse(): Response {
  return new Response(null, {
    status: 204,
  });
}

/**
 * Extracts user ID from Supabase session
 *
 * @param request - Request object
 * @returns User ID or null if not authenticated
 *
 * @example
 * const userId = await getUserIdFromRequest(request);
 * if (!userId) {
 *   return errorResponse('UNAUTHORIZED', 'Authentication required');
 * }
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  // This is a placeholder - actual implementation depends on your auth setup
  // In Astro with Supabase, you would typically:
  // 1. Get session from cookies or headers
  // 2. Validate JWT token
  // 3. Extract user_id from token
  //
  // Example with Supabase:
  // const authHeader = request.headers.get('Authorization');
  // if (!authHeader) return null;
  // const token = authHeader.replace('Bearer ', '');
  // const { data, error } = await supabase.auth.getUser(token);
  // return data?.user?.id || null;

  // For now, return null - implement based on your auth strategy
  return null;
}

/**
 * Parses JSON request body with error handling
 *
 * @param request - Request object
 * @returns Parsed JSON data or error response
 *
 * @example
 * const result = await parseRequestBody(request);
 * if (result instanceof Response) {
 *   return result; // Error response
 * }
 * // Use result as parsed data
 */
export async function parseRequestBody(request: Request): Promise<unknown | Response> {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid JSON in request body',
      { details: 'Request body must be valid JSON' }
    );
  }
}

/**
 * CORS headers for API responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Configure for your domain in production
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Handles OPTIONS requests for CORS preflight
 *
 * @returns Response with CORS headers
 */
export function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
