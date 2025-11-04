/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 *
 * This file contains all type definitions for API requests and responses.
 * All types are derived from the database schema types to ensure consistency.
 *
 * @see database.types.ts for base database types
 * @see api-plan.md for API endpoint specifications
 */

import type { Tables } from "../db/database.types";

// ============================================================================
// AI Generated Content Structure
// ============================================================================

/**
 * Structure for a single activity within a day
 * This is the nested structure stored in trips.ai_generated_content JSONB field
 */
export interface ActivityDetail {
  time: string; // Format: "HH:MM"
  title: string;
  description: string;
  location: string;
  duration_minutes: number;
  cost_estimate: string; // e.g., "$", "$$", "$$$"
  tips: string;
}

/**
 * Structure for a single day in the itinerary
 * This is the nested structure stored in trips.ai_generated_content JSONB field
 */
export interface DayDetail {
  day_number: number;
  date: string; // ISO 8601 date format
  title: string;
  summary?: string;
  activities: ActivityDetail[];
}

/**
 * General recommendations for the trip
 * This is the nested structure stored in trips.ai_generated_content JSONB field
 */
export interface TripRecommendations {
  transportation: string;
  accommodation: string;
  budget: string;
  best_time: string;
}

/**
 * Complete AI-generated content structure
 * Maps to the trips.ai_generated_content JSONB field
 */
export interface AIGeneratedContent {
  summary: string;
  days: DayDetail[];
  recommendations: TripRecommendations;
}

// ============================================================================
// Trip DTOs
// ============================================================================

/**
 * Trip entity from database with typed AI content
 * Base type for all trip-related DTOs
 */
type TripEntity = Omit<Tables<"trips">, "ai_generated_content" | "deleted_at"> & {
  ai_generated_content: AIGeneratedContent | null;
};

/**
 * Trip List Item DTO
 * Used in GET /api/trips response
 * Excludes AI-generated content for performance (large JSONB field)
 */
export type TripListItemDTO = Omit<TripEntity, "ai_generated_content">;

/**
 * Trip Detail DTO
 * Used in GET /api/trips/:id response
 * Includes full AI-generated content
 */
export type TripDetailDTO = TripEntity;

/**
 * Trip created/updated response DTO
 * Used in POST /api/trips and PATCH /api/trips/:id responses
 * May or may not include AI content depending on generation status
 */
export type TripResponseDTO = TripEntity;

// ============================================================================
// Trip Command Models (Requests)
// ============================================================================

/**
 * Create Trip Command
 * Used in POST /api/trips request body
 *
 * Validation rules:
 * - destination: required, max 200 chars
 * - start_date: required, valid ISO date
 * - end_date: required, valid ISO date, >= start_date, <= start_date + 365 days
 * - description: optional, max 2000 chars
 * - generate_ai: optional, default false
 */
export interface CreateTripCommand {
  destination: string;
  start_date: string; // ISO 8601 date format
  end_date: string; // ISO 8601 date format
  description?: string;
  generate_ai?: boolean;
}

/**
 * Update Trip Command
 * Used in PATCH /api/trips/:id request body
 * All fields are optional
 *
 * Note: Cannot update ai_generated_content directly - use generate-ai endpoint
 */
export interface UpdateTripCommand {
  destination?: string;
  start_date?: string; // ISO 8601 date format
  end_date?: string; // ISO 8601 date format
  description?: string;
}

/**
 * Generate AI Itinerary Command
 * Used in POST /api/trips/:id/generate-ai request body
 * All fields are optional with defaults
 */
export interface GenerateAICommand {
  model?: string; // Default: "gpt-3.5-turbo"
  temperature?: number; // Default: 0.7, range: 0.0-1.0
  force_regenerate?: boolean; // Default: false
}

// ============================================================================
// Rate Limit DTOs
// ============================================================================

/**
 * Rate limit details for a specific time window
 */
export interface RateLimitWindow {
  limit: number;
  used: number;
  remaining: number;
  reset_at: string; // ISO 8601 timestamp
}

/**
 * User Rate Limits Response DTO
 * Used in GET /api/users/me/rate-limits response
 *
 * Transforms flat user_rate_limits table into nested structure
 */
