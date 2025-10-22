/**
 * Services Index
 *
 * Central export point for all service layer functions.
 *
 * @example
 * import { transformRateLimitsToDTO, isRateLimitExceeded } from '../services';
 */

// Rate limit service
export {
  transformRateLimitsToDTO,
  isHourlyLimitExceeded,
  isDailyLimitExceeded,
  isRateLimitExceeded,
  getNextResetTime,
  getExceededLimitType,
  RATE_LIMITS,
} from './rate-limit.service';

// Trip service
export { TripService } from './trip.service';
export type { ServiceResult, ServiceError } from './trip.service';

// OpenRouter service (replaces AIService)
export { OpenRouterService } from './openrouter.service';
export type {
  OpenRouterConfig,
  TripContext,
  OpenRouterResult,
  OpenRouterSuccess,
  OpenRouterError,
  OpenRouterErrorCode,
  ModelInfo,
} from './openrouter.service';

// Legacy AI service (deprecated - use OpenRouterService)
export { AIService } from './ai.service';
export type {
  AIConfig,
  AIGenerationResult,
  AIGenerationError,
  AIServiceResult,
} from './ai.service';
