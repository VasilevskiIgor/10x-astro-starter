/**
 * useCreateTrip Hook
 *
 * Custom React hook for creating a new trip via API.
 * Handles authentication, API calls, error handling, and retry logic.
 */

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { CreateTripCommand, TripResponseDTO, ErrorResponse } from "@/types/dto";

// ============================================================================
// Type Definitions
// ============================================================================

interface UseCreateTripState {
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string> | null;
  trip: TripResponseDTO | null;
}

interface UseCreateTripReturn extends UseCreateTripState {
  createTrip: (data: CreateTripCommand) => Promise<TripResponseDTO | null>;
  reset: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const API_ENDPOINT = "/api/trips";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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
 * Makes API request to create trip
 */
async function makeCreateTripRequest(
  data: CreateTripCommand,
  accessToken: string,
  retryCount = 0
): Promise<TripResponseDTO> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    // Handle successful response
    if (response.ok) {
      const trip: TripResponseDTO = await response.json();
      return trip;
    }

    // Handle error responses
    const errorData: ErrorResponse = await response.json();

    // Special handling for validation errors
    if (response.status === 400 && errorData.error.code === "VALIDATION_ERROR") {
      throw new ValidationError(errorData.error.message, errorData.error.details as Record<string, string>);
    }

    // Handle other error types
    if (response.status === 401) {
      throw new AuthenticationError("Authentication failed. Please log in again.");
    }

    if (response.status === 403) {
      throw new AuthorizationError(errorData.error.message);
    }

    if (response.status === 429) {
      throw new RateLimitError(errorData.error.message);
    }

    // Generic error
    throw new APIError(errorData.error.message || "Failed to create trip", response.status);
  } catch (error) {
    // Retry on network errors
    if (isRetriableError(error) && retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return makeCreateTripRequest(data, accessToken, retryCount + 1);
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

class ValidationError extends Error {
  constructor(
    message: string,
    public details: Record<string, string>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
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

export function useCreateTrip(): UseCreateTripReturn {
  const [state, setState] = React.useState<UseCreateTripState>({
    isLoading: false,
    error: null,
    validationErrors: null,
    trip: null,
  });

  const createTrip = React.useCallback(async (data: CreateTripCommand): Promise<TripResponseDTO | null> => {
    console.log("[useCreateTrip] Starting createTrip with data:", data);

    // Reset state
    setState({
      isLoading: true,
      error: null,
      validationErrors: null,
      trip: null,
    });

    try {
      // Get access token
      console.log("[useCreateTrip] Getting access token...");
      const accessToken = await getAccessToken();
      console.log("[useCreateTrip] Access token retrieved:", accessToken ? "YES" : "NO");

      if (!accessToken) {
        throw new AuthenticationError("You must be logged in to create a trip");
      }

      // Make API request
      console.log("[useCreateTrip] Making API request...");
      const trip = await makeCreateTripRequest(data, accessToken);
      console.log("[useCreateTrip] API request successful:", trip);

      // Update state with success
      setState({
        isLoading: false,
        error: null,
        validationErrors: null,
        trip,
      });

      return trip;
    } catch (error) {
      console.log("[useCreateTrip] Error caught:", error);

      // Handle validation errors
      if (error instanceof ValidationError) {
        console.log("[useCreateTrip] Validation error:", error.details);
        setState({
          isLoading: false,
          error: error.message,
          validationErrors: error.details,
          trip: null,
        });
        return null;
      }

      // Handle authentication errors
      if (error instanceof AuthenticationError) {
        console.log("[useCreateTrip] Authentication error");
        setState({
          isLoading: false,
          error: error.message,
          validationErrors: null,
          trip: null,
        });
        return null;
      }

      // Handle authorization errors
      if (error instanceof AuthorizationError) {
        setState({
          isLoading: false,
          error: error.message,
          validationErrors: null,
          trip: null,
        });
        return null;
      }

      // Handle rate limit errors
      if (error instanceof RateLimitError) {
        setState({
          isLoading: false,
          error: error.message,
          validationErrors: null,
          trip: null,
        });
        return null;
      }

      // Handle API errors
      if (error instanceof APIError) {
        setState({
          isLoading: false,
          error: error.message,
          validationErrors: null,
          trip: null,
        });
        return null;
      }

      // Handle network errors
      if (isRetriableError(error)) {
        setState({
          isLoading: false,
          error: "Network error. Please check your connection and try again.",
          validationErrors: null,
          trip: null,
        });
        return null;
      }

      // Handle unknown errors
      console.error("Unexpected error creating trip:", error);
      setState({
        isLoading: false,
        error: "An unexpected error occurred. Please try again.",
        validationErrors: null,
        trip: null,
      });
      return null;
    }
  }, []);

  const reset = React.useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      validationErrors: null,
      trip: null,
    });
  }, []);

  return {
    ...state,
    createTrip,
    reset,
  };
}
