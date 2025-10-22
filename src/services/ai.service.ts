/**
 * AI Service
 *
 * Handles communication with OpenAI API for generating trip itineraries.
 * Supports both direct OpenAI API and OpenRouter proxy.
 * Implements prompt engineering, response parsing, and error handling.
 *
 * @see api-plan.md for AI generation specifications
 * @see dto.ts for AIGeneratedContent type definition
 */

import OpenAI from 'openai';
import type {
  AIGeneratedContent,
  DayDetail,
  ActivityDetail,
  TripRecommendations,
} from '../types/dto';

/**
 * Configuration for AI generation
 */
export interface AIConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Trip context for AI generation
 */
export interface TripContext {
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  durationDays: number;
}

/**
 * AI generation result
 */
export interface AIGenerationResult {
  success: true;
  content: AIGeneratedContent;
  tokensUsed: number;
  generationTimeMs: number;
  model: string;
}

/**
 * AI generation error
 */
export interface AIGenerationError {
  success: false;
  error: string;
  code: 'TIMEOUT' | 'INVALID_RESPONSE' | 'API_ERROR' | 'PARSING_ERROR';
  details?: unknown;
}

/**
 * AI generation response type
 */
export type AIServiceResult = AIGenerationResult | AIGenerationError;

/**
 * Default AI configuration
 */
const DEFAULT_CONFIG: Required<AIConfig> = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 3000,
  timeout: 60000, // 60 seconds
};

/**
 * AI Service class
 * Handles all AI generation logic
 */
export class AIService {
  private client: OpenAI;
  private config: Required<AIConfig>;