export interface RateLimitsDTO {
  user_id: string;
  hourly: RateLimitWindow;
  daily: RateLimitWindow;
  updated_at: string;
}

// ============================================================================
// AI Generation Log DTOs
// ============================================================================

/**
 * AI Generation Log Response DTO
 * Used in GET /api/users/me/ai-logs response
 * Excludes input_data and response_data for privacy/size reasons
 */
export type AIGenerationLogDTO = Omit<
  Tables<"ai_generation_logs">,
  "input_data" | "response_data" | "error_message"
> & {
  // Include error_message but make it optional in response
  error_message?: string | null;
};

// ============================================================================
// Pagination DTOs
// ============================================================================

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  next_cursor?: string; // Optional for cursor-based pagination (future)
}

/**
 * Generic paginated response wrapper
 * Used for all list endpoints
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Paginated trips list response
 * Used in GET /api/trips response
 */
export type PaginatedTripsResponse = PaginatedResponse<TripListItemDTO>;

/**
 * Paginated AI logs response
 * Used in GET /api/users/me/ai-logs response
 */
export type PaginatedAILogsResponse = PaginatedResponse<AIGenerationLogDTO>;

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for GET /api/trips
 */
export interface TripsQueryParams {
  limit?: number; // 1-100, default 20
  offset?: number; // default 0
  status?: "draft" | "generating" | "completed" | "failed";
  sort?: string; // Format: "field:direction" e.g., "created_at:desc"
}

/**
 * Query parameters for GET /api/users/me/ai-logs
 */
export interface AILogsQueryParams {
  limit?: number; // 1-100, default 20
  offset?: number; // default 0
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Standard error response structure
 * Used in all error responses (4xx, 5xx)
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[] | Record<string, unknown>;
  };
}

/**
 * Standard error codes
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_TOKEN"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_PARAMS"
  | "TRIP_LIMIT_EXCEEDED"
  | "RATE_LIMIT_EXCEEDED"
  | "GENERATION_IN_PROGRESS"
  | "AI_GENERATION_FAILED"
  | "AI_GENERATION_TIMEOUT"
  | "INTERNAL_ERROR";

// ============================================================================
// Special Response DTOs
// ============================================================================

/**
 * Health check response
 * Used in GET /api/health response
 */
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  services: {
    database: "healthy" | "unhealthy";
    auth: "healthy" | "unhealthy";
    ai: "healthy" | "unhealthy";
  };
}

/**
 * AI Generation Started Response (Async)
 * Used in POST /api/trips/:id/generate-ai when returning 202 Accepted
 */
export interface AIGenerationStartedResponse {
  id: string;
  status: "generating";
  message: string;
  estimated_completion: string; // ISO 8601 timestamp
}

/**
 * AI Generation Completed Response (Sync)
 * Used in POST /api/trips/:id/generate-ai when returning 200 OK
 */
export interface AIGenerationCompletedResponse {
  id: string;
  status: "completed";
  ai_generated_content: AIGeneratedContent;
  ai_model: string;
  ai_tokens_used: number | null;
  ai_generation_time_ms: number | null;
}

/**
 * Union type for AI generation responses
 */
export type AIGenerationResponse = AIGenerationStartedResponse | AIGenerationCompletedResponse;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if AI generation response is completed
 */
export function isAIGenerationCompleted(response: AIGenerationResponse): response is AIGenerationCompletedResponse {
  return response.status === "completed";
}

/**
 * Type guard to check if AI generation response is started (async)
 */
export function isAIGenerationStarted(response: AIGenerationResponse): response is AIGenerationStartedResponse {
  return response.status === "generating";
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract trip status type from database enum
 */
export type TripStatus = NonNullable<Tables<"trips">["status"]>;

/**
 * Extract AI generation log status type from database
 */
export type AIGenerationStatus = Tables<"ai_generation_logs">["status"];

/**
 * Sorting direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort field options for trips
 */
export type TripSortField = "created_at" | "updated_at" | "start_date" | "end_date" | "destination" | "status";
