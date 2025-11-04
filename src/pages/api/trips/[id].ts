/**
 * API Route: /api/trips/:id
 *
 * Handles individual trip operations (GET, PATCH, DELETE).
 *
 * @see api-plan.md for API specifications
 */

import type { APIRoute } from "astro";
import type { UpdateTripCommand } from "../../../types/dto";
import { validateUpdateTripCommand, isValidUUID } from "../../../lib/validation";
import { errorResponse, successResponse, noContentResponse } from "../../../lib/api-helpers";
import { TripService } from "../../../services/trip.service";
import { createSupabaseClientWithAuth } from "../../../db/supabase.client";

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
 * GET /api/trips/:id
 *
 * Retrieves full details of a specific trip including AI-generated content.
 * Updates view_count and last_viewed_at.
 *
 * Response:
 * - 200 OK: Trip details with AI content
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Trip doesn't exist or belongs to another user
 * - 500 Internal Server Error: Server error
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // 1. Validate trip ID
    const tripId = params.id;
    if (!tripId || !isValidUUID(tripId)) {
      return errorResponse("INVALID_PARAMS", "Invalid trip ID");
    }

    // 2. Authenticate request
    const auth = await authenticateRequest(request);
    if ("error" in auth) {
      return auth.error;
    }
    const { supabase, userId } = auth;

    // 3. Get trip from service
    const tripService = new TripService(supabase);
    const result = await tripService.getTripById(userId, tripId);

    // 4. Handle service errors
    if (!result.success) {
      const error = "error" in result ? result.error : null;

      if (error?.code === "NOT_FOUND") {
        return errorResponse("NOT_FOUND", "Trip not found");
      }

      return errorResponse("INTERNAL_ERROR", "Failed to retrieve trip");
    }

    // 5. Return success response
    const trip = "data" in result ? result.data : null;
    if (!trip) {
      return errorResponse("INTERNAL_ERROR", "Failed to retrieve trip");
    }
    return successResponse(trip);
  } catch (error) {
    console.error("Unexpected error in GET /api/trips/:id:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred");
  }
};

/**
 * PATCH /api/trips/:id
 *
 * Updates basic trip information.
 * Cannot update AI-generated content (use generate-ai endpoint instead).
 *
 * Request:
 * - Headers: Authorization: Bearer <jwt_token>
 * - Body: UpdateTripCommand (all fields optional)
 *
 * Response:
 * - 200 OK: Trip updated successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Trip doesn't exist or belongs to another user
 * - 500 Internal Server Error: Server error
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    // 1. Validate trip ID
    const tripId = params.id;
    if (!tripId || !isValidUUID(tripId)) {
      return errorResponse("INVALID_PARAMS", "Invalid trip ID");
    }

    // 2. Verify Content-Type header
    const contentType = request.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return errorResponse("INVALID_PARAMS", "Content-Type must be application/json");
    }

    // 3. Authenticate request
    const auth = await authenticateRequest(request);
    if ("error" in auth) {
      return auth.error;
    }
    const { supabase, userId } = auth;

    // 4. Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return errorResponse("INVALID_PARAMS", "Invalid JSON format");
    }

    // 5. Validate request data
    const validationResult = validateUpdateTripCommand(requestBody);
    if (!validationResult.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid request data",
        "errors" in validationResult ? validationResult.errors : undefined
      );
    }

    const command = "data" in validationResult ? (validationResult.data as UpdateTripCommand) : {};

    // 6. Update trip using TripService
    const tripService = new TripService(supabase);
    const result = await tripService.updateTrip(userId, tripId, command);

    // 7. Handle service errors
    if (!result.success) {
      const error = "error" in result ? result.error : null;

      if (error?.code === "NOT_FOUND") {
        return errorResponse("NOT_FOUND", "Trip not found");
      }

      return errorResponse("INTERNAL_ERROR", "Failed to update trip");
    }

    // 8. Return success response
    const trip = "data" in result ? result.data : null;
    if (!trip) {
      return errorResponse("INTERNAL_ERROR", "Failed to update trip");
    }
    return successResponse(trip);
  } catch (error) {
    console.error("Unexpected error in PATCH /api/trips/:id:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred");
  }
};

/**
 * DELETE /api/trips/:id
 *
 * Soft deletes a trip (sets deleted_at timestamp).
 *
 * Response:
 * - 204 No Content: Trip deleted successfully
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Trip doesn't exist or belongs to another user
 * - 500 Internal Server Error: Server error
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    // 1. Validate trip ID
    const tripId = params.id;
    if (!tripId || !isValidUUID(tripId)) {
      return errorResponse("INVALID_PARAMS", "Invalid trip ID");
    }

    // 2. Authenticate request
    const auth = await authenticateRequest(request);
    if ("error" in auth) {
      return auth.error;
    }
    const { supabase, userId } = auth;

    // 3. Delete trip using TripService
    const tripService = new TripService(supabase);
    const result = await tripService.deleteTrip(userId, tripId);

    // 4. Handle service errors
    if (!result.success) {
      const error = "error" in result ? result.error : null;

      if (error?.code === "NOT_FOUND") {
        return errorResponse("NOT_FOUND", "Trip not found");
      }

      return errorResponse("INTERNAL_ERROR", "Failed to delete trip");
    }

    // 5. Return 204 No Content
    return noContentResponse();
  } catch (error) {
    console.error("Unexpected error in DELETE /api/trips/:id:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred");
  }
};
