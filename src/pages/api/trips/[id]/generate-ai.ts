/**
 * API Route: /api/trips/:id/generate-ai
 *
 * Handles AI itinerary generation for a specific trip.
 * Triggers OpenAI/OpenRouter to generate detailed travel plans.
 *
 * @see api-plan.md for API specifications (section 3.6)
 */

import type { APIRoute } from "astro";
import type { GenerateAICommand } from "../../../../types/dto";
import { validateGenerateAICommand, isValidUUID } from "../../../../lib/validation";
import { errorResponse, successResponse } from "../../../../lib/api-helpers";
import { TripService } from "../../../../services/trip.service";
import { OpenRouterService } from "../../../../services/openrouter.service";
import { isRateLimitExceeded, getNextResetTime, getExceededLimitType } from "../../../../services/rate-limit.service";
import { createSupabaseClientWithAuth } from "../../../../db/supabase.client";

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
 * POST /api/trips/:id/generate-ai
 *
 * Triggers AI generation for an existing trip. Updates trip status to 'generating',
 * calls OpenAI/OpenRouter API, and updates trip with AI content.
 *
 * This is a synchronous implementation - the API waits for generation to complete.
 * For async implementation, return 202 Accepted and use background jobs.
 *
 * Request:
 * - Headers: Authorization: Bearer <jwt_token>
 * - Body: GenerateAICommand (all fields optional)
 *
 * Response:
 * - 200 OK: AI generation completed successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Trip doesn't exist or belongs to another user
 * - 409 Conflict: Trip already generating
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: AI service error
 */