  constructor(apiKey: string, config: AIConfig = {}, useOpenRouter = false) {
    // Initialize OpenAI client
    // Can use either OpenAI directly or OpenRouter as a proxy
    if (useOpenRouter) {
      // Use OpenRouter (requires OpenRouter API key)
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://vibetravels.com',
          'X-Title': 'VibeTravels',
        },
      });
    } else {
      // Use OpenAI directly (requires OpenAI API key)
      this.client = new OpenAI({
        apiKey: apiKey,
      });
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Generates AI itinerary for a trip
   *
   * @param tripContext - Trip information for generation
   * @param config - Optional configuration overrides
   * @returns AIServiceResult with generated content or error
   *
   * @example
   * const aiService = new AIService(apiKey);
   * const result = await aiService.generateItinerary({
   *   destination: 'Tokyo, Japan',
   *   startDate: '2025-06-01',
   *   endDate: '2025-06-07',
   *   description: 'First time in Japan',
   *   durationDays: 7
   * });
   */
  async generateItinerary(
    tripContext: TripContext,
    config?: AIConfig
  ): Promise<AIServiceResult> {
    const startTime = Date.now();
    const effectiveConfig = { ...this.config, ...config };

    try {
      // 1. Generate prompt
      const prompt = this.buildPrompt(tripContext);

      // 2. Call OpenAI API
      const completion = await Promise.race([
        this.client.chat.completions.create({
          model: effectiveConfig.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert travel planner. Generate detailed, practical, and personalized travel itineraries in JSON format. Always respond with valid JSON matching the specified structure.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: effectiveConfig.temperature,
          max_tokens: effectiveConfig.maxTokens,
          response_format: { type: 'json_object' },
        }),
        this.createTimeoutPromise(effectiveConfig.timeout),
      ]);

      // Check if timed out
      if (!completion || !('choices' in completion)) {
        return {
          success: false,
          error: 'AI generation request timed out',
          code: 'TIMEOUT',
        };
      }

      // 3. Extract response
      const generationTimeMs = Date.now() - startTime;
      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        return {
          success: false,
          error: 'Empty response from AI service',
          code: 'INVALID_RESPONSE',
        };
      }

      // 4. Parse and validate JSON response
      const parseResult = this.parseAndValidateResponse(responseText);
      if (!parseResult.success) {
        return parseResult;
      }

      // 5. Return success result
      return {
        success: true,
        content: parseResult.content,
        tokensUsed: completion.usage?.total_tokens ?? 0,
        generationTimeMs,
        model: effectiveConfig.model,
      };
    } catch (error) {
      // Handle API errors
      console.error('AI Service error:', error);

      if (error instanceof Error) {
        return {
          success: false,
          error: `AI API error: ${error.message}`,
          code: 'API_ERROR',
          details: error,
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred during AI generation',
        code: 'API_ERROR',
        details: error,
      };
    }
  }

  /**
   * Builds the prompt for AI generation
   */
  private buildPrompt(tripContext: TripContext): string {
    return `
Create a detailed travel itinerary for the following trip:

Destination: ${tripContext.destination}
Start Date: ${tripContext.startDate}
End Date: ${tripContext.endDate}
Duration: ${tripContext.durationDays} days
${tripContext.description ? `Additional Information: ${tripContext.description}` : ''}

Please provide:
1. A brief summary of the trip (2-3 sentences)
2. Day-by-day itinerary with:
   - Suggested activities with times
   - Locations and descriptions
   - Estimated duration and cost
   - Practical tips
3. General recommendations for:
   - Transportation options
   - Accommodation areas
   - Budget estimates
   - Best time to visit considerations

IMPORTANT: Format the response as valid JSON matching this exact structure:
{
  "summary": "Brief 2-3 sentence trip overview",
  "days": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "activities": [
        {
          "time": "HH:MM",
          "title": "Activity title",
          "description": "Detailed activity description",
          "location": "Specific location name",
          "duration_minutes": 120,
          "cost_estimate": "$$",
          "tips": "Practical tips for this activity"
        }
      ]
    }
  ],
  "recommendations": {
    "transportation": "Transportation recommendations",
    "accommodation": "Accommodation recommendations",
    "budget": "Budget estimates",
    "best_time": "Best time to visit information"
  }
}

Generate ${tripContext.durationDays} days of activities. Each day should have 3-5 activities.
Cost estimates should use: "$" (budget), "$$" (moderate), "$$$" (expensive), "$$$$" (luxury).
`;
  }

  /**
   * Parses and validates AI response
   */
  private parseAndValidateResponse(
    responseText: string
  ): AIServiceResult | { success: true; content: AIGeneratedContent } {
    try {
      const parsed = JSON.parse(responseText) as unknown;

      // Validate response structure
      if (!this.isValidAIResponse(parsed)) {
        return {
          success: false,
          error: 'AI response does not match expected structure',
          code: 'PARSING_ERROR',
          details: { response: responseText },
        };
      }

      return {
        success: true,
        content: parsed,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse AI response as JSON',
        code: 'PARSING_ERROR',
        details: { response: responseText, error },
      };
    }
  }

  /**
   * Type guard to validate AI response structure
   */
  private isValidAIResponse(data: unknown): data is AIGeneratedContent {
    if (typeof data !== 'object' || data === null) return false;

    const obj = data as Record<string, unknown>;

    // Check summary
    if (typeof obj.summary !== 'string') return false;

    // Check days array
    if (!Array.isArray(obj.days)) return false;
    if (obj.days.length === 0) return false;

    // Validate each day
    for (const day of obj.days) {
      if (!this.isValidDayDetail(day)) return false;
    }

    // Check recommendations
    if (!this.isValidRecommendations(obj.recommendations)) return false;

    return true;
  }

  /**
   * Validates a single day structure
   */
  private isValidDayDetail(data: unknown): data is DayDetail {
    if (typeof data !== 'object' || data === null) return false;

    const day = data as Record<string, unknown>;

    if (typeof day.day_number !== 'number') return false;
    if (typeof day.date !== 'string') return false;
    if (typeof day.title !== 'string') return false;
    if (!Array.isArray(day.activities)) return false;

    // Validate each activity
    for (const activity of day.activities) {
      if (!this.isValidActivity(activity)) return false;
    }

    return true;
  }

  /**
   * Validates a single activity structure
   */
  private isValidActivity(data: unknown): data is ActivityDetail {
    if (typeof data !== 'object' || data === null) return false;

    const activity = data as Record<string, unknown>;

    return (
      typeof activity.time === 'string' &&
      typeof activity.title === 'string' &&
      typeof activity.description === 'string' &&
      typeof activity.location === 'string' &&
      typeof activity.duration_minutes === 'number' &&
      typeof activity.cost_estimate === 'string' &&
      typeof activity.tips === 'string'
    );
  }

  /**
   * Validates recommendations structure
   */
  private isValidRecommendations(
    data: unknown
  ): data is TripRecommendations {
    if (typeof data !== 'object' || data === null) return false;

    const rec = data as Record<string, unknown>;

    return (
      typeof rec.transportation === 'string' &&
      typeof rec.accommodation === 'string' &&
      typeof rec.budget === 'string' &&
      typeof rec.best_time === 'string'
    );
  }

  /**
   * Creates a timeout promise for race condition
   */
  private createTimeoutPromise(timeoutMs: number): Promise<null> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });
  }

  /**
   * Calculates number of days between two dates
   */
  static calculateDurationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
  }
}
