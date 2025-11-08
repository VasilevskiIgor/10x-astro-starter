/**
 * Test endpoint for OpenRouter API
 *
 * Usage: GET /api/test-openrouter
 *
 * This endpoint tests direct communication with OpenRouter to diagnose:
 * - Connection speed
 * - Response time
 * - Token usage
 * - Any rate limiting issues
 */

import type { APIRoute } from "astro";
import { OpenRouterService } from "../../services/openrouter.service";

export const GET: APIRoute = async () => {
  const startTime = Date.now();

  try {
    console.log("[TestOpenRouter] Starting test at:", new Date().toISOString());

    // Check for API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OPENROUTER_API_KEY not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service with test configuration
    const service = new OpenRouterService(apiKey, {
      model: "openai/gpt-4o-mini",
      temperature: 0.7,
      timeout: 240000, // 4 minutes
    });

    console.log("[TestOpenRouter] Calling OpenRouter API for 3-day Berlin trip...");

    // Test with a simple 3-day trip
    const result = await service.generateItinerary({
      destination: "Berlin, Germany",
      startDate: "2025-06-01",
      endDate: "2025-06-03",
      description: "Culture, museums, food",
      durationDays: 3,
    });

    const totalTime = Date.now() - startTime;

    if (!result.success) {
      console.error("[TestOpenRouter] Generation failed:", result);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          code: result.code,
          retryAfter: result.retryAfter,
          totalTimeMs: totalTime,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[TestOpenRouter] Generation successful!");
    console.log(`[TestOpenRouter] Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`[TestOpenRouter] Tokens used: ${result.tokensUsed}`);
    console.log(`[TestOpenRouter] Model: ${result.model}`);
    console.log(`[TestOpenRouter] Cost: $${result.costUsd}`);

    // Return detailed metrics
    return new Response(
      JSON.stringify({
        success: true,
        metrics: {
          totalTimeMs: totalTime,
          totalTimeSec: (totalTime / 1000).toFixed(2),
          generationTimeMs: result.generationTimeMs,
          tokensUsed: result.tokensUsed,
          model: result.model,
          costUsd: result.costUsd,
        },
        testConfig: {
          destination: "Berlin, Germany",
          days: 3,
          timeout: "240000ms (4 min)",
        },
        summary: {
          daysGenerated: result.content?.days?.length || 0,
          activitiesCount:
            result.content?.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0,
        },
        // Include a sample of the generated content
        contentSample: {
          summary: result.content?.summary?.substring(0, 200) + "...",
          firstDay: result.content?.days?.[0] || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[TestOpenRouter] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        totalTimeMs: totalTime,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
