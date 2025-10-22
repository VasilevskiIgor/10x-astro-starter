# 📋 Plan Implementacji Usługi OpenRouter

## 1. Opis Usługi

### Cel
Usługa `OpenRouterService` zastąpi obecne `AIService` i będzie odpowiedzialna za:
- Komunikację z API OpenRouter do generowania planów podróży opartych na LLM
- Obsługę ustrukturyzowanych odpowiedzi JSON poprzez `response_format` z pełnym JSON Schema
- Zarządzanie konfiguracją modeli AI (GPT-4, Claude, Gemini, itp.)
- Walidację i parsowanie odpowiedzi zgodnych ze schematem
- Obsługę błędów i timeoutów
- Zachowanie pełnej kompatybilności z obecnymi formatami JSON (`AIGeneratedContent`)

### Kluczowe Różnice vs Obecne AIService
1. **Pełny JSON Schema**: Zamiast `{ type: 'json_object' }` używamy `{ type: 'json_schema', json_schema: {...} }`
2. **Większa kontrola nad modelami**: OpenRouter daje dostęp do wielu modeli (GPT-4, Claude, Gemini)
3. **Lepsza obsługa kosztów**: OpenRouter zwraca szczegółowe informacje o kosztach
4. **Dedykowany dla OpenRouter**: Usunięcie obsługi bezpośredniego OpenAI API (tylko OpenRouter)

### Kompatybilność
- ✅ Zachowuje wszystkie obecne typy: `AIGeneratedContent`, `DayDetail`, `ActivityDetail`, `TripRecommendations`
- ✅ Kompatybilna z obecnym API endpoint: `POST /api/trips/:id/generate-ai`
- ✅ Zgodna z bazą danych (kolumny `ai_generated_content`, `ai_model`, itp.)

---

## 2. Konstruktor Usługi

### Sygnatura
```typescript
constructor(
  apiKey: string,
  config?: OpenRouterConfig
)
```

### Parametry

#### `apiKey: string` (wymagany)
- Klucz API OpenRouter (format: `sk-or-v1-...`)
- Pobrany z `import.meta.env.OPENROUTER_API_KEY`
- **Walidacja**: Musi zaczynać się od `sk-or-v1-`

#### `config?: OpenRouterConfig` (opcjonalny)
```typescript
interface OpenRouterConfig {
  model?: string;              // Default: 'openai/gpt-3.5-turbo'
  temperature?: number;         // Default: 0.7 (range: 0.0-2.0)
  maxTokens?: number;           // Default: 4000
  timeout?: number;             // Default: 90000 (90s)
  siteUrl?: string;            // Default: 'https://vibetravels.com'
  siteName?: string;           // Default: 'VibeTravels'
  topP?: number;               // Default: 1.0
  frequencyPenalty?: number;   // Default: 0.0
  presencePenalty?: number;    // Default: 0.0
}
```

### Przykład Użycia
```typescript
// Podstawowa inicjalizacja
const service = new OpenRouterService(
  import.meta.env.OPENROUTER_API_KEY
);

// Z konfiguracją
const service = new OpenRouterService(
  import.meta.env.OPENROUTER_API_KEY,
  {
    model: 'anthropic/claude-3-sonnet',
    temperature: 0.8,
    maxTokens: 5000,
    timeout: 120000
  }
);
```

### Inicjalizacja Wewnętrzna

#### Klient OpenAI SDK
```typescript
this.client = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': config?.siteUrl || 'https://vibetravels.com',
    'X-Title': config?.siteName || 'VibeTravels',
  },
});
```

#### Walidacja API Key
```typescript
private validateApiKey(apiKey: string): void {
  if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
    throw new Error(
      'Invalid OpenRouter API key. Key must start with "sk-or-v1-"'
    );
  }
}
```

---

## 3. Publiczne Metody i Pola

### 3.1 Metoda: `generateItinerary()`

#### Sygnatura
```typescript
async generateItinerary(
  tripContext: TripContext,
  config?: Partial<OpenRouterConfig>
): Promise<OpenRouterResult>
```

#### Parametry Wejściowe

**`tripContext: TripContext`**
```typescript
interface TripContext {
  destination: string;      // np. "Tokyo, Japan"
  startDate: string;        // ISO 8601: "2025-06-01"
  endDate: string;          // ISO 8601: "2025-06-07"
  description?: string;     // Opcjonalne: "First time in Japan, interested in anime"
  durationDays: number;     // Obliczone: 7
}
```

**`config?: Partial<OpenRouterConfig>`**
- Nadpisuje domyślną konfigurację dla tego konkretnego wywołania
- Wszystkie pola opcjonalne

#### Zwracana Wartość

**Typ: `OpenRouterResult`**
```typescript
type OpenRouterResult =
  | OpenRouterSuccess
  | OpenRouterError;

interface OpenRouterSuccess {
  success: true;
  content: AIGeneratedContent;  // Zgodny z obecnym DTO
  tokensUsed: number;
  generationTimeMs: number;
  model: string;
  costUsd: number;              // NOWE: koszt w USD
}

interface OpenRouterError {
  success: false;
  error: string;
  code: OpenRouterErrorCode;
  details?: unknown;
  retryAfter?: number;          // NOWE: dla 429 errors
}

type OpenRouterErrorCode =
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'API_ERROR'
  | 'PARSING_ERROR'
  | 'RATE_LIMIT'                // NOWE
  | 'INVALID_MODEL'             // NOWE
  | 'SCHEMA_VALIDATION_ERROR';  // NOWE
```

#### Przykład Użycia
```typescript
const service = new OpenRouterService(apiKey);

const result = await service.generateItinerary({
  destination: 'Barcelona, Spain',
  startDate: '2025-07-10',
  endDate: '2025-07-15',
  description: 'Romantic trip, love art and good food',
  durationDays: 6
});

if (result.success) {
  console.log('Generated itinerary:', result.content);
  console.log('Cost:', result.costUsd, 'USD');
  console.log('Tokens:', result.tokensUsed);
} else {
  console.error('Error:', result.error);
  if (result.code === 'RATE_LIMIT') {
    console.log('Retry after:', result.retryAfter, 'seconds');
  }
}
```

