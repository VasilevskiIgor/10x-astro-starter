/**
 * API Route: /api/trips
 *
 * Handles trip-related operations for authenticated users.
 *
 * @see view-implementation-plan.md for full implementation details
 * @see api-plan.md for API specifications
 */

import type { APIRoute } from "astro";
import type { CreateTripCommand, TripsQueryParams } from "../../types/dto";
import { validateCreateTripCommand, validateTripsQueryParams } from "../../lib/validation";
import { errorResponse, successResponse } from "../../lib/api-helpers";
import { TripService } from "../../services/trip.service";
import { createSupabaseClientWithAuth } from "../../db/supabase.client";

/**
 * Helper function to extract and validate JWT token
 */
async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: errorResponse("UNAUTHORIZED", "Authentication required") };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createSupabaseClientWithAuth(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: errorResponse("INVALID_TOKEN", "Invalid or expired authentication token"),
    };
  }

  return { supabase, userId: user.id };
}

/**
 * GET /api/trips
 *
 * Retrieves paginated list of authenticated user's trips.
 *
 * Query Parameters:
 * - limit: Number of trips per page (1-100, default 20)
 * - offset: Number of trips to skip (default 0)
 * - status: Filter by status ('draft', 'generating', 'completed', 'failed')
 * - sort: Sort field and direction (e.g., 'created_at:desc')
 *
 * Response:
 * - 200 OK: List of trips with pagination
 * - 401 Unauthorized: Missing or invalid authentication
 * - 400 Bad Request: Invalid query parameters
 * - 500 Internal Server Error: Server error
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Authenticate request
    const auth = await authenticateRequest(request);
    if ("error" in auth) {
      return auth.error;
    }
    const { supabase, userId } = auth;

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const validationResult = validateTripsQueryParams(url.searchParams);

    if (!validationResult.success) {
      return errorResponse(
        "INVALID_PARAMS",
        "Invalid query parameters",
        "errors" in validationResult ? validationResult.errors : undefined
      );
    }

    const queryParams = "data" in validationResult ? (validationResult.data as TripsQueryParams) : {};

    // 3. Get trips from service
    const tripService = new TripService(supabase);
    const result = await tripService.listTrips(userId, queryParams);

    // 4. Handle service errors
    if (!result.success) {
      return errorResponse("INTERNAL_ERROR", "Failed to retrieve trips");
    }

    // 5. Return success response
    const trips =
      "data" in result ? result.data : { data: [], pagination: { total: 0, limit: 20, offset: 0, has_more: false } };
    return successResponse(trips);
  } catch (error) {
    console.error("Unexpected error in GET /api/trips:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred");
  }
};

/**
 * POST /api/trips
 *
 * Creates a new trip for the authenticated user.
 *
 * Request:
 * - Headers: Authorization: Bearer <jwt_token>
 * - Body: CreateTripCommand
 *
 * Response:
 * - 201 Created: Trip created successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: Trip limit exceeded
 * - 500 Internal Server Error: Server error
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Verify Content-Type header
    const contentType = request.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return errorResponse("INVALID_PARAMS", "Content-Type must be application/json");
    }

    // 2. Authenticate request
    const auth = await authenticateRequest(request);
    if ("error" in auth) {
      return auth.error;
    }
    const { supabase, userId } = auth;

    // 5. Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return errorResponse("INVALID_PARAMS", "Invalid JSON format");
    }

    // 6. Validate request data
    const validationResult = validateCreateTripCommand(requestBody);
    if (!validationResult.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid request data",
        "errors" in validationResult ? validationResult.errors : undefined
      );
    }

    const command =
      "data" in validationResult ? (validationResult.data as CreateTripCommand) : ({} as CreateTripCommand);

    // 7. Create trip using TripService
    const tripService = new TripService(supabase);
    const result = await tripService.createTrip(userId, command);

    // 8. Handle service errors
    if (!result.success) {
      const error = "error" in result ? result.error : null;

      // Map service error codes to API error codes
      if (error && error.code === "TRIP_LIMIT_EXCEEDED") {
        return errorResponse("TRIP_LIMIT_EXCEEDED", "You have reached the maximum limit of 100 trips");
      }

      // Generic database/internal error
      return errorResponse("INTERNAL_ERROR", "Failed to create trip");
    }

    // 9. Return success response with 201 Created
    const trip = "data" in result ? result.data : null;
    if (!trip) {
      return errorResponse("INTERNAL_ERROR", "Failed to create trip");
    }
    return new Response(JSON.stringify(trip), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/trips/${trip.id}`,
      },
    });
  } catch (error) {
    // Log unexpected errors
    console.error("Unexpected error in POST /api/trips:", error);

    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred");
  }
};