export const POST: APIRoute = async ({ params, request }) => {
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

    // 3. Parse request body (if provided)
    let command: GenerateAICommand = {};
    const contentType = request.headers.get("Content-Type");

    if (contentType && contentType.includes("application/json")) {
      try {
        const requestBody = await request.json();
        const validationResult = validateGenerateAICommand(requestBody);

        if (!validationResult.success) {
          return errorResponse(
            "VALIDATION_ERROR",
            "Invalid request data",
            "errors" in validationResult ? validationResult.errors : undefined
          );
        }

        command = "data" in validationResult ? (validationResult.data as GenerateAICommand) : {};
      } catch {
        return errorResponse("INVALID_PARAMS", "Invalid JSON format");
      }
    }

    // 4. Get trip and verify ownership
    const tripService = new TripService(supabase);
    const tripResult = await tripService.getTripById(userId, tripId);

    if (!tripResult.success) {
      const error = "error" in tripResult ? tripResult.error : null;

      if (error?.code === "NOT_FOUND") {
        return errorResponse("NOT_FOUND", "Trip not found");
      }

      return errorResponse("INTERNAL_ERROR", "Failed to retrieve trip");
    }

    const trip = "data" in tripResult ? tripResult.data : null;
    if (!trip) {
      return errorResponse("INTERNAL_ERROR", "Failed to retrieve trip");
    }

    // 5. Check if already generating
    if (trip.status === "generating") {
      return errorResponse("GENERATION_IN_PROGRESS", "AI generation already in progress for this trip", 409);
    }

    // 6. Check if content exists and force_regenerate is false
    if (trip.ai_generated_content && !command.force_regenerate) {
      return errorResponse(
        "INVALID_PARAMS",
        "Trip already has AI-generated content. Use force_regenerate: true to regenerate",
        400
      );
    }

    // 7. Check rate limits
    const { data: rateLimits, error: rateLimitError } = await supabase
      .from("user_rate_limits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (rateLimitError && rateLimitError.code !== "PGRST116") {
      console.error("Error fetching rate limits:", rateLimitError);
      return errorResponse("INTERNAL_ERROR", "Failed to check rate limits");
    }

    // If no rate limit record exists, create one
    if (!rateLimits) {
      const now = new Date();
      await supabase.from("user_rate_limits").insert({
        user_id: userId,
        hourly_generations_count: 0,
        hourly_limit_reset_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        daily_generations_count: 0,
        daily_limit_reset_at: new Date(now.setHours(24, 0, 0, 0)).toISOString(),
      });
    } else {
      // Check if rate limit exceeded
      const isExceeded = isRateLimitExceeded(rateLimits);

      if (isExceeded) {
        const resetTime = getNextResetTime(rateLimits);
        const limitType = getExceededLimitType(rateLimits);
        return errorResponse(
          "RATE_LIMIT_EXCEEDED",
          `You have exceeded your ${limitType} AI generation limit`,
          {
            limit: limitType,
            reset_at: resetTime,
            daily_remaining: limitType === "hourly" ? rateLimits.daily_generations_count : 0,
          },
          429
        );
      }
    }

    // 8. Update trip status to 'generating'
    const { error: updateError } = await supabase
      .from("trips")
      .update({ status: "generating" })
      .eq("id", tripId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating trip status:", updateError);
      return errorResponse("INTERNAL_ERROR", "Failed to start AI generation");
    }

    // 9. Initialize OpenRouter service
    const openrouterApiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!openrouterApiKey) {
      console.error("OPENROUTER_API_KEY not configured");

      // Revert trip status
      await supabase.from("trips").update({ status: trip.status }).eq("id", tripId);

      return errorResponse("INTERNAL_ERROR", "AI service not configured");
    }

    const aiService = new OpenRouterService(openrouterApiKey, {
      model: command.model || "openai/gpt-4o-mini",
      temperature: command.temperature ?? 0.7,
    });

    // 10. Calculate trip duration
    const durationDays = OpenRouterService.calculateDurationDays(trip.start_date, trip.end_date);

    // 11. Generate AI content
    const startTime = Date.now();

    const aiResult = await aiService.generateItinerary({
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      description: trip.description || undefined,
      durationDays,
    });

    // 12. Handle AI generation failure
    if (!aiResult.success) {
      console.error("AI generation failed:", aiResult.error);

      // Special handling for rate limit errors
      if (aiResult.code === "RATE_LIMIT") {
        await supabase
          .from("trips")
          .update({ status: trip.status }) // Revert to previous status
          .eq("id", tripId);

        return new Response(
          JSON.stringify({
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "OpenRouter rate limit exceeded",
              details: {
                retry_after: aiResult.retryAfter,
                provider: "OpenRouter",
              },
            },
          }),
          {
            status: 429,
            headers: {
              "Retry-After": (aiResult.retryAfter || 60).toString(),
              "Content-Type": "application/json",
            },
          }
        );
      }

      // For timeout errors, don't mark as failed - allow retry
      if (aiResult.code === "TIMEOUT") {
        await supabase.from("trips").update({ status: trip.status }).eq("id", tripId);

        return errorResponse(
          "AI_GENERATION_TIMEOUT",
          "AI generation timed out. Please try again.",
          { timeout_ms: 240000 },
          500
        );
      }

      // For all other errors, mark as failed
      await supabase.from("trips").update({ status: "failed" }).eq("id", tripId);

      // Log failure
      await supabase.from("ai_generation_logs").insert({
        user_id: userId,
        trip_id: tripId,
        model: command.model || "openai/gpt-3.5-turbo",
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        generation_time_ms: Date.now() - startTime,
        status: "error",
        error_message: aiResult.error,
        estimated_cost_usd: 0,
      });

      return errorResponse(
        "AI_GENERATION_FAILED",
        "Failed to generate trip plan",
        { reason: aiResult.error, code: aiResult.code },
        500
      );
    }

    // 13. Update trip with AI content
    const { data: updatedTrip, error: finalUpdateError } = await supabase
      .from("trips")
      .update({
        status: "completed",
        ai_generated_content: JSON.parse(JSON.stringify(aiResult.content)),
        ai_model: aiResult.model,
        ai_tokens_used: aiResult.tokensUsed,
        ai_generation_time_ms: aiResult.generationTimeMs,
      })
      .eq("id", tripId)
      .select()
      .single();

    if (finalUpdateError || !updatedTrip) {
      console.error("Error updating trip with AI content:", finalUpdateError);
      return errorResponse("INTERNAL_ERROR", "Failed to save AI-generated content");
    }

    // 14. Update rate limits
    const { data: currentLimits } = await supabase.from("user_rate_limits").select("*").eq("user_id", userId).single();

    if (currentLimits) {
      await supabase
        .from("user_rate_limits")
        .update({
          hourly_generations_count: currentLimits.hourly_generations_count + 1,
          daily_generations_count: currentLimits.daily_generations_count + 1,
        })
        .eq("user_id", userId);
    }

    // 15. Log successful generation
    await supabase.from("ai_generation_logs").insert({
      user_id: userId,
      trip_id: tripId,
      model: aiResult.model,
      prompt_tokens: Math.floor(aiResult.tokensUsed * 0.3), // Estimate
      completion_tokens: Math.floor(aiResult.tokensUsed * 0.7), // Estimate
      total_tokens: aiResult.tokensUsed,
      generation_time_ms: aiResult.generationTimeMs,
      status: "success",
      estimated_cost_usd: aiResult.costUsd, // Accurate cost from OpenRouter
    });

    // 16. Return success response
    return successResponse({
      id: updatedTrip.id,
      status: "completed",
      ai_generated_content: updatedTrip.ai_generated_content,
      ai_model: updatedTrip.ai_model,
      ai_tokens_used: updatedTrip.ai_tokens_used,
      ai_generation_time_ms: updatedTrip.ai_generation_time_ms,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/trips/:id/generate-ai:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred");
  }
};