### 3.2 Metoda Statyczna: `calculateDurationDays()`

#### Sygnatura
```typescript
static calculateDurationDays(
  startDate: string,
  endDate: string
): number
```

#### Parametry
- `startDate`: Data rozpoczęcia w formacie ISO 8601
- `endDate`: Data zakończenia w formacie ISO 8601

#### Zwraca
- Liczbę dni podróży (włącznie z dniem rozpoczęcia i zakończenia)

#### Przykład
```typescript
const days = OpenRouterService.calculateDurationDays(
  '2025-06-01',
  '2025-06-07'
);
console.log(days); // 7
```

### 3.3 Metoda: `getSupportedModels()`

#### Sygnatura
```typescript
async getSupportedModels(): Promise<ModelInfo[]>
```

#### Zwraca
```typescript
interface ModelInfo {
  id: string;
  name: string;
  pricing: {
    prompt: number;      // USD per 1M tokens
    completion: number;  // USD per 1M tokens
  };
  contextLength: number;
  description?: string;
}
```

#### Przykład
```typescript
const models = await service.getSupportedModels();
console.log(models);
// [
//   {
//     id: 'openai/gpt-4-turbo',
//     name: 'GPT-4 Turbo',
//     pricing: { prompt: 10.00, completion: 30.00 },
//     contextLength: 128000
//   },
//   ...
// ]
```

---

## 4. Prywatne Metody i Pola

### 4.1 Pole: `client`
```typescript
private client: OpenAI;
```
- Instancja klienta OpenAI SDK skonfigurowana dla OpenRouter
- Używana do wszystkich wywołań API

### 4.2 Pole: `config`
```typescript
private config: Required<OpenRouterConfig>;
```
- Pełna konfiguracja z wartościami domyślnymi
- Scala wartości domyślne z przekazaną konfiguracją

### 4.3 Metoda: `buildSystemPrompt()`

#### Sygnatura
```typescript
private buildSystemPrompt(): string
```

#### Implementacja
```typescript
private buildSystemPrompt(): string {
  return `You are an expert travel planner specializing in creating detailed, personalized travel itineraries.

Your responses must:
1. Be practical and actionable
2. Consider local culture and customs
3. Include realistic timing and costs
4. Provide insider tips and recommendations
5. Follow the exact JSON structure provided

Always respond with valid JSON matching the specified schema. Do not include any text outside the JSON structure.`;
}
```

### 4.4 Metoda: `buildUserPrompt()`

#### Sygnatura
```typescript
private buildUserPrompt(tripContext: TripContext): string
```

#### Implementacja
```typescript
private buildUserPrompt(tripContext: TripContext): string {
  return `Create a detailed ${tripContext.durationDays}-day travel itinerary for:

