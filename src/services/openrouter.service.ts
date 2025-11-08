/**
 * OpenRouter Service
 *
 * Handles communication with OpenRouter API for generating trip itineraries.
 * Implements structured JSON responses via response_format with full JSON Schema.
 * Supports multiple LLM models (GPT-4, Claude, Gemini, etc.)
 *
 * @see dto.ts for AIGeneratedContent type definition
 */

import OpenAI from "openai";
import type { AIGeneratedContent, DayDetail, ActivityDetail, TripRecommendations } from "../types/dto";

// ============================================================================
// Configuration Types
// ============================================================================

export interface OpenRouterConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  siteUrl?: string;
  siteName?: string;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface TripContext {
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  durationDays: number;
}

export interface OpenRouterSuccess {
  success: true;
  content: AIGeneratedContent;
  tokensUsed: number;
  generationTimeMs: number;
  model: string;
  costUsd: number;
}

export interface OpenRouterError {
  success: false;
  error: string;
  code: OpenRouterErrorCode;
  details?: unknown;
  retryAfter?: number;
}

export type OpenRouterErrorCode =
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "API_ERROR"
  | "PARSING_ERROR"
  | "RATE_LIMIT"
  | "INVALID_MODEL"
  | "SCHEMA_VALIDATION_ERROR";

export type OpenRouterResult = OpenRouterSuccess | OpenRouterError;

export interface ModelInfo {
  id: string;
  name: string;
  pricing: {
    prompt: number; // USD per 1M tokens
    completion: number; // USD per 1M tokens
  };
  contextLength: number;
  description?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<OpenRouterConfig> = {
  model: "openai/gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 55000, // 55s - safe margin for Vercel Pro 60s limit
  siteUrl: "https://vibetravels.com",
  siteName: "VibeTravels",
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
};

// Fallback pricing for popular models (USD per 1M tokens)
const DEFAULT_PRICING: Record<string, { prompt: number; completion: number }> = {
  "openai/gpt-3.5-turbo": { prompt: 0.5, completion: 1.5 },
  "openai/gpt-4o-mini": { prompt: 0.15, completion: 0.6 },
  "openai/gpt-4-turbo": { prompt: 10.0, completion: 30.0 },
  "openai/gpt-4o": { prompt: 5.0, completion: 15.0 },
  "anthropic/claude-3-sonnet": { prompt: 3.0, completion: 15.0 },
  "anthropic/claude-3-opus": { prompt: 15.0, completion: 75.0 },
  "google/gemini-pro": { prompt: 0.5, completion: 1.5 },
};

// ============================================================================
// Service Class
// ============================================================================

export class OpenRouterService {
  private client: OpenAI;
  private config: Required<OpenRouterConfig>;

