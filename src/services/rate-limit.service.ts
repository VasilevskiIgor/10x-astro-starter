/**
 * Rate Limit Service
 *
 * Handles transformation of rate limit data from database format to API DTO format.
 *
 * @see dto.ts for RateLimitsDTO type definition
 * @see api-plan.md section 4.1 for API response format
 */

import type { Tables } from '../db/database.types';
import type { RateLimitsDTO } from '../types/dto';

/**
 * Rate limit configuration constants
 * These values define the maximum number of AI generations allowed per time window.
 *
 * For production, these could be moved to environment variables or database configuration.
 */
export const RATE_LIMITS = {
  HOURLY_LIMIT: 5,
  DAILY_LIMIT: 10,
} as const;

/**
 * Transforms database rate limit row to API DTO format
 *
 * Converts flat database structure with separate hourly/daily fields
 * into nested DTO structure with window objects.
 *
 * @param dbRow - Rate limit data from user_rate_limits table
 * @returns Transformed rate limits DTO with nested hourly/daily windows
 *
 * @example
 * const dbRow = {
 *   user_id: 'uuid',
 *   hourly_generations_count: 2,
 *   hourly_limit_reset_at: '2025-01-15T13:00:00Z',
 *   daily_generations_count: 5,
 *   daily_limit_reset_at: '2025-01-16T00:00:00Z',
 *   updated_at: '2025-01-15T12:30:00Z'
 * };
 *
 * const dto = transformRateLimitsToDTO(dbRow);
 * // Returns:
 * // {
 * //   user_id: 'uuid',
 * //   hourly: { limit: 5, used: 2, remaining: 3, reset_at: '2025-01-15T13:00:00Z' },
 * //   daily: { limit: 10, used: 5, remaining: 5, reset_at: '2025-01-16T00:00:00Z' },
 * //   updated_at: '2025-01-15T12:30:00Z'
 * // }
 */
export function transformRateLimitsToDTO(
  dbRow: Tables<'user_rate_limits'>
): RateLimitsDTO {
  return {
    user_id: dbRow.user_id,
    hourly: {
      limit: RATE_LIMITS.HOURLY_LIMIT,
      used: dbRow.hourly_generations_count,
      remaining: Math.max(0, RATE_LIMITS.HOURLY_LIMIT - dbRow.hourly_generations_count),
      reset_at: dbRow.hourly_limit_reset_at,
    },
    daily: {
      limit: RATE_LIMITS.DAILY_LIMIT,
      used: dbRow.daily_generations_count,
      remaining: Math.max(0, RATE_LIMITS.DAILY_LIMIT - dbRow.daily_generations_count),
      reset_at: dbRow.daily_limit_reset_at,
    },
    updated_at: dbRow.updated_at,
  };
}

/**
 * Checks if user has exceeded hourly rate limit
 *
 * @param dbRow - Rate limit data from user_rate_limits table
 * @returns true if hourly limit is exceeded, false otherwise
 */
export function isHourlyLimitExceeded(dbRow: Tables<'user_rate_limits'>): boolean {
  return dbRow.hourly_generations_count >= RATE_LIMITS.HOURLY_LIMIT;
}

/**
 * Checks if user has exceeded daily rate limit
 *
 * @param dbRow - Rate limit data from user_rate_limits table
 * @returns true if daily limit is exceeded, false otherwise
 */
export function isDailyLimitExceeded(dbRow: Tables<'user_rate_limits'>): boolean {
  return dbRow.daily_generations_count >= RATE_LIMITS.DAILY_LIMIT;
}

/**
 * Checks if user has exceeded any rate limit (hourly or daily)
 *
 * @param dbRow - Rate limit data from user_rate_limits table
 * @returns true if any limit is exceeded, false otherwise
 */
export function isRateLimitExceeded(dbRow: Tables<'user_rate_limits'>): boolean {
  return isHourlyLimitExceeded(dbRow) || isDailyLimitExceeded(dbRow);
}

/**
 * Gets the next reset time for rate limits
 * Returns the earliest reset time (hourly or daily)
 *
 * @param dbRow - Rate limit data from user_rate_limits table
 * @returns ISO 8601 timestamp of next reset
 */
export function getNextResetTime(dbRow: Tables<'user_rate_limits'>): string {
  const hourlyReset = new Date(dbRow.hourly_limit_reset_at).getTime();
  const dailyReset = new Date(dbRow.daily_limit_reset_at).getTime();

  return hourlyReset < dailyReset
    ? dbRow.hourly_limit_reset_at
    : dbRow.daily_limit_reset_at;
}

/**
 * Determines which limit was exceeded (for error messages)
 *
 * @param dbRow - Rate limit data from user_rate_limits table
 * @returns 'hourly' | 'daily' | 'both' | null
 */
export function getExceededLimitType(
  dbRow: Tables<'user_rate_limits'>
): 'hourly' | 'daily' | 'both' | null {
  const hourlyExceeded = isHourlyLimitExceeded(dbRow);
  const dailyExceeded = isDailyLimitExceeded(dbRow);

  if (hourlyExceeded && dailyExceeded) return 'both';
  if (hourlyExceeded) return 'hourly';
  if (dailyExceeded) return 'daily';
  return null;
}