**Destination**: ${tripContext.destination}
**Dates**: ${tripContext.startDate} to ${tripContext.endDate}
${tripContext.description ? `**Traveler Notes**: ${tripContext.description}` : ''}

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
```

### 4.5 Metoda: `buildResponseFormat()`

#### Sygnatura
```typescript
private buildResponseFormat(): ResponseFormat
```

#### Implementacja - KLUCZOWA CZĘŚĆ!
```typescript
private buildResponseFormat(): ResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'travel_itinerary',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Brief 2-3 sentence overview of the trip'
          },
          days: {
            type: 'array',
            description: 'Day-by-day itinerary',
            items: {
              type: 'object',
              properties: {
                day_number: {
                  type: 'number',
                  description: 'Day number (1, 2, 3, ...)'
                },
                date: {
                  type: 'string',
                  description: 'Date in ISO 8601 format (YYYY-MM-DD)'
                },
                title: {
                  type: 'string',
                  description: 'Title for the day (e.g., "Exploring Tokyo")'
                },
                activities: {
                  type: 'array',
                  description: 'Activities for this day',
                  items: {
                    type: 'object',
                    properties: {
                      time: {
                        type: 'string',
                        description: 'Activity start time (HH:MM format)'
                      },
                      title: {
                        type: 'string',
                        description: 'Activity title'
                      },
                      description: {
                        type: 'string',
                        description: 'Detailed description of the activity'
                      },
                      location: {
                        type: 'string',
                        description: 'Specific location name'
                      },
                      duration_minutes: {
                        type: 'number',
                        description: 'Estimated duration in minutes'
                      },
                      cost_estimate: {
                        type: 'string',
                        description: 'Cost estimate: $, $$, $$$, or $$$$'
                      },
                      tips: {
                        type: 'string',
                        description: 'Practical tips for this activity'
                      }
                    },
                    required: [
                      'time',
                      'title',
                      'description',
                      'location',
                      'duration_minutes',
                      'cost_estimate',
                      'tips'
                    ],
                    additionalProperties: false
                  }
                }
              },
              required: ['day_number', 'date', 'title', 'activities'],
              additionalProperties: false
            }
          },
          recommendations: {
            type: 'object',
            description: 'General trip recommendations',
            properties: {
              transportation: {
                type: 'string',
                description: 'Transportation recommendations'
              },
              accommodation: {
                type: 'string',
                description: 'Accommodation area recommendations'
              },
              budget: {
                type: 'string',
                description: 'Overall budget estimates'
              },
              best_time: {
                type: 'string',
                description: 'Best time to visit information'
              }
            },
            required: ['transportation', 'accommodation', 'budget', 'best_time'],
            additionalProperties: false
          }
        },
        required: ['summary', 'days', 'recommendations'],
        additionalProperties: false
      }
    }
  };
}
```

**Kluczowe Elementy JSON Schema**:
1. `type: 'json_schema'` - Włącza tryb strukturyzowanych odpowiedzi
2. `name: 'travel_itinerary'` - Unikalna nazwa schematu
3. `strict: true` - Wymusza ścisłe przestrzeganie schematu
4. `schema` - Pełna definicja struktury JSON zgodna z `AIGeneratedContent`
5. `required` - Wszystkie wymagane pola
6. `additionalProperties: false` - Blokuje dodatkowe pola

### 4.6 Metoda: `createTimeoutPromise()`

```typescript
private createTimeoutPromise(timeoutMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });
}
```

### 4.7 Metoda: `parseAndValidateResponse()`

#### Sygnatura
```typescript
private parseAndValidateResponse(
  responseText: string
): { success: true; content: AIGeneratedContent } | OpenRouterError
```

#### Implementacja
```typescript
private parseAndValidateResponse(
  responseText: string
): { success: true; content: AIGeneratedContent } | OpenRouterError {
  try {
    const parsed = JSON.parse(responseText) as unknown;

    // Dzięki JSON Schema, OpenRouter już zwrócił poprawną strukturę
    // Ale dla bezpieczeństwa, nadal walidujemy
    if (!this.isValidAIResponse(parsed)) {
      return {
        success: false,
        error: 'Response does not match AIGeneratedContent structure',
        code: 'SCHEMA_VALIDATION_ERROR',
        details: { response: responseText }
      };
    }

    return {
      success: true,
      content: parsed
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse JSON response',
      code: 'PARSING_ERROR',
      details: { response: responseText, error }
    };
  }
}
```

### 4.8 Metody Walidacyjne

#### `isValidAIResponse()`
```typescript
private isValidAIResponse(data: unknown): data is AIGeneratedContent {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.summary === 'string' &&
    Array.isArray(obj.days) &&
    obj.days.length > 0 &&
    obj.days.every(day => this.isValidDayDetail(day)) &&
    this.isValidRecommendations(obj.recommendations)
  );
}
```

#### `isValidDayDetail()`
```typescript
private isValidDayDetail(data: unknown): data is DayDetail {
  if (typeof data !== 'object' || data === null) return false;

  const day = data as Record<string, unknown>;

  return (
    typeof day.day_number === 'number' &&
    typeof day.date === 'string' &&
    typeof day.title === 'string' &&
    Array.isArray(day.activities) &&
    day.activities.every(activity => this.isValidActivity(activity))
  );
}
```

#### `isValidActivity()`
```typescript
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
```

#### `isValidRecommendations()`
```typescript
private isValidRecommendations(data: unknown): data is TripRecommendations {
  if (typeof data !== 'object' || data === null) return false;

  const rec = data as Record<string, unknown>;

  return (
    typeof rec.transportation === 'string' &&
    typeof rec.accommodation === 'string' &&
    typeof rec.budget === 'string' &&
    typeof rec.best_time === 'string'
  );
}
```

### 4.9 Metoda: `calculateCost()`

```typescript
private calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
  pricing?: { prompt: number; completion: number }
): number {
  if (!pricing) {
    // Fallback pricing dla najpopularniejszych modeli
    const defaultPricing: Record<string, { prompt: number; completion: number }> = {
      'openai/gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
      'openai/gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
      'anthropic/claude-3-sonnet': { prompt: 3.0, completion: 15.0 },
      'anthropic/claude-3-opus': { prompt: 15.0, completion: 75.0 },
      'google/gemini-pro': { prompt: 0.5, completion: 1.5 },
    };

    pricing = defaultPricing[model] || { prompt: 1.0, completion: 3.0 };
  }

  const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * pricing.completion;

  return promptCost + completionCost;
}
```

---

## 5. Obsługa Błędów

### 5.1 Hierarchia Błędów

```typescript
class OpenRouterError extends Error {
  constructor(
    public code: OpenRouterErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

class OpenRouterTimeoutError extends OpenRouterError {
  constructor(timeoutMs: number) {
    super(
      'TIMEOUT',
      `Request timed out after ${timeoutMs}ms`,
      { timeoutMs }
    );
  }
}

class OpenRouterRateLimitError extends OpenRouterError {
  constructor(public retryAfter: number) {
    super(
      'RATE_LIMIT',
      `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      { retryAfter }
    );
  }
}

class OpenRouterSchemaValidationError extends OpenRouterError {
  constructor(response: string) {
    super(
      'SCHEMA_VALIDATION_ERROR',
      'AI response does not match expected schema',
      { response }
    );
  }
}
```

### 5.2 Scenariusze Błędów

#### 1. **Timeout (90s+)**
```typescript
// Wywołanie
const result = await service.generateItinerary(tripContext);

// Odpowiedź
{
  success: false,
  error: 'Request timed out after 90000ms',
  code: 'TIMEOUT',
  details: { timeoutMs: 90000 }
}
```

**Obsługa w API**:
```typescript
if (result.code === 'TIMEOUT') {
  await supabase
    .from('trips')
    .update({ status: 'failed' })
    .eq('id', tripId);

  return errorResponse(
    'AI_GENERATION_TIMEOUT',
    'AI generation timed out. Please try again.',
    500
  );
}
```

#### 2. **Rate Limit (429 Too Many Requests)**
```typescript
{
  success: false,
  error: 'Rate limit exceeded. Retry after 60 seconds',
  code: 'RATE_LIMIT',
  retryAfter: 60,
  details: { /* OpenRouter error details */ }
}
```

**Obsługa w API**:
```typescript
if (result.code === 'RATE_LIMIT') {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'OpenRouter rate limit exceeded',
        details: {
          retry_after: result.retryAfter,
          provider: 'OpenRouter'
        }
      }
    }),
    {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter.toString(),
        'Content-Type': 'application/json'
      }
    }
  );
}
```

#### 3. **Invalid Model**
```typescript
{
  success: false,
  error: 'Model "invalid/model" is not available on OpenRouter',
  code: 'INVALID_MODEL',
  details: { requestedModel: 'invalid/model' }
}
```

#### 4. **Schema Validation Error**
```typescript
{
  success: false,
  error: 'AI response does not match expected schema',
  code: 'SCHEMA_VALIDATION_ERROR',
  details: { response: '{"invalid": "structure"}' }
}
```

**Obsługa**:
```typescript
// Log do monitoring
console.error('Schema validation failed:', result.details);

// Spróbuj ponownie z innym modelem
const retryResult = await service.generateItinerary(
  tripContext,
  { model: 'openai/gpt-4-turbo' } // Bardziej niezawodny model
);
```

#### 5. **API Error (Network, Auth, itp.)**
```typescript
{
  success: false,
  error: 'API request failed: Unauthorized',
  code: 'API_ERROR',
  details: {
    status: 401,
    message: 'Invalid API key'
  }
}
```

### 5.3 Retry Logic (Opcjonalne)

```typescript
async generateItineraryWithRetry(
  tripContext: TripContext,
  maxRetries: number = 3
): Promise<OpenRouterResult> {
  let lastError: OpenRouterError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await this.generateItinerary(tripContext);

    if (result.success) {
      return result;
    }

    // Nie retry dla niektórych błędów
    if (
      result.code === 'INVALID_MODEL' ||
      result.code === 'SCHEMA_VALIDATION_ERROR'
    ) {
      return result;
    }

    // Retry z exponential backoff
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    lastError = result;
  }

  return lastError!;
}
```

---

## 6. Kwestie Bezpieczeństwa

### 6.1 Ochrona API Key

#### ✅ PRAWIDŁOWO
```typescript
// Backend - API Route
const apiKey = import.meta.env.OPENROUTER_API_KEY;
const service = new OpenRouterService(apiKey);
```

#### ❌ NIEPRAWIDŁOWO
```typescript
// Frontend - NIGDY!
const apiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY; // ❌
```

**Zasady**:
1. **NIGDY** nie przekazuj API key do frontendu
2. Używaj tylko `OPENROUTER_API_KEY` (bez prefiksu `PUBLIC_`)
3. Wszystkie wywołania OpenRouter tylko z backend API routes
4. Dodaj `.env` do `.gitignore`

### 6.2 Walidacja Wejścia

#### Rate Limiting
```typescript
// W API route - sprawdź przed wywołaniem usługi
const rateLimitCheck = isRateLimitExceeded(userRateLimits);
if (rateLimitCheck.exceeded) {
  return errorResponse('RATE_LIMIT_EXCEEDED', ...);
}
```

#### Input Sanitization
```typescript
// Waliduj długość description
if (trip.description && trip.description.length > 2000) {
  return errorResponse('VALIDATION_ERROR', 'Description too long');
}

// Waliduj destination
if (trip.destination.length > 200) {
  return errorResponse('VALIDATION_ERROR', 'Destination too long');
}
```

### 6.3 Ochrona przed Prompt Injection

```typescript
private sanitizeUserInput(text: string): string {
  // Usuń potencjalnie niebezpieczne instrukcje
  const dangerous = [
    /ignore\s+previous\s+instructions/gi,
    /disregard\s+above/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
  ];

  let sanitized = text;
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.trim();
}

private buildUserPrompt(tripContext: TripContext): string {
  const safeDescription = tripContext.description
    ? this.sanitizeUserInput(tripContext.description)
    : '';

  return `Create a detailed ${tripContext.durationDays}-day travel itinerary for:

**Destination**: ${tripContext.destination}
**Dates**: ${tripContext.startDate} to ${tripContext.endDate}
${safeDescription ? `**Traveler Notes**: ${safeDescription}` : ''}
...`;
}
```

### 6.4 Logging i Monitoring

```typescript
// W generateItinerary() - loguj wszystkie wywołania
console.log('[OpenRouter] Starting generation:', {
  destination: tripContext.destination,
  duration: tripContext.durationDays,
  model: this.config.model,
  timestamp: new Date().toISOString()
});

// Log sukcesu
console.log('[OpenRouter] Generation successful:', {
  model: result.model,
  tokens: result.tokensUsed,
  cost: result.costUsd,
  duration: result.generationTimeMs
});

// Log błędów
console.error('[OpenRouter] Generation failed:', {
  code: result.code,
  error: result.error,
  details: result.details
});
```

### 6.5 Koszty i Limity

#### Monitoring Kosztów
```typescript
// W API route - zapisz koszty
await supabase.from('ai_generation_logs').insert({
  user_id: userId,
  trip_id: tripId,
  model: aiResult.model,
  total_tokens: aiResult.tokensUsed,
  estimated_cost_usd: aiResult.costUsd, // NOWE pole
  generation_time_ms: aiResult.generationTimeMs,
  status: 'success'
});
```

#### Limity dla Użytkowników
```typescript
// Sprawdź miesięczny budżet użytkownika
const { data: monthlyUsage } = await supabase
  .from('ai_generation_logs')
  .select('estimated_cost_usd')
  .eq('user_id', userId)
  .gte('created_at', startOfMonth)
  .lte('created_at', endOfMonth);

const totalCost = monthlyUsage?.reduce(
  (sum, log) => sum + (log.estimated_cost_usd || 0),
  0
) || 0;

const MAX_MONTHLY_BUDGET = 10.0; // $10 per user per month

if (totalCost >= MAX_MONTHLY_BUDGET) {
  return errorResponse(
    'BUDGET_EXCEEDED',
    'Monthly AI generation budget exceeded',
    { current: totalCost, limit: MAX_MONTHLY_BUDGET }
  );
}
```

---

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Przygotowanie Środowiska

#### 1.1 Aktualizacja zmiennych środowiskowych

**Plik: `.env`**
```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=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

# Usuń lub zakomentuj stare klucze OpenAI
# OPENAI_API_KEY=sk-proj-...  ❌
```

**Plik: `.env.example`** (dla dokumentacji)
```bash
# OpenRouter API Key (required)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

#### 1.2 Weryfikacja zależności

```bash
cd 10x-astro-starter
npm list openai
```

Upewnij się, że masz `openai@^4.0.0` (wspiera JSON Schema)

```bash
npm install openai@latest
```

---

### Krok 2: Stworzenie Pliku Usługi

#### 2.1 Utwórz nowy plik

**Lokalizacja**: `src/services/openrouter.service.ts`

**Struktura**:
```typescript
/**
 * OpenRouter Service
 *
 * Handles communication with OpenRouter API for generating trip itineraries.
 * Implements structured JSON responses via response_format with full JSON Schema.
 * Supports multiple LLM models (GPT-4, Claude, Gemini, etc.)
 *
 * @see dto.ts for AIGeneratedContent type definition
 */

import OpenAI from 'openai';
import type {
  AIGeneratedContent,
  DayDetail,
  ActivityDetail,
  TripRecommendations,
} from '../types/dto';

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
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'API_ERROR'
  | 'PARSING_ERROR'
  | 'RATE_LIMIT'
  | 'INVALID_MODEL'
  | 'SCHEMA_VALIDATION_ERROR';

export type OpenRouterResult = OpenRouterSuccess | OpenRouterError;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<OpenRouterConfig> = {
  model: 'openai/gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 90000,
  siteUrl: 'https://vibetravels.com',
  siteName: 'VibeTravels',
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
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
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': this.config.siteUrl,
        'X-Title': this.config.siteName,
      },
    });
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  async generateItinerary(
    tripContext: TripContext,
    config?: Partial<OpenRouterConfig>
  ): Promise<OpenRouterResult> {
    // Implementacja w następnych krokach
  }

  static calculateDurationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private validateApiKey(apiKey: string): void {
    if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
      throw new Error(
        'Invalid OpenRouter API key. Key must start with "sk-or-v1-"'
      );
    }
  }

  private buildSystemPrompt(): string {
    // Implementacja jak w sekcji 4.3
  }

  private buildUserPrompt(tripContext: TripContext): string {
    // Implementacja jak w sekcji 4.4
  }

  private buildResponseFormat(): any {
    // Implementacja jak w sekcji 4.5
  }

  private parseAndValidateResponse(responseText: string):
    { success: true; content: AIGeneratedContent } | OpenRouterError {
    // Implementacja jak w sekcji 4.7
  }

  private isValidAIResponse(data: unknown): data is AIGeneratedContent {
    // Implementacja jak w sekcji 4.8
  }

  private isValidDayDetail(data: unknown): data is DayDetail {
    // Implementacja jak w sekcji 4.8
  }

  private isValidActivity(data: unknown): data is ActivityDetail {
    // Implementacja jak w sekcji 4.8
  }

  private isValidRecommendations(data: unknown): data is TripRecommendations {
    // Implementacja jak w sekcji 4.8
  }

  private createTimeoutPromise(timeoutMs: number): Promise<null> {
    // Implementacja jak w sekcji 4.6
  }

  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    // Implementacja jak w sekcji 4.9
  }

