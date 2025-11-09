/**
 * useGenerateAI Hook
 *
 * Custom React hook for triggering AI generation for a trip.
 * Handles authentication, API calls, error handling, and retry logic.
 */

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { GenerateAICommand } from "@/types/dto";

// ============================================================================
// Type Definitions
// ============================================================================

interface GeneratedContent {
  id: string;
  status: string;
  ai_generated_content: unknown;
  ai_model: string | null;
  ai_tokens_used: number | null;
  ai_generation_time_ms: number | null;
}

interface UseGenerateAIState {
  isGenerating: boolean;
  error: string | null;
  generatedContent: GeneratedContent | null;
}

interface UseGenerateAIReturn extends UseGenerateAIState {
  generateAI: (tripId: string, command?: GenerateAICommand) => Promise<boolean>;
  reset: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current user's access token from Supabase session
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabaseBrowser.auth.getSession();

    if (error) {
      console.error("Failed to get session:", error);
      return null;
    }

    return session?.access_token ?? null;
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
}

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if error is a network error that should be retried
 */
function isRetriableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true; // Network error
  }
  return false;
}

/**
 * Makes API request to generate AI content
 */
async function makeGenerateAIRequest(
  tripId: string,
  command: GenerateAICommand | undefined,
  accessToken: string,
  retryCount = 0
): Promise<GeneratedContent> {
  try {
    const endpoint = `/api/trips/${tripId}/generate-ai`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: command ? JSON.stringify(command) : JSON.stringify({}),
    });

    // Handle successful response
    if (response.ok) {
      const result = await response.json();
      return result;
    }

    // Handle error responses
    const errorData = await response.json();

    // Handle specific error types
    if (response.status === 401) {
      throw new AuthenticationError("Authentication failed. Please log in again.");
    }

    if (response.status === 404) {
      throw new NotFoundError("Trip not found");
    }

    if (response.status === 409) {
      throw new ConflictError("AI generation already in progress");
    }

    if (response.status === 429) {
      throw new RateLimitError(errorData.error.message);
    }

    // Generic error
    throw new APIError(errorData.error?.message || "Failed to generate AI content", response.status);
  } catch (error) {
    // Retry on network errors
    if (isRetriableError(error) && retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return makeGenerateAIRequest(tripId, command, accessToken, retryCount + 1);
    }

    throw error;
  }
}

// ============================================================================
// Custom Error Classes
// ============================================================================

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "APIError";
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGenerateAI(): UseGenerateAIReturn {
  const [state, setState] = React.useState<UseGenerateAIState>({
    isGenerating: false,
    error: null,
    generatedContent: null,
  });

  const generateAI = React.useCallback(
    async (tripId: string, command?: GenerateAICommand): Promise<boolean> => {
      console.log("[useGenerateAI] Starting AI generation for trip:", tripId);

      // Reset state
      setState({
        isGenerating: true,
        error: null,
        generatedContent: null,
      });

      try {
        // Get access token
        console.log("[useGenerateAI] Getting access token...");
        const accessToken = await getAccessToken();
        console.log("[useGenerateAI] Access token retrieved:", accessToken ? "YES" : "NO");

        if (!accessToken) {
          throw new AuthenticationError("You must be logged in to generate AI content");
        }

        // Make API request
        console.log("[useGenerateAI] Making API request...");
        const result = await makeGenerateAIRequest(tripId, command, accessToken);
        console.log("[useGenerateAI] API request successful:", result);

        // Update state with success
        setState({
          isGenerating: false,
          error: null,
          generatedContent: result,
        });

        return true;
      } catch (error) {
        console.log("[useGenerateAI] Error caught:", error);

        // Handle authentication errors
        if (error instanceof AuthenticationError) {
          console.log("[useGenerateAI] Authentication error");
          setState({
            isGenerating: false,
            error: error.message,
            generatedContent: null,
          });
          return false;
        }

        // Handle not found errors
        if (error instanceof NotFoundError) {
          setState({
            isGenerating: false,
            error: error.message,
            generatedContent: null,
          });
          return false;
        }

        // Handle conflict errors (already generating)
        if (error instanceof ConflictError) {
          setState({
            isGenerating: false,
            error: error.message,
            generatedContent: null,
          });
          return false;
        }

        // Handle rate limit errors
        if (error instanceof RateLimitError) {
          setState({
            isGenerating: false,
            error: error.message,
            generatedContent: null,
          });
          return false;
        }

        // Handle API errors
        if (error instanceof APIError) {
          setState({
            isGenerating: false,
            error: error.message,
            generatedContent: null,
          });
          return false;
        }

        // Handle network errors
        if (isRetriableError(error)) {
          setState({
            isGenerating: false,
            error: "Network error. Please check your connection and try again.",
            generatedContent: null,
          });
          return false;
        }

        // Handle unknown errors
        console.error("Unexpected error generating AI content:", error);
        setState({
          isGenerating: false,
          error: "An unexpected error occurred. Please try again.",
          generatedContent: null,
        });
        return false;
      }
    },
    []
  );

  const reset = React.useCallback(() => {
    setState({
      isGenerating: false,
      error: null,
      generatedContent: null,
    });
  }, []);

  return {
    ...state,
    generateAI,
    reset,
  };
}