  constructor(apiKey: string, config: OpenRouterConfig = {}) {
    this.validateApiKey(apiKey);

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": this.config.siteUrl,
        "X-Title": this.config.siteName,
      },
    });
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Generate AI travel itinerary based on trip context
   *
   * @param tripContext - Trip information including destination, dates, and preferences
   * @param config - Optional configuration overrides for this specific request
   * @returns Promise resolving to either success result with content or error details
   */
  async generateItinerary(tripContext: TripContext, config?: Partial<OpenRouterConfig>): Promise<OpenRouterResult> {
    const startTime = Date.now();
    const effectiveConfig = { ...this.config, ...config };

    console.log("[OpenRouter] Starting generation:", {
      destination: tripContext.destination,
      duration: tripContext.durationDays,
      model: effectiveConfig.model,
      timestamp: new Date().toISOString(),
    });

    try {
      // 1. Prepare prompts and response format
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(tripContext);
      const supportsJsonSchema = this.modelSupportsJsonSchema(effectiveConfig.model);
      const responseFormat = supportsJsonSchema ? this.buildResponseFormat() : { type: "json_object" as const };

      console.log("[OpenRouter] Using response format:", supportsJsonSchema ? "json_schema (strict)" : "json_object");

      // 2. Call OpenRouter API with timeout
      const completion = await Promise.race([
        this.client.chat.completions.create({
          model: effectiveConfig.model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: effectiveConfig.temperature,
          max_tokens: effectiveConfig.maxTokens,
          top_p: effectiveConfig.topP,
          frequency_penalty: effectiveConfig.frequencyPenalty,
          presence_penalty: effectiveConfig.presencePenalty,
          response_format: responseFormat,
        }),
        this.createTimeoutPromise(effectiveConfig.timeout),
      ]);

      // 3. Check for timeout
      if (!completion || !("choices" in completion)) {
        console.error("[OpenRouter] Request timed out");
        return {
          success: false,
          error: `Request timed out after ${effectiveConfig.timeout}ms`,
          code: "TIMEOUT",
          details: { timeoutMs: effectiveConfig.timeout },
        };
      }

      // 4. Extract response
      const generationTimeMs = Date.now() - startTime;
      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        console.error("[OpenRouter] Empty response");
        return {
          success: false,
          error: "Empty response from OpenRouter",
          code: "INVALID_RESPONSE",
        };
      }

      // 5. Parse and validate JSON
      const parseResult = this.parseAndValidateResponse(responseText);
      if (!parseResult.success) {
        return parseResult as OpenRouterError;
      }

      // 6. Calculate costs
      const promptTokens = completion.usage?.prompt_tokens ?? 0;
      const completionTokens = completion.usage?.completion_tokens ?? 0;
      const totalTokens = completion.usage?.total_tokens ?? 0;
      const costUsd = this.calculateCost(effectiveConfig.model, promptTokens, completionTokens);

      console.log("[OpenRouter] Generation successful:", {
        model: effectiveConfig.model,
        tokens: totalTokens,
        cost: costUsd.toFixed(4),
        duration: generationTimeMs,
      });

      // 7. Return success
      return {
        success: true,
        content: parseResult.content,
        tokensUsed: totalTokens,
        generationTimeMs,
        model: effectiveConfig.model,
        costUsd,
      };
    } catch (error) {
      console.error("[OpenRouter] Generation failed:", error);

      // Handle OpenRouter-specific errors
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status: number; message?: string };

        // Rate limiting
        if (apiError.status === 429) {
          const retryAfter = 60; // Default
          return {
            success: false,
            error: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
            code: "RATE_LIMIT",
            retryAfter,
            details: error,
          };
        }

        // Invalid model
        if (apiError.status === 400 && apiError.message?.includes("model")) {
          return {
            success: false,
            error: `Model "${effectiveConfig.model}" is not available`,
            code: "INVALID_MODEL",
            details: { requestedModel: effectiveConfig.model },
          };
        }
      }

      // General API error
      if (error instanceof Error) {
        return {
          success: false,
          error: `API error: ${error.message}`,
          code: "API_ERROR",
          details: error,
        };
      }

      return {
        success: false,
        error: "Unknown error occurred",
        code: "API_ERROR",
        details: error,
      };
    }
  }

  /**
   * Calculate duration in days between start and end dates (inclusive)
   *
   * @param startDate - Start date in ISO 8601 format
   * @param endDate - End date in ISO 8601 format
   * @returns Number of days including both start and end dates
   */
  static calculateDurationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  /**
   * Get list of supported models from OpenRouter
   *
   * @returns Promise resolving to array of model information
   */
  async getSupportedModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${this.client.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        data: {
          id: string;
          name: string;
          pricing: {
            prompt: string;
            completion: string;
          };
          context_length: number;
          description?: string;
        }[];
      };

      return data.data.map((model) => ({
        id: model.id,
        name: model.name,
        pricing: {
          prompt: parseFloat(model.pricing.prompt) * 1_000_000, // Convert to per 1M tokens
          completion: parseFloat(model.pricing.completion) * 1_000_000,
        },
        contextLength: model.context_length,
        description: model.description,
      }));
    } catch (error) {
      console.error("[OpenRouter] Failed to fetch models:", error);
      return [];
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate OpenRouter API key format
   */
  private validateApiKey(apiKey: string): void {
    if (!apiKey || !apiKey.startsWith("sk-or-v1-")) {
      throw new Error('Invalid OpenRouter API key. Key must start with "sk-or-v1-"');
    }
  }

  /**
   * Check if model supports json_schema (strict mode)
   * Only newer GPT-4 models support json_schema
   */
  private modelSupportsJsonSchema(model: string): boolean {
    const supportsJsonSchema = [
      "openai/gpt-4-turbo",
      "openai/gpt-4-turbo-preview",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/chatgpt-4o-latest",
    ];
    return supportsJsonSchema.some((m) => model.includes(m));
  }

  /**
   * Build system prompt for AI model
   */
  private buildSystemPrompt(): string {
    return `You are an expert travel planner specializing in creating detailed, personalized travel itineraries.

Your responses must:
1. Be practical and actionable
2. Consider local culture and customs
3. Include realistic timing and costs
4. Provide insider tips and recommendations
5. Follow the exact JSON structure provided

IMPORTANT: Respond ONLY with valid JSON. Do not include any text, markdown, or explanations outside the JSON structure.

Required JSON structure:
{
  "summary": "string",
  "days": [
    {
      "day_number": number,
      "date": "YYYY-MM-DD",
      "title": "string",
      "activities": [
        {
          "time": "HH:MM",
          "title": "string",
          "description": "string",
          "location": "string",
          "duration_minutes": number,
          "cost_estimate": "$ | $$ | $$$ | $$$$",
          "tips": "string"
        }
      ]
    }
  ],
  "recommendations": {
    "transportation": "string",
    "accommodation": "string",
    "budget": "string",
    "best_time": "string"
  }
}`;
  }

  /**
   * Build user prompt with trip context
   */
  private buildUserPrompt(tripContext: TripContext): string {
    const safeDescription = tripContext.description ? this.sanitizeUserInput(tripContext.description) : "";

    return `Create a detailed ${tripContext.durationDays}-day travel itinerary for:

**Destination**: ${tripContext.destination}
**Dates**: ${tripContext.startDate} to ${tripContext.endDate}
${safeDescription ? `**Traveler Notes**: ${safeDescription}` : ""}

Requirements:
- Generate exactly ${tripContext.durationDays} days of activities
- Each day should have 3-5 well-spaced activities
- Include specific times, locations, and practical details
- Provide cost estimates: "$" (budget), "$$" (moderate), "$$$" (expensive), "$$$$" (luxury)
- Add local tips and insider recommendations
- Consider travel time between locations
- Suggest activities suitable for the destination and season

Provide:
1. Brief trip summary (2-3 sentences)
2. Day-by-day detailed itinerary
3. General recommendations for transportation, accommodation, budget, and best time to visit`;
  }

  /**
   * Build response format with full JSON Schema
   * This is the core of structured outputs - ensures AI returns valid JSON
   */
  private buildResponseFormat(): Record<string, unknown> {
    return {
      type: "json_schema",
      json_schema: {
        name: "travel_itinerary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Brief 2-3 sentence overview of the trip",
            },
            days: {
              type: "array",
              description: "Day-by-day itinerary",
              items: {
                type: "object",
                properties: {
                  day_number: {
                    type: "number",
                    description: "Day number (1, 2, 3, ...)",
                  },
                  date: {
                    type: "string",
                    description: "Date in ISO 8601 format (YYYY-MM-DD)",
                  },
                  title: {
                    type: "string",
                    description: 'Title for the day (e.g., "Exploring Tokyo")',
                  },
                  activities: {
                    type: "array",
                    description: "Activities for this day",
                    items: {
                      type: "object",
                      properties: {
                        time: {
                          type: "string",
                          description: "Activity start time (HH:MM format)",
                        },
                        title: {
                          type: "string",
                          description: "Activity title",
                        },
                        description: {
                          type: "string",
                          description: "Detailed description of the activity",
                        },
                        location: {
                          type: "string",
                          description: "Specific location name",
                        },
                        duration_minutes: {
                          type: "number",
                          description: "Estimated duration in minutes",
                        },
                        cost_estimate: {
                          type: "string",
                          description: "Cost estimate: $, $$, $$$, or $$$$",
                        },
                        tips: {
                          type: "string",
                          description: "Practical tips for this activity",
                        },
                      },
                      required: [
                        "time",
                        "title",
                        "description",
                        "location",
                        "duration_minutes",
                        "cost_estimate",
                        "tips",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["day_number", "date", "title", "activities"],
                additionalProperties: false,
              },
            },
            recommendations: {
              type: "object",
              description: "General trip recommendations",
              properties: {
                transportation: {
                  type: "string",
                  description: "Transportation recommendations",
                },
                accommodation: {
                  type: "string",
                  description: "Accommodation area recommendations",
                },
                budget: {
                  type: "string",
                  description: "Overall budget estimates",
                },
                best_time: {
                  type: "string",
                  description: "Best time to visit information",
                },
              },
              required: ["transportation", "accommodation", "budget", "best_time"],
              additionalProperties: false,
            },
          },
          required: ["summary", "days", "recommendations"],
          additionalProperties: false,
        },
      },
    };
  }

  /**
   * Create a promise that resolves to null after timeout
   */
  private createTimeoutPromise(timeoutMs: number): Promise<null> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });
  }

  /**
   * Parse and validate AI response against expected structure
   * Returns parsed content on success, or error details on failure
   */
  private parseAndValidateResponse(
    responseText: string
  ):
    | { success: true; content: AIGeneratedContent }
    | { success: false; error: string; code: OpenRouterErrorCode; details?: unknown } {
    try {
      const parsed = JSON.parse(responseText) as unknown;

      // Validate structure (JSON Schema ensures most validation, but double-check)
      if (!this.isValidAIResponse(parsed)) {
        return {
          success: false,
          error: "Response does not match AIGeneratedContent structure",
          code: "SCHEMA_VALIDATION_ERROR",
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
        error: "Failed to parse JSON response",
        code: "PARSING_ERROR",
        details: { response: responseText, error },
      };
    }
  }

  /**
   * Validate if data matches AIGeneratedContent structure
   */
  private isValidAIResponse(data: unknown): data is AIGeneratedContent {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as Record<string, unknown>;

    return (
      typeof obj.summary === "string" &&
      Array.isArray(obj.days) &&
      obj.days.length > 0 &&
      obj.days.every((day) => this.isValidDayDetail(day)) &&
      this.isValidRecommendations(obj.recommendations)
    );
  }

  /**
   * Validate if data matches DayDetail structure
   */
  private isValidDayDetail(data: unknown): data is DayDetail {
    if (typeof data !== "object" || data === null) return false;

    const day = data as Record<string, unknown>;

    return (
      typeof day.day_number === "number" &&
      typeof day.date === "string" &&
      typeof day.title === "string" &&
      Array.isArray(day.activities) &&
      day.activities.every((activity) => this.isValidActivity(activity))
    );
  }

  /**
   * Validate if data matches ActivityDetail structure
   */
  private isValidActivity(data: unknown): data is ActivityDetail {
    if (typeof data !== "object" || data === null) return false;

    const activity = data as Record<string, unknown>;

    return (
      typeof activity.time === "string" &&
      typeof activity.title === "string" &&
      typeof activity.description === "string" &&
      typeof activity.location === "string" &&
      typeof activity.duration_minutes === "number" &&
      typeof activity.cost_estimate === "string" &&
      typeof activity.tips === "string"
    );
  }

  /**
   * Validate if data matches TripRecommendations structure
   */
  private isValidRecommendations(data: unknown): data is TripRecommendations {
    if (typeof data !== "object" || data === null) return false;

    const rec = data as Record<string, unknown>;

    return (
      typeof rec.transportation === "string" &&
      typeof rec.accommodation === "string" &&
      typeof rec.budget === "string" &&
      typeof rec.best_time === "string"
    );
  }

  /**
   * Calculate estimated cost in USD based on token usage
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = DEFAULT_PRICING[model] || { prompt: 1.0, completion: 3.0 };

    const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * pricing.completion;

    return promptCost + completionCost;
  }

  /**
   * Sanitize user input to prevent prompt injection attacks
   */
  private sanitizeUserInput(text: string): string {
    // Remove potentially dangerous instructions
    const dangerous = [/ignore\s+previous\s+instructions/gi, /disregard\s+above/gi, /system\s*:/gi, /assistant\s*:/gi];

    let sanitized = text;
    for (const pattern of dangerous) {
      sanitized = sanitized.replace(pattern, "");
    }

    return sanitized.trim();
  }
}