  private sanitizeUserInput(text: string): string {
    // Implementacja jak w sekcji 6.3
  }
}
```

---

### Krok 3: Implementacja Głównej Metody

**W pliku `src/services/openrouter.service.ts`**

```typescript
async generateItinerary(
  tripContext: TripContext,
  config?: Partial<OpenRouterConfig>
): Promise<OpenRouterResult> {
  const startTime = Date.now();
  const effectiveConfig = { ...this.config, ...config };

  console.log('[OpenRouter] Starting generation:', {
    destination: tripContext.destination,
    duration: tripContext.durationDays,
    model: effectiveConfig.model,
    timestamp: new Date().toISOString(),
  });

  try {
    // 1. Przygotuj prompty i format
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(tripContext);
    const responseFormat = this.buildResponseFormat();

    // 2. Wywołaj OpenRouter API
    const completion = await Promise.race([
      this.client.chat.completions.create({
        model: effectiveConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
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

    // 3. Sprawdź timeout
    if (!completion || !('choices' in completion)) {
      console.error('[OpenRouter] Request timed out');
      return {
        success: false,
        error: `Request timed out after ${effectiveConfig.timeout}ms`,
        code: 'TIMEOUT',
        details: { timeoutMs: effectiveConfig.timeout },
      };
    }

    // 4. Wyciągnij odpowiedź
    const generationTimeMs = Date.now() - startTime;
    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      console.error('[OpenRouter] Empty response');
      return {
        success: false,
        error: 'Empty response from OpenRouter',
        code: 'INVALID_RESPONSE',
      };
    }

    // 5. Parsuj i waliduj JSON
    const parseResult = this.parseAndValidateResponse(responseText);
    if (!parseResult.success) {
      return parseResult;
    }

    // 6. Oblicz koszty
    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const totalTokens = completion.usage?.total_tokens ?? 0;
    const costUsd = this.calculateCost(
      effectiveConfig.model,
      promptTokens,
      completionTokens
    );

    console.log('[OpenRouter] Generation successful:', {
      model: effectiveConfig.model,
      tokens: totalTokens,
      cost: costUsd.toFixed(4),
      duration: generationTimeMs,
    });

    // 7. Zwróć sukces
    return {
      success: true,
      content: parseResult.content,
      tokensUsed: totalTokens,
      generationTimeMs,
      model: effectiveConfig.model,
      costUsd,
    };
  } catch (error) {
    console.error('[OpenRouter] Generation failed:', error);

    // Obsłuż błędy OpenRouter
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string };

      // Rate limiting
      if (apiError.status === 429) {
        const retryAfter = 60; // Default
        return {
          success: false,
          error: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
          code: 'RATE_LIMIT',
          retryAfter,
          details: error,
        };
      }

      // Invalid model
      if (apiError.status === 400 && apiError.message?.includes('model')) {
        return {
          success: false,
          error: `Model "${effectiveConfig.model}" is not available`,
          code: 'INVALID_MODEL',
          details: { requestedModel: effectiveConfig.model },
        };
      }
    }

    // Ogólny błąd API
    if (error instanceof Error) {
      return {
        success: false,
        error: `API error: ${error.message}`,
        code: 'API_ERROR',
        details: error,
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
      code: 'API_ERROR',
      details: error,
    };
  }
}
```

---

### Krok 4: Aktualizacja API Route

**Plik: `src/pages/api/trips/[id]/generate-ai.ts`**

Zmień import i inicjalizację:

```typescript
// BYŁO:
// import { AIService } from '../../../../services/ai.service';

// JEST:
import { OpenRouterService } from '../../../../services/openrouter.service';
```

Zmień inicjalizację usługi (około linia 199):

```typescript
// BYŁO:
// const openaiApiKey = import.meta.env.OPENAI_API_KEY;
// if (!openaiApiKey) {
//   console.error('OPENAI_API_KEY not configured');
//   ...
// }
// const aiService = new AIService(openaiApiKey, {...});

// JEST:
const openrouterApiKey = import.meta.env.OPENROUTER_API_KEY;

if (!openrouterApiKey) {
  console.error('OPENROUTER_API_KEY not configured');

  // Przywróć status
  await supabase
    .from('trips')
    .update({ status: trip.status })
    .eq('id', tripId);

  return errorResponse('INTERNAL_ERROR', 'AI service not configured');
}

const aiService = new OpenRouterService(openrouterApiKey, {
  model: command.model || 'openai/gpt-3.5-turbo',
  temperature: command.temperature ?? 0.7,
});
```

Zaktualizuj obsługę wyniku (około linia 266):

```typescript
// Dodaj koszt do aktualizacji
const { data: updatedTrip, error: finalUpdateError } = await supabase
  .from('trips')
  .update({
    status: 'completed',
    ai_generated_content: aiResult.content as any,
    ai_model: aiResult.model,
    ai_tokens_used: aiResult.tokensUsed,
    ai_generation_time_ms: aiResult.generationTimeMs,
    // NOWE: jeśli masz kolumnę ai_cost_usd
    // ai_cost_usd: aiResult.costUsd,
  })
  .eq('id', tripId)
  .select()
  .single();
```

Zaktualizuj logging (około linia 304):

```typescript
await supabase.from('ai_generation_logs').insert({
  user_id: userId,
  trip_id: tripId,
  model: aiResult.model,
  prompt_tokens: Math.floor(aiResult.tokensUsed * 0.3),
  completion_tokens: Math.floor(aiResult.tokensUsed * 0.7),
  total_tokens: aiResult.tokensUsed,
  generation_time_ms: aiResult.generationTimeMs,
  status: 'success',
  estimated_cost_usd: aiResult.costUsd, // NOWE: dokładniejszy koszt
});
```

Dodaj obsługę błędu rate limit (po linii 235):

```typescript
// 12. Handle AI generation failure
if (!aiResult.success) {
  console.error('AI generation failed:', aiResult.error);

  // Specjalna obsługa rate limiting
  if (aiResult.code === 'RATE_LIMIT') {
    await supabase
      .from('trips')
      .update({ status: trip.status }) // Przywróć status
      .eq('id', tripId);

    return new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'OpenRouter rate limit exceeded',
          details: {
            retry_after: aiResult.retryAfter,
            provider: 'OpenRouter',
          },
        },
      }),
      {
        status: 429,
        headers: {
          'Retry-After': (aiResult.retryAfter || 60).toString(),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Standardowa obsługa błędów
  await supabase
    .from('trips')
    .update({ status: 'failed' })
    .eq('id', tripId);

  // ... reszta jak było
}
```

---

### Krok 5: Aktualizacja Eksportów

**Plik: `src/services/index.ts`**

```typescript
// Dodaj export dla nowej usługi
export { OpenRouterService } from './openrouter.service';
export type {
  OpenRouterConfig,
  TripContext,
  OpenRouterResult,
  OpenRouterSuccess,
  OpenRouterError,
  OpenRouterErrorCode,
} from './openrouter.service';

// Opcjonalnie: usuń stary export
// export { AIService } from './ai.service'; ❌
```

---

### Krok 6: Testy i Weryfikacja

#### 6.1 Test Jednostkowy

**Stwórz: `src/services/__tests__/openrouter.service.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenRouterService } from '../openrouter.service';

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    const apiKey = import.meta.env.OPENROUTER_API_KEY || 'sk-or-v1-test';
    service = new OpenRouterService(apiKey);
  });

  describe('Constructor', () => {
    it('should throw error for invalid API key', () => {
      expect(() => new OpenRouterService('invalid-key')).toThrow(
        'Invalid OpenRouter API key'
      );
    });

    it('should accept valid API key', () => {
      expect(() => new OpenRouterService('sk-or-v1-validkey')).not.toThrow();
    });
  });

  describe('calculateDurationDays', () => {
    it('should calculate correct duration', () => {
      const days = OpenRouterService.calculateDurationDays(
        '2025-06-01',
        '2025-06-07'
      );
      expect(days).toBe(7);
    });

    it('should include both start and end days', () => {
      const days = OpenRouterService.calculateDurationDays(
        '2025-06-01',
        '2025-06-01'
      );
      expect(days).toBe(1);
    });
  });

  // Więcej testów...
});
```

#### 6.2 Test Integracyjny

**Stwórz: `src/services/__tests__/openrouter.integration.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { OpenRouterService } from '../openrouter.service';

describe('OpenRouterService Integration', () => {
  it('should generate valid itinerary', async () => {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log('Skipping integration test - no API key');
      return;
    }

    const service = new OpenRouterService(apiKey, {
      model: 'openai/gpt-3.5-turbo',
      timeout: 60000,
    });

    const result = await service.generateItinerary({
      destination: 'Paris, France',
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      description: 'Romantic trip, love art and food',
      durationDays: 3,
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.content.summary).toBeTruthy();
      expect(result.content.days).toHaveLength(3);
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.costUsd).toBeGreaterThan(0);

      // Sprawdź strukturę pierwszego dnia
      const day1 = result.content.days[0];
      expect(day1.day_number).toBe(1);
      expect(day1.activities.length).toBeGreaterThan(0);

      // Sprawdź strukturę pierwszej aktywności
      const activity1 = day1.activities[0];
      expect(activity1.time).toMatch(/^\d{2}:\d{2}$/);
      expect(activity1.title).toBeTruthy();
      expect(activity1.duration_minutes).toBeGreaterThan(0);
    }
  }, 120000); // 2 min timeout dla testu
});
```

#### 6.3 Uruchom testy

```bash
cd 10x-astro-starter
npm test
```

#### 6.4 Test Manualny - cURL

```bash
# 1. Zaloguj się i pobierz token
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Zapisz token jako JWT_TOKEN

# 2. Stwórz trip
curl -X POST http://localhost:4321/api/trips \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Barcelona, Spain",
    "start_date": "2025-09-01",
    "end_date": "2025-09-05",
    "description": "Love tapas and Gaudí architecture"
  }'

# Zapisz trip ID jako TRIP_ID

# 3. Wygeneruj AI itinerary
curl -X POST http://localhost:4321/api/trips/$TRIP_ID/generate-ai \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "temperature": 0.7
  }'

# Sprawdź response - powinien zawierać:
# - status: "completed"
# - ai_generated_content z days, summary, recommendations
# - ai_model: "openai/gpt-3.5-turbo"
# - ai_tokens_used: > 0
```

---

### Krok 7: Opcjonalne Ulepszenia

#### 7.1 Dodaj pole `ai_cost_usd` do bazy danych

**Migracja Supabase**:

```sql
-- Dodaj kolumnę dla kosztu
ALTER TABLE trips
ADD COLUMN ai_cost_usd DECIMAL(10, 6) DEFAULT NULL;

-- Dodaj komentarz
COMMENT ON COLUMN trips.ai_cost_usd IS 'Estimated cost in USD for AI generation';

-- Zaktualizuj typy
```

**Zaktualizuj typy**: Uruchom `supabase gen types typescript`

#### 7.2 Dodaj dashboard kosztów

**Endpoint**: `GET /api/users/me/ai-stats`

```typescript
export const GET: APIRoute = async ({ request }) => {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return auth.error;

  const { supabase, userId } = auth;

  // Pobierz statystyki
  const { data: logs } = await supabase
    .from('ai_generation_logs')
    .select('estimated_cost_usd, created_at')
    .eq('user_id', userId)
    .eq('status', 'success');

  const totalCost = logs?.reduce(
    (sum, log) => sum + (log.estimated_cost_usd || 0),
    0
  ) || 0;

  const thisMonth = logs?.filter(log => {
    const logDate = new Date(log.created_at);
    const now = new Date();
    return (
      logDate.getMonth() === now.getMonth() &&
      logDate.getFullYear() === now.getFullYear()
    );
  });

  const monthlyCost = thisMonth?.reduce(
    (sum, log) => sum + (log.estimated_cost_usd || 0),
    0
  ) || 0;

  return successResponse({
    total_cost_usd: totalCost,
    monthly_cost_usd: monthlyCost,
    generation_count: logs?.length || 0,
    monthly_generation_count: thisMonth?.length || 0,
  });
};
```

#### 7.3 Wsparcie dla różnych modeli

**Komponent do wyboru modelu**: `src/components/forms/ModelSelector.tsx`

```typescript
import { useState } from 'react';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  costLevel: 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
}

const MODELS: ModelOption[] = [
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and economical',
    costLevel: 'low',
    speed: 'fast',
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'High quality, detailed responses',
    costLevel: 'medium',
    speed: 'medium',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Balanced performance and cost',
    costLevel: 'medium',
    speed: 'medium',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Best quality, slower and more expensive',
    costLevel: 'high',
    speed: 'slow',
  },
];

export function ModelSelector({
  value,
  onChange
}: {
  value: string;
  onChange: (model: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">AI Model</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
      >
        {MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} - {model.description}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

### Krok 8: Czyszczenie i Dokumentacja

#### 8.1 Usuń stary kod (opcjonalnie)

```bash
# Jeśli nie potrzebujesz już AIService
# git rm src/services/ai.service.ts

# Lub zakomentuj i zostaw jako backup
mv src/services/ai.service.ts src/services/ai.service.ts.backup
```

#### 8.2 Zaktualizuj README

**Plik: `src/services/README.md`**

```markdown
# Services

## OpenRouterService

Usługa do generowania planów podróży za pomocą API OpenRouter.

### Użycie

\`\`\`typescript
import { OpenRouterService } from './services/openrouter.service';

const service = new OpenRouterService(
  import.meta.env.OPENROUTER_API_KEY,
  { model: 'openai/gpt-3.5-turbo' }
);

const result = await service.generateItinerary({
  destination: 'Tokyo, Japan',
  startDate: '2025-06-01',
  endDate: '2025-06-07',
  durationDays: 7,
});
\`\`\`

### Wspierane Modele

- `openai/gpt-3.5-turbo` - Szybki i ekonomiczny (domyślny)
- `openai/gpt-4-turbo` - Wysoka jakość
- `anthropic/claude-3-sonnet` - Zbalansowany
- `anthropic/claude-3-opus` - Najlepsza jakość

Zobacz pełną listę: https://openrouter.ai/models
```

#### 8.3 Zaktualizuj CLAUDE.md projektu

**Plik: `10x-astro-starter/CLAUDE.md`** (jeśli istnieje)

Dodaj sekcję:

```markdown
## AI Service (OpenRouter)

Aplikacja używa OpenRouter do generowania planów podróży. OpenRouter daje dostęp do wielu modeli LLM (GPT-4, Claude, Gemini).

### Konfiguracja

1. Pobierz klucz API: https://openrouter.ai/keys
2. Dodaj do `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

### Struktura odpowiedzi

Usługa zwraca ustrukturyzowany JSON zgodny z schematem `AIGeneratedContent`:
- `summary`: Podsumowanie podróży
- `days[]`: Dni z aktywnościami
- `recommendations`: Ogólne rekomendacje

Zobacz: `src/types/dto.ts` dla pełnej definicji typów.
```

---

### Krok 9: Deployment

#### 9.1 Konfiguracja zmiennych środowiskowych na produkcji

**DigitalOcean / Vercel / Render**:

```bash
# Dodaj zmienną środowiskową
OPENROUTER_API_KEY=sk-or-v1-your-production-key
```

**GitHub Actions Secrets** (dla CI/CD):

```yaml
# .github/workflows/deploy.yml
env:
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

#### 9.2 Monitoring

**Sentry / LogRocket** - dodaj tracking błędów:

```typescript
// W generateItinerary()
try {
  // ... kod
} catch (error) {
  // Log do Sentry
  Sentry.captureException(error, {
    tags: {
      service: 'openrouter',
      model: this.config.model,
    },
    extra: {
      tripContext,
    },
  });

  return {
    success: false,
    error: 'AI generation failed',
    code: 'API_ERROR',
  };
}
```

---

## 8. Checklist Wdrożenia

### Pre-Deployment
- [ ] Klucz API OpenRouter dodany do `.env`
- [ ] Zależności zainstalowane (`openai@latest`)
- [ ] Plik `openrouter.service.ts` stworzony
- [ ] Metoda `generateItinerary()` zaimplementowana
- [ ] JSON Schema w `buildResponseFormat()` zdefiniowany
- [ ] Wszystkie prywatne metody zaimplementowane
- [ ] API route zaktualizowany do używania `OpenRouterService`
- [ ] Testy jednostkowe napisane i przechodzą
- [ ] Test integracyjny wykonany pomyślnie
- [ ] Test manualny (cURL) wykonany

### Post-Deployment
- [ ] Zmienna `OPENROUTER_API_KEY` dodana na produkcji
- [ ] Pierwszy request wykonany pomyślnie
- [ ] Monitoring błędów skonfigurowany
- [ ] Koszty monitorowane
- [ ] Dokumentacja zaktualizowana
- [ ] Stary kod `ai.service.ts` usunięty lub zbackupowany

### Optional Enhancements
- [ ] Kolumna `ai_cost_usd` dodana do bazy danych
- [ ] Dashboard kosztów zaimplementowany
- [ ] Selektor modeli w UI dodany
- [ ] Retry logic zaimplementowany
- [ ] Rate limiting na poziomie aplikacji dodany

---

## 9. Troubleshooting

### Problem: "Invalid API key"
**Rozwiązanie**:
```typescript
// Sprawdź format klucza
console.log('API Key prefix:', apiKey.substring(0, 10));
// Powinno być: "sk-or-v1-"

// Sprawdź czy klucz jest załadowany
console.log('API Key loaded:', !!import.meta.env.OPENROUTER_API_KEY);
```

### Problem: "Model not available"
**Rozwiązanie**:
```typescript
// Sprawdź listę dostępnych modeli
const response = await fetch('https://openrouter.ai/api/v1/models', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  }
});
const models = await response.json();
console.log('Available models:', models);
```

### Problem: "Schema validation error"
**Rozwiązanie**:
```typescript
// Loguj surową odpowiedź
console.log('Raw AI response:', responseText);

// Sprawdź czy schema jest poprawny
const schema = this.buildResponseFormat();
console.log('Expected schema:', JSON.stringify(schema, null, 2));
```

### Problem: Wysokie koszty
**Rozwiązanie**:
```typescript
// Użyj tańszego modelu
const service = new OpenRouterService(apiKey, {
  model: 'openai/gpt-3.5-turbo', // Zamiast gpt-4
  maxTokens: 3000, // Ogranicz tokeny
});

// Dodaj budżet limit
if (monthlyCost >= MAX_BUDGET) {
  throw new Error('Budget exceeded');
}
```

---

## 10. Dodatkowe Zasoby

### Dokumentacja
- **OpenRouter Docs**: https://openrouter.ai/docs
- **OpenRouter Models**: https://openrouter.ai/models
- **OpenRouter Pricing**: https://openrouter.ai/docs#pricing
- **JSON Schema**: https://json-schema.org/
- **OpenAI SDK**: https://github.com/openai/openai-node

### Przykładowe Modele
```typescript
// Budżetowe
'openai/gpt-3.5-turbo'          // $0.5/$1.5 per 1M tokens
'google/gemini-pro'             // $0.5/$1.5 per 1M tokens

// Średnie
'openai/gpt-4-turbo'            // $10/$30 per 1M tokens
'anthropic/claude-3-sonnet'    // $3/$15 per 1M tokens

// Premium
'anthropic/claude-3-opus'      // $15/$75 per 1M tokens
'openai/gpt-4'                 // $30/$60 per 1M tokens
```

### Community
- **OpenRouter Discord**: https://discord.gg/openrouter
- **GitHub Issues**: https://github.com/OpenRouterTeam/openrouter/issues

---

## Podsumowanie

Ten przewodnik implementacji dostarcza:

1. ✅ **Pełną implementację usługi OpenRouter** z zachowaniem kompatybilności z obecnymi formatami JSON
2. ✅ **Prawidłowe użycie JSON Schema** dla strukturyzowanych odpowiedzi
3. ✅ **Obsługę błędów** na poziomie produkcyjnym
4. ✅ **Bezpieczeństwo** - ochrona API key, input sanitization
5. ✅ **Monitoring kosztów** - tracking wydatków na AI
6. ✅ **Krok po kroku deployment** - od developmentu do produkcji
7. ✅ **Testy** - unit, integration, manual
8. ✅ **Dokumentację** - inline comments, README, troubleshooting

**Następny krok**: Przejdź do implementacji według Kroku 1-9!
